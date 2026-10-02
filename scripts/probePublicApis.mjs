// Read-only health check: one row and at most one request per public source.
// Never print keys, request URLs, upstream bodies or provider error messages.
import { fetchJson, createBudget, BASE, PET_BASE, safeApiError } from "./lib/tourClient.mjs";

const from = new Date(Date.now() - 60 * 86400000 + 9 * 3600000).toISOString().slice(0, 10).replaceAll("-", "");
const jobs = [
  ["tour-places", BASE, "areaBasedList2", { areaCode: 1, contentTypeId: 12 }],
  ["tour-festivals", BASE, "searchFestival2", { eventStartDate: from }],
  ["camping", "https://apis.data.go.kr/B551011/GoCamping", "basedList", {}],
  ["pet-travel", PET_BASE, "areaBasedList2", { areaCode: 1 }],
];
const results = [];
for (const [source, base, endpoint, params] of jobs) {
  const budget = createBudget(1);
  try {
    const json = await fetchJson(endpoint, { ...params, numOfRows: 1, pageNo: 1 }, budget, base);
    const body = json.response?.body || {};
    const item = body.items?.item;
    const items = Array.isArray(item) ? item.length : item && typeof item === "object" ? 1 : 0;
    results.push({ source, state: items ? "ok" : "empty", resultCode: "0000", total: Number(body.totalCount || 0), sampleItems: items, requests: budget.used });
  } catch (error) {
    results.push({ source, state: "failed", reason: safeApiError(error), requests: budget.used });
  }
}

const index = process.argv.indexOf("--origin");
if (index >= 0 && process.argv[index + 1]) {
  const origin = new URL(process.argv[index + 1]).origin;
  for (const [source, route] of [["site-pet-cache", "/api/pet-travel"], ["site-nearby", "/api/nearby?area=%EC%84%9C%EC%9A%B8"]]) {
    try {
      const response = await fetch(origin + route, { signal: AbortSignal.timeout(20000), headers: { "User-Agent": "Mozilla/5.0 (compatible; mwohaji-audit/1.0)", Accept: "application/json" } });
      const body = await response.json();
      const items = body.items || body.results || [];
      results.push({ source, state: response.ok && Array.isArray(items) && items.length ? "ok" : "empty", status: response.status, total: body.total || items.length, sampleItems: items.length });
    } catch (error) {
      results.push({ source, state: "failed", reason: safeApiError(error) });
    }
  }
}
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), readOnly: true, results }));
if (results.some((result) => result.state !== "ok")) process.exitCode = 1;
