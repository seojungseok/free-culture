import test from "node:test";
import assert from "node:assert/strict";
import { createBudget, fetchJson, BASE, PET_BASE, tourArea, safeApiError, QuotaError } from "./tourClient.mjs";
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
    await assert.rejects(fetchJson("areaBasedList2", {}, budget), (error) => error instanceof QuotaError && error.reason === "local");
    assert.equal(attempts, 1); assert.equal(budget.used, 1); assert.equal(budget.stopped, true);
  } finally { globalThis.fetch = originalFetch; if (originalKey === undefined) delete process.env.TOUR_API_KEY; else process.env.TOUR_API_KEY = originalKey; }
});

test("local budget is distinct from a provider limit and makes no request", async () => {
  const originalFetch = globalThis.fetch, originalKey = process.env.TOUR_API_KEY;
  process.env.TOUR_API_KEY = "tour-test-only";
  let attempts = 0;
  globalThis.fetch = async () => { attempts++; throw new Error("must not be called"); };
  const budget = createBudget(1); budget.used = 1;
  try {
    await assert.rejects(fetchJson("detailCommon2", {}, budget), (error) => {
      assert.equal(error.reason, "local"); assert.equal(error.endpoint, "detailCommon2");
      assert.equal(error.status, undefined); assert.match(safeApiError(error), /수집기 요청 예산.*reason=local/);
      return error instanceof QuotaError;
    });
    assert.equal(attempts, 0); assert.equal(budget.used, 1);
  } finally { globalThis.fetch = originalFetch; if (originalKey === undefined) delete process.env.TOUR_API_KEY; else process.env.TOUR_API_KEY = originalKey; }
});

for (const fixture of [
  { label: "HTTP 429", status: 429, body: "fixture-sensitive-query", code: undefined },
  { label: "provider limit text", status: 200, body: "LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR fixture-sensitive-query", code: "LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR" },
  { label: "JSON resultCode 22", status: 200, body: JSON.stringify({ response: { header: { resultCode: "22" } } }), code: "22" },
  { label: "XML resultCode 22", status: 200, body: "<OpenAPI_ServiceResponse><returnReasonCode>22</returnReasonCode><detail>fixture-sensitive-query</detail></OpenAPI_ServiceResponse>", code: "22" },
]) {
  test(`${fixture.label} defers without retrying or rotating credentials`, async () => {
    const originalFetch = globalThis.fetch;
    const originalKeys = { TOUR_API_KEY: process.env.TOUR_API_KEY, DATA_GO_KR_KEY: process.env.DATA_GO_KR_KEY };
    process.env.TOUR_API_KEY = "tour-test-only"; process.env.DATA_GO_KR_KEY = "fallback-test-only";
    const keys = [];
    globalThis.fetch = async (url) => { keys.push(new URL(url).searchParams.get("serviceKey")); return new Response(fixture.body, { status: fixture.status }); };
    const budget = createBudget(20);
    try {
      await assert.rejects(fetchJson("detailCommon2", {}, budget), (error) => {
        assert.equal(error.reason, "provider"); assert.equal(error.status, fixture.status);
        assert.equal(error.code, fixture.code); assert.equal(error.endpoint, "detailCommon2");
        assert.match(safeApiError(error), /갱신을 연기.*reason=provider/);
        assert.equal(safeApiError(error).includes("fixture-sensitive-query"), false);
        return error instanceof QuotaError;
      });
      await assert.rejects(fetchJson("detailIntro2", {}, budget), (error) => error instanceof QuotaError && error.reason === "provider");
      assert.deepEqual(keys, ["tour-test-only"]);
      assert.equal(budget.used, 1); assert.equal(budget.stopped, true);
    } finally {
      globalThis.fetch = originalFetch;
      for (const [key, value] of Object.entries(originalKeys)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    }
  });
}

test("quota diagnostics reject URLs, response messages and arbitrary codes", () => {
  const error = new QuotaError("provider", { status: "429", code: "fixture-sensitive-query", endpoint: "https://example.test/?serviceKey=fixture-sensitive-query" });
  assert.equal(error.status, undefined); assert.equal(error.code, undefined); assert.equal(error.endpoint, undefined);
  assert.equal(safeApiError(error), "제공기관 API 요청 한도에 도달하여 갱신을 연기합니다 (reason=provider)");
  assert.equal(JSON.stringify(error).includes("fixture-sensitive-query"), false);
  assert.equal(new QuotaError().endpoint, undefined);
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
