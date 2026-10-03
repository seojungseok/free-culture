import test from "node:test";
import assert from "node:assert/strict";
import { dailyApiBudget } from "./daily-api-budget.mjs";

test("Korean Monday reserves the weekly collection allowance", () => {
  const sundayUtc = dailyApiBudget(new Date("2026-10-04T16:00:00Z"));
  assert.deepEqual(sundayUtc, { details: 20, images: 10, festivals: 10, festivalDetails: 90, weekly: 830, courseStops:20,coursePlaces:20,total: 1000 });
  const mondayUtcEvening = dailyApiBudget(new Date("2026-10-05T16:00:00Z"));
  assert.equal(mondayUtcEvening.weekly, 0);
  assert.equal(mondayUtcEvening.details, 100);
  assert.equal(mondayUtcEvening.images, 30);
  assert.equal(mondayUtcEvening.total, 350);
});

test("all daily and weekly envelopes stay within the conservative allowance", () => {
  for (let day = 3; day <= 10; day++) {
    const budget = dailyApiBudget(new Date(`2026-10-${String(day).padStart(2,"0")}T00:00:00Z`));
    assert.ok(budget.total <= 1000);
    assert.ok(budget.details <= 100 && budget.images <= 30);
  }
});
