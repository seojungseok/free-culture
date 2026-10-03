// Bounded, incremental detail cache. A failed/empty response never erases useful facts.
import { readCache, writeCache, detailCommon, createBudget, hasKey, sleep, QuotaError, safeApiError } from "./lib/tourClient.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RECHECK_MS = 30 * 86400000;
const DEFAULT_REQUEST_LIMIT = 20;
const MAX_REQUEST_LIMIT = 100;
function requestLimit(value) {
  const configured = Number(value);
  return Number.isFinite(configured) ? Math.max(1, Math.min(MAX_REQUEST_LIMIT, Math.floor(configured))) : DEFAULT_REQUEST_LIMIT;
}
function uniqueItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const id = String(item?.id || "");
    if (!id || seen.has(id)) return false;
    seen.add(id); return true;
  });
}
function roundRobin(queues) {
  const result = [], length = Math.max(0, ...queues.map((queue) => queue.length));
  for (let index = 0; index < length; index++) {
    for (const queue of queues) if (queue[index]) result.push(queue[index]);
  }
  return result;
}
export function queueDetailItems(places, restaurants) {
  // These tags only guide the collector queue; they are never written into source records.
  return uniqueItems(roundRobin([
    places.map((item) => ({ ...item, detailQueueCategory: "places" })),
    restaurants.map((item) => ({ ...item, detailQueueCategory: "restaurants" })),
  ]));
}
// Only per-ID ISO timestamps from successful requests can defer a recheck.
// A dataset's generatedAt and malformed/future dates never imply confirmation.
function actualCheckTime(value, nowMs) {
  const parts = typeof value === "string" && value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/);
  if (!parts) return null;
  const [year, month, day, hour, minute, second] = parts.slice(1).map(Number);
  const calendar = new Date(0);
  calendar.setUTCFullYear(year, month - 1, day);
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day
    || hour > 23 || minute > 59 || second > 59) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp <= nowMs ? timestamp : null;
}
function lastCheckTime(store, id, nowMs) {
  return actualCheckTime(store.successfulChecks?.[id], nowMs)
    ?? actualCheckTime(store.details?.[id]?.checkedAt, nowMs);
}
export function selectDetailIds(items, store, { requested = [], max = 20, nowMs = Date.now() } = {}) {
  const unique = uniqueItems(items);
  const eligible = requested.length ? unique.filter((item) => requested.includes(String(item.id))) : unique
    .filter((item) => { const checked = lastCheckTime(store, item.id, nowMs); return checked === null || nowMs - checked >= RECHECK_MS; });
  const categories = new Map();
  for (const item of eligible) {
    const category = item.detailQueueCategory || "places";
    if (!categories.has(category)) categories.set(category, []);
    categories.get(category).push(item);
  }
  if (!requested.length) {
    for (const queue of categories.values()) queue.sort((a, b) => {
      const aTime = lastCheckTime(store, a.id, nowMs), bTime = lastCheckTime(store, b.id, nowMs);
      if ((aTime === null) !== (bTime === null)) return aTime === null ? -1 : 1;
      return (aTime !== null && bTime !== null ? aTime - bTime : 0) || Number(Boolean(b.isKid)) - Number(Boolean(a.isKid));
    });
  }
  const targets = requested.length ? eligible : roundRobin([...categories.values()]);
  return targets.slice(0, max).map((item) => String(item.id));
}

export async function collectDetails({ items, store, overviews, requested = [], max = 20,
  now = () => new Date(), fetchDetail = detailCommon, pause = sleep, warn = console.error }) {
  max = requestLimit(max);
  store.details ||= {};
  store.successfulChecks ||= {};
  const ids = selectDetailIds(items, store, { requested, max, nowMs: now().getTime() });
  const budget = createBudget(max);
  let ok = 0, empty = 0, failures = 0, deferred = 0, attempted = 0, batchLimited = false, stopReason = null, overviewChanged = false;
  for (const id of ids) {
    // A completed record may consume retries. Finishing the batch before the next ID is normal;
    // exhaustion inside fetchDetail remains a real local-budget failure.
    if (budget.used >= budget.max) { batchLimited = true; break; }
    attempted++;
    try {
      const detail = await fetchDetail(id, budget);
      const checkedAt = now().toISOString();
      store.successfulChecks[id] = checkedAt;
      const values = Object.fromEntries(["overview", "homepage", "tel"]
        .filter((field) => typeof detail?.[field] === "string" && detail[field].trim())
        .map((field) => [field, detail[field].trim()]));
      if (!Object.keys(values).length) {
        empty++;
      } else {
        store.details[id] = { ...(store.details[id] || {}), ...values, checkedAt,
          ...Object.fromEntries(Object.keys(values).map((field) => [`${field}CheckedAt`, checkedAt])),
        };
        if (values.overview && overviews[id] !== values.overview) { overviews[id] = values.overview; overviewChanged = true; }
        ok++;
      }
    } catch (error) {
      if (error instanceof QuotaError && error.reason === "provider") deferred++;
      else failures++;
      warn(`장소 ${id}: ${safeApiError(error)}`);
      if (error instanceof QuotaError) { stopReason = error.reason; break; }
    } finally {
      await pause(250);
    }
  }
  const incomplete = failures > 0 || deferred > 0 || budget.stopped;
  const exitCode = failures || (budget.stopped && stopReason !== "provider") ? 1 : deferred ? 75 : 0;
  return { requested: ids.length, attempted, unprocessed: ids.length - attempted, batchLimited,
    retrieved: ok, empty, failures, deferred, stopReason, requests: budget.used,
    checked: ok + empty, overviewChanged, incomplete, exitCode };
}

async function main() {
  if (!hasKey()) throw new Error("공공 API 인증키 없음");
  const max = requestLimit(process.env.PLACE_DETAIL_DAILY || DEFAULT_REQUEST_LIMIT);
  const requested = (process.argv[2] || "").split(",").map((id) => id.trim()).filter(Boolean);
  const store = readCache("place-details.json", { details: {}, successfulChecks: {} });
  const overviews = readCache("place-overviews.json", {});
  const items = queueDetailItems(readCache("places.json", { spots: [] }).spots || [], readCache("restaurants.json", { restaurants: [] }).restaurants || []);
  const result = await collectDetails({ items, store, overviews, requested, max });
  if (result.checked) writeCache("place-details.json", store);
  if (result.overviewChanged) writeCache("place-overviews.json", overviews);
  console.log(JSON.stringify(result));
  process.exitCode = result.exitCode;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(safeApiError(error)); process.exitCode = 1; });
}
