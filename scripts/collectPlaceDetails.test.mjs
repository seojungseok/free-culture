import test from "node:test";
import assert from "node:assert/strict";
import { collectDetails, selectDetailIds } from "./collectPlaceDetails.mjs";
import { QuotaError } from "./lib/tourClient.mjs";

const fixed = "2026-10-03T00:00:00.000Z";
const noPause = async () => {};
const fixtureFetch = (values) => async (id, budget) => {
  budget.used++;
  if (values[id] instanceof Error) throw values[id];
  return values[id];
};

test("normal empty response advances tomorrow's queue for 30 days", async () => {
  const items = [{ id: "empty", isKid: true }, { id: "next" }], store = { details: {} }, overviews = {};
  const result = await collectDetails({ items, store, overviews, max: 1, now: () => new Date(fixed), pause: noPause,
    fetchDetail: fixtureFetch({ empty: { overview: "", homepage: "", tel: "" } }) });
  assert.equal(result.empty, 1); assert.equal(result.checked, 1); assert.equal(result.incomplete, false);
  assert.equal(store.successfulChecks.empty, fixed);
  assert.equal(store.details.empty, undefined);
  assert.equal(store.generatedAt, undefined);
  assert.deepEqual(selectDetailIds(items, store, { max: 1, nowMs: Date.parse(fixed) + 86400000 }), ["next"]);
  assert.deepEqual(selectDetailIds([items[0]], store, { nowMs: Date.parse(fixed) + 29 * 86400000 }), []);
  assert.deepEqual(selectDetailIds([items[0]], store, { nowMs: Date.parse(fixed) + 30 * 86400000 }), ["empty"]);
});

test("partial failure preserves old values and timestamps while saving successful checks", async () => {
  const old = "2026-08-01T00:00:00.000Z";
  const previous = { overview: "기존 공식 소개", homepage: "https://official.example/", checkedAt: old, overviewCheckedAt: old, homepageCheckedAt: old };
  const store = { details: { fail: { ...previous } }, successfulChecks: { fail: old }, generatedAt: old }, overviews = { fail: previous.overview };
  const result = await collectDetails({ items: [{ id: "ok" }, { id: "fail" }], store, overviews, requested: ["ok", "fail"], max: 2,
    now: () => new Date(fixed), pause: noPause, warn: () => {}, fetchDetail: fixtureFetch({ ok: { overview: "새 공식 소개", tel: "" }, fail: new Error("HTTP 503") }) });
  assert.equal(result.incomplete, true); assert.equal(result.failures, 1); assert.equal(result.retrieved, 1);
  assert.deepEqual(store.details.fail, previous);
  assert.equal(store.successfulChecks.fail, old);
  assert.equal(overviews.fail, previous.overview);
  assert.equal(store.successfulChecks.ok, fixed);
  assert.equal(store.details.ok.overviewCheckedAt, fixed);
  assert.equal(store.details.ok.telCheckedAt, undefined);
  assert.equal(store.generatedAt, old);
});

test("an empty recheck cannot refresh old field confirmation dates", async () => {
  const old = "2026-08-01T00:00:00.000Z", store = { details: { retained: { overview: "기존 소개", checkedAt: old, overviewCheckedAt: old } } };
  const result = await collectDetails({ items: [{ id: "retained" }], store, overviews: { retained: "기존 소개" }, max: 1,
    now: () => new Date(fixed), pause: noPause, fetchDetail: fixtureFetch({ retained: {} }) });
  assert.equal(result.empty, 1);
  assert.equal(store.details.retained.checkedAt, old);
  assert.equal(store.details.retained.overviewCheckedAt, old);
  assert.equal(store.successfulChecks.retained, fixed);
});

test("invalid, future and aggregate dates cannot suppress an actual check", () => {
  const store = { generatedAt: fixed, details: { invalid: { checkedAt: "not-a-date" }, fresh: { checkedAt: fixed }, old: { checkedAt: "2026-08-01T00:00:00.000Z" } },
    successfulChecks: { future: "2027-01-01T00:00:00.000Z", invalid: "2026-13-01T00:00:00.000Z", rollover: "2026-02-30T00:00:00.000Z" } };
  const ids = selectDetailIds(["old", "invalid", "future", "unchecked", "rollover", "fresh"].map((id) => ({ id })), store, { nowMs: Date.parse(fixed) });
  assert.deepEqual(ids, ["invalid", "future", "unchecked", "rollover", "old"]);
  assert.equal(store.details.invalid.checkedAt, "not-a-date");
  assert.equal(store.details.unchecked, undefined);
});

test("budget stop reports incompleteness without discarding preceding success", async () => {
  const store = { details: {} }, overviews = {};
  const result = await collectDetails({ items: [{ id: "first" }, { id: "stopped" }], store, overviews, max: 2,
    now: () => new Date(fixed), pause: noPause, warn: () => {}, fetchDetail: async (id, budget) => {
      if (id === "stopped") { budget.stopped = true; throw new QuotaError("budget reached"); }
      budget.used++; return { overview: "검증 소개" };
    } });
  assert.equal(result.incomplete, true);
  assert.equal(store.details.first.overview, "검증 소개");
  assert.equal(store.successfulChecks.first, fixed);
  assert.equal(store.successfulChecks.stopped, undefined);
});
