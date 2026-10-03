import test from "node:test";
import assert from "node:assert/strict";
import { collectFestivalDetails, selectFestivalDetails } from "./enrichFestivals.mjs";
import { QuotaError } from "./lib/tourClient.mjs";

const fixed = "2026-10-03T00:00:00.000Z";
const old = "2026-08-01T00:00:00.000Z";
const festival = (id) => ({ id, title: id, startDate: "20261003", endDate: "20261005", description: "기존 소개", homepage: "https://official.example/" });
function dependencies(commonValues, infoValues = {}) {
  const request = (values, fallback) => async (id, ...args) => {
    const budget = args.at(-1); budget.used++;
    const value = values[id] ?? fallback;
    if (value instanceof Error) throw value;
    return value;
  };
  return { now: () => new Date(fixed), pause: async () => {}, warn: () => {},
    fetchCommon: request(commonValues, { overview: "새 공식 소개", homepage: "", tel: "" }),
    fetchIntro: request({}, {}), fetchInfo: request(infoValues, []), fetchImages: request({}, []) };
}

test("festival provider quota defers, preserves preceding success and does not freshen the failed record", async () => {
  const previous = festival("limited"), store = { generatedAt: old, count: 2, festivals: [festival("first"), { ...previous }] };
  const result = await collectFestivalDetails({ store, count: 2, ...dependencies({ limited: new QuotaError("provider", { status: 429, endpoint: "detailCommon2" }) }) });
  assert.equal(result.completed, 1); assert.equal(result.failures, 0); assert.equal(result.deferred, 1);
  assert.equal(result.exitCode, 75); assert.equal(result.stopReason, "provider"); assert.equal(result.requests, 8);
  assert.equal(store.festivals[0].description, "새 공식 소개"); assert.equal(store.festivals[0].enrichedAt, fixed);
  assert.deepEqual(store.festivals[1], previous); assert.equal(store.generatedAt, fixed);
});

test("provider-only festival deferral does not alter any freshness timestamp", async () => {
  const store = { generatedAt: old, count: 1, festivals: [festival("limited")] }, previous = structuredClone(store);
  const result = await collectFestivalDetails({ store, ...dependencies({ limited: new QuotaError("provider", { code: "22", endpoint: "detailCommon2" }) }) });
  assert.equal(result.exitCode, 75); assert.equal(result.completed, 0); assert.equal(result.deferred, 1);
  assert.deepEqual(store, previous);
});

test("local festival budget exhaustion remains a failure", async () => {
  const store = { generatedAt: old, count: 1, festivals: [festival("limited")] }, previous = structuredClone(store);
  const result = await collectFestivalDetails({ store, ...dependencies({ limited: new QuotaError("local", { endpoint: "detailCommon2" }) }) });
  assert.equal(result.exitCode, 1); assert.equal(result.failures, 1); assert.equal(result.deferred, 0);
  assert.equal(result.stopReason, "local"); assert.deepEqual(store, previous);
});

test("a real error in another concurrent festival request is not masked by provider quota", async () => {
  const store = { generatedAt: old, count: 1, festivals: [festival("limited")] }, previous = structuredClone(store);
  const result = await collectFestivalDetails({ store, ...dependencies(
    { limited: new QuotaError("provider", { status: 429, endpoint: "detailCommon2" }) }, { limited: new Error("HTTP 403") }) });
  assert.equal(result.exitCode, 1); assert.equal(result.failures, 1); assert.equal(result.deferred, 1);
  assert.deepEqual(store, previous);
});

test("normal empty festival responses advance the queue for seven days without renewing facts", async () => {
  const original = { ...festival("empty"), enrichedAt: old, intro: { program: "기존 프로그램" } };
  const store = { generatedAt: old, count: 1, festivals: [{ ...original }] };
  const result = await collectFestivalDetails({ store, count: 1, ...dependencies({ empty: { overview: "", homepage: "", tel: "" } }) });
  assert.equal(result.exitCode, 0); assert.equal(result.empty, 1); assert.equal(result.checked, 1); assert.equal(result.failures, 0);
  assert.deepEqual(store.festivals[0], { ...original, detailCheckedAt: fixed });
  assert.equal(store.generatedAt, old);
  store.festivals.push(festival("next"));
  assert.deepEqual(selectFestivalDetails(store.festivals, { nowMs: Date.parse(fixed) + 86400000 }).map((entry) => entry.id), ["next"]);
  assert.deepEqual(selectFestivalDetails([store.festivals[0]], { nowMs: Date.parse(fixed) + 6 * 86400000 }).map((entry) => entry.id), []);
  // Retain a date-less record for the seven-day recheck boundary test.
  const withoutDates = { ...store.festivals[0], startDate: "", endDate: "" };
  assert.deepEqual(selectFestivalDetails([withoutDates], { nowMs: Date.parse(fixed) + 7 * 86400000 }).map((entry) => entry.id), ["empty"]);
});

test("selection skips expired records without deletion, keeps undated sources and prioritizes unchecked then oldest", () => {
  const entries = [
    { ...festival("expired"), endDate: "20261002" },
    { ...festival("oldest"), detailCheckedAt: "2026-09-01T00:00:00.000Z" },
    { ...festival("recent"), detailCheckedAt: "2026-10-01T00:00:00.000Z" },
    { ...festival("older"), detailCheckedAt: "2026-09-20T00:00:00.000Z" },
    { id: "undated", startDate: "", endDate: "" },
    festival("unchecked"),
    { ...festival("future"), detailCheckedAt: "2027-01-01T00:00:00.000Z" },
    { ...festival("invalid"), detailCheckedAt: "2026-02-30T00:00:00.000Z", endDate: "20260230" },
  ];
  const original = structuredClone(entries);
  assert.deepEqual(selectFestivalDetails(entries, { nowMs: Date.parse(fixed) }).map((entry) => entry.id), ["unchecked", "future", "undated", "invalid", "oldest", "older"]);
  assert.deepEqual(entries, original);
  assert.equal(entries.length, 8);
});

test("a successful text refresh preserves established gallery images when the image API is empty", async () => {
  const store = { count: 1, festivals: [{ ...festival("first"), images: ["https://official.example/gallery.jpg"] }] };
  const result = await collectFestivalDetails({ store, ...dependencies({}) });
  assert.equal(result.exitCode, 0); assert.equal(result.completed, 1);
  assert.deepEqual(store.festivals[0].images, ["https://official.example/gallery.jpg"]);
  assert.equal(store.festivals[0].detailCheckedAt, fixed);
});
