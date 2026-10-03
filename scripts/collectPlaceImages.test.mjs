import test from "node:test";
import assert from "node:assert/strict";
import { collectImages, normalizeImages, selectImageIds } from "./collectPlaceImages.mjs";
import { QuotaError } from "./lib/tourClient.mjs";

const fixed = "2026-10-03T00:00:00.000Z", old = "2026-08-01T00:00:00.000Z";
const day = 86400000;
const noPause = async () => {};
const options = { now: () => new Date(fixed), pause: noPause, warn: () => {} };
const image = (name) => ({ full: `https://photos.example/${name}.jpg`, thumb: `https://photos.example/${name}-small.jpg` });
const row = (name) => ({ originimgurl: image(name).full, smallimageurl: image(name).thumb });
const fixtureFetch = (values) => async (id, type, budget) => {
  budget.used++;
  if (values[id] instanceof Error) throw values[id];
  return values[id];
};

test("normal empty results skip that ID for 30 days, including requested IDs", async () => {
  const store = { details: {} }, items = [{ id: "empty", type: "12" }, { id: "next", type: "39" }];
  const result = await collectImages({ items, store, max: 1, ...options, fetchImages: fixtureFetch({ empty: [] }) });
  assert.equal(result.checked, 1); assert.equal(result.empty, 1); assert.equal(result.exitCode, 0);
  assert.deepEqual(store.details.empty, { imageCheckedAt: fixed });
  assert.deepEqual(selectImageIds(items, store, { max: 1, nowMs: Date.parse(fixed) + day }), ["next"]);
  assert.deepEqual(selectImageIds(items, store, { requested: ["empty"], nowMs: Date.parse(fixed) + 29 * day }), []);
  assert.deepEqual(selectImageIds(items, store, { requested: ["empty"], nowMs: Date.parse(fixed) + 30 * day }), ["empty"]);
});

test("successful images append unique full URLs and preserve every existing fact and date", async () => {
  const previous = { overview: "공식 소개", homepage: "https://official.example/", checkedAt: old,
    overviewCheckedAt: old, images: [image("old")], imagesCheckedAt: old, imageCheckedAt: old };
  const store = { generatedAt: old, successfulChecks: { retained: old }, details: { retained: structuredClone(previous) } };
  const result = await collectImages({ items: [{ id: "retained", type: "39" }], store, ...options,
    fetchImages: async (id, type, budget) => { assert.equal(type, "39"); budget.used++; return [row("old"), row("new"), row("new")]; } });
  assert.equal(result.added, 1);
  assert.deepEqual(store.details.retained, { ...previous, images: [image("old"), image("new")], imageCheckedAt: fixed });
  assert.equal(store.generatedAt, old); assert.deepEqual(store.successfulChecks, { retained: old });
});

test("first images have an actual image date without inventing a description date", async () => {
  const store = { details: {} };
  await collectImages({ items: [{ id: "new" }], store, ...options, fetchImages: fixtureFetch({ new: [row("new")] }) });
  assert.deepEqual(store.details.new, { images: [image("new")], imageCheckedAt: fixed, imagesCheckedAt: fixed });
  assert.equal(store.details.new.checkedAt, undefined);
});

test("empty rechecks keep useful images and their original successful date", async () => {
  const previous = { overview: "기존 소개", checkedAt: old, images: [image("old")], imagesCheckedAt: old, imageCheckedAt: old };
  const store = { details: { retained: structuredClone(previous) } };
  const result = await collectImages({ items: [{ id: "retained" }], store, ...options, fetchImages: fixtureFetch({ retained: [] }) });
  assert.equal(result.empty, 1);
  assert.deepEqual(store.details.retained, { ...previous, imageCheckedAt: fixed });
});

test("legacy image, description and file dates do not masquerade as an image check", () => {
  const store = { generatedAt: fixed, details: {
    legacy: { checkedAt: fixed, imagesCheckedAt: fixed, images: [image("old")] },
    invalid: { imageCheckedAt: "not-a-date" }, future: { imageCheckedAt: "2027-01-01T00:00:00.000Z" },
    rollover: { imageCheckedAt: "2026-02-30T00:00:00.000Z" },
    old: { imageCheckedAt: old }, fresh: { imageCheckedAt: fixed },
  } };
  assert.deepEqual(selectImageIds(["old", "fresh", "legacy", "invalid", "future", "rollover"].map((id) => ({ id })), store,
    { nowMs: Date.parse(fixed) }), ["legacy", "invalid", "future", "rollover", "old"]);
});

test("selection deduplicates place and restaurant IDs and excludes unknown requested IDs", () => {
  const items = [{ id: "shared", type: "12" }, { id: "shared", type: "39" }, { id: "restaurant", type: "39" }, { id: "" }, null];
  assert.deepEqual(selectImageIds(items, {}, { nowMs: Date.parse(fixed) }), ["shared", "restaurant"]);
  assert.deepEqual(selectImageIds(items, {}, { requested: ["missing", "restaurant"], nowMs: Date.parse(fixed) }), ["restaurant"]);
});

test("failed and malformed responses preserve the record, including image timestamps", async () => {
  for (const failure of [new Error("HTTP 503"), undefined, { originimgurl: image("new").full }]) {
    const previous = { checkedAt: old, images: [image("old")], imageCheckedAt: old, imagesCheckedAt: old };
    const store = { details: { failed: structuredClone(previous) } };
    const result = await collectImages({ items: [{ id: "failed" }], store, ...options, fetchImages: fixtureFetch({ failed: failure }) });
    assert.equal(result.exitCode, 1); assert.equal(result.failures, 1); assert.equal(result.checked, 0);
    assert.deepEqual(store.details.failed, previous);
  }
});

test("provider quota returns 75, preserves failed data, and saves preceding success", async () => {
  const previous = { images: [image("old")], imageCheckedAt: old, imagesCheckedAt: old };
  const store = { details: { stopped: structuredClone(previous), later: { imageCheckedAt: old } } };
  const result = await collectImages({ items: [{ id: "ok" }, { id: "stopped" }, { id: "later" }], store, ...options,
    fetchImages: fixtureFetch({ ok: [row("new")], stopped: new QuotaError("provider", { status: 429, endpoint: "detailImage2" }) }) });
  assert.equal(result.exitCode, 75); assert.equal(result.deferred, 1); assert.equal(result.failures, 0);
  assert.equal(result.requests, 2); assert.equal(result.unprocessed, 1); assert.equal(result.stopReason, "provider");
  assert.deepEqual(store.details.stopped, previous); assert.deepEqual(store.details.later, { imageCheckedAt: old });
  assert.deepEqual(store.details.ok.images, [image("new")]);
});

test("ordinary failures outrank provider deferral and produce exit 1", async () => {
  const store = { details: {} };
  const result = await collectImages({ items: [{ id: "fail" }, { id: "quota" }], store, ...options,
    fetchImages: fixtureFetch({ fail: new Error("HTTP 500"), quota: new QuotaError("provider") }) });
  assert.equal(result.exitCode, 1); assert.equal(result.failures, 1); assert.equal(result.deferred, 1);
  assert.deepEqual(store.details, {});
});

test("default cap counts retried attempts and stops before an eleventh request", async () => {
  const store = { details: {} }, calls = [];
  const result = await collectImages({ items: Array.from({ length: 20 }, (_, i) => ({ id: String(i) })), store, ...options,
    fetchImages: async (id, type, budget) => { calls.push(id); budget.used += 2; assert.ok(budget.used <= budget.max); return []; } });
  assert.equal(result.requests, 10); assert.equal(calls.length, 5); assert.equal(result.checked, 5);
  assert.equal(result.unprocessed, 5); assert.equal(result.exitCode, 0);
  assert.equal(selectImageIds(Array.from({ length: 40 }, (_, i) => ({ id: String(i) })), {}, { max: 100 }).length, 30);
});

test("explicit daily budget permits 30 requests while keeping the default at 10", async () => {
  const items = Array.from({ length: 40 }, (_, i) => ({ id: String(i) }));
  const store = { details: {} }, calls = [];
  const result = await collectImages({ items, store, max: 30, ...options,
    fetchImages: async (id, type, budget) => { calls.push(id); budget.used++; assert.ok(budget.used <= 30); return []; } });
  assert.equal(result.requests, 30); assert.equal(result.checked, 30); assert.equal(calls.length, 30);
  assert.equal(result.exitCode, 0);
  assert.equal(selectImageIds(items, {}, { nowMs: Date.parse(fixed) }).length, 10);
});

test("place and restaurant queues alternate even when restaurants have older successful checks", () => {
  const items = [
    ...Array.from({ length: 30 }, (_, i) => ({ id: `place-${i}`, type: "12" })),
    ...Array.from({ length: 3 }, (_, i) => ({ id: `food-${i}`, type: "39" })),
  ];
  const store = { details: { "food-0": { imageCheckedAt: old }, "food-1": { imageCheckedAt: "2026-09-01T00:00:00.000Z" } } };
  assert.deepEqual(selectImageIds(items, store, { max: 6, nowMs: Date.parse(fixed) }),
    ["place-0", "food-2", "place-1", "food-0", "place-2", "food-1"]);
  assert.deepEqual(selectImageIds(items, store, { max: 8, nowMs: Date.parse(fixed) }),
    ["place-0", "food-2", "place-1", "food-0", "place-2", "food-1", "place-3", "place-4"]);
});

test("a retry exhausting its budget is a failure with no false check timestamp", async () => {
  const store = { details: {} };
  const result = await collectImages({ items: [{ id: "retry" }], store, max: 2, ...options,
    fetchImages: async (id, type, budget) => { budget.used = 2; budget.stopped = true; throw new QuotaError("local"); } });
  assert.equal(result.exitCode, 1); assert.equal(result.requests, 2); assert.equal(result.stopReason, "local");
  assert.equal(store.details.retry, undefined);
});

test("normalization only accepts actual HTTP image URLs and deduplicates them", () => {
  assert.deepEqual(normalizeImages([
    { originimgurl: "http://photos.example/a.jpg", smallimageurl: "http://photos.example/a-small.jpg" },
    { originimgurl: "https://photos.example/a.jpg" },
    { originimgurl: "javascript:alert(1)" }, { originimgurl: "/relative.jpg" },
    { originimgurl: "", smallimageurl: "https://photos.example/thumb-only.jpg" },
  ]), [image("a"), { full: "https://photos.example/thumb-only.jpg", thumb: "https://photos.example/thumb-only.jpg" }]);
});
