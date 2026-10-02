import test from "node:test";
import assert from "node:assert/strict";
import { createBudget, fetchJson, BASE, PET_BASE, tourArea, safeApiError } from "./tourClient.mjs";
import { mergeCollectedRecord, checkedSnapshot } from "./collectorState.mjs";

test("partial collection preserves established IDs and missing official facts", () => {
  const checkedAt = "2026-10-03T00:00:00.000Z";
  const previous = { generatedAt: "2026-07-25T00:00:00.000Z", spots: [{ id: "old", homepage: "https://official.example/", image: "/old.webp" }, { id: "retained" }] };
  const updated = mergeCollectedRecord(previous.spots[0], { id: "old", homepage: "", image: "", tel: "02-123-4567" }, checkedAt);
  const result = checkedSnapshot(previous, [updated, previous.spots[1]], "spots", { checkedAt, calls: 1, failures: 1 });
  assert.equal(result.spots[0].homepage, "https://official.example/");
  assert.equal(result.spots[0].image, "/old.webp");
  assert.equal(result.spots[1].id, "retained");
  assert.equal(result.spots[1].checkedAt, undefined);
  assert.equal(result.refresh.checkedRecords, 1);
  assert.equal(result.incompleteRefresh, true);
  const newlyCollected = mergeCollectedRecord(undefined, { id: "new", tel: "", intro: "", addr: "" }, checkedAt);
  assert.equal(newlyCollected.tel, "");
  assert.equal(newlyCollected.intro, "");
  assert.equal(newlyCollected.addr, "");
});

test("national festival records use legal-region codes when legacy codes are absent", () => {
  assert.equal(tourArea({ lDongRegnCd: "26", areacode: "" }), "부산");
  assert.equal(tourArea({ lDongRegnCd: "51" }), "강원");
  assert.equal(tourArea({ areacode: "39" }), "제주");
  assert.equal(tourArea({}, "서울"), "서울");
});

test("pet credentials never override the general TourAPI credential", async () => {
  const originalFetch = globalThis.fetch;
  const original = { TOUR_API_KEY: process.env.TOUR_API_KEY, PET_TOUR_API_KEY: process.env.PET_TOUR_API_KEY, DATA_GO_KR_KEY: process.env.DATA_GO_KR_KEY };
  process.env.TOUR_API_KEY = "tour-test-only";
  process.env.PET_TOUR_API_KEY = "pet-test-only";
  const keys = [];
  globalThis.fetch = async (url) => { keys.push(new URL(url).searchParams.get("serviceKey")); return new Response(JSON.stringify({ response: { header: { resultCode: "0000" }, body: {} } })); };
  try {
    await fetchJson("areaBasedList2", {}, createBudget(1), BASE);
    await fetchJson("areaBasedList2", {}, createBudget(1), PET_BASE);
    assert.deepEqual(keys, ["tour-test-only", "pet-test-only"]);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(original)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});

test("network failures count toward the request cap before a retry", async () => {
  const originalFetch = globalThis.fetch, originalKey = process.env.TOUR_API_KEY;
  process.env.TOUR_API_KEY = "tour-test-only";
  let attempts = 0;
  globalThis.fetch = async () => { attempts++; throw new Error("network failure"); };
  const budget = createBudget(1);
  try {
    await assert.rejects(fetchJson("areaBasedList2", {}, budget), /budget reached/);
    assert.equal(attempts, 1); assert.equal(budget.used, 1); assert.equal(budget.stopped, true);
  } finally { globalThis.fetch = originalFetch; if (originalKey === undefined) delete process.env.TOUR_API_KEY; else process.env.TOUR_API_KEY = originalKey; }
});

test("HTTP failures never copy an upstream body into an error", async () => {
  const originalFetch = globalThis.fetch, originalKey = process.env.TOUR_API_KEY;
  process.env.TOUR_API_KEY = "tour-test-only";
  globalThis.fetch = async () => new Response("request-with-sensitive-query", { status: 403 });
  try {
    await assert.rejects(fetchJson("areaBasedList2", {}, createBudget(1)), { message: "HTTP 403" });
    assert.equal(safeApiError(new Error("request-with-sensitive-query")), "API 응답을 확인하지 못했습니다");
  } finally { globalThis.fetch = originalFetch; if (originalKey === undefined) delete process.env.TOUR_API_KEY; else process.env.TOUR_API_KEY = originalKey; }
});

test("XML authentication errors are recognized without copying the request body", async () => {
  const originalFetch = globalThis.fetch, originalKey = process.env.TOUR_API_KEY;
  process.env.TOUR_API_KEY = "tour-test-only";
  let attempts = 0;
  globalThis.fetch = async () => { attempts++; return new Response("<OpenAPI_ServiceResponse><returnReasonCode>30</returnReasonCode><detail>sensitive-request</detail></OpenAPI_ServiceResponse>"); };
  try {
    await assert.rejects(fetchJson("areaBasedList2", {}, createBudget(3)), { message: "resultCode=30" });
    assert.equal(attempts, 1);
  } finally { globalThis.fetch = originalFetch; if (originalKey === undefined) delete process.env.TOUR_API_KEY; else process.env.TOUR_API_KEY = originalKey; }
});
