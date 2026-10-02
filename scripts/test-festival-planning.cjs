const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), Module = require("node:module"), ts = require("typescript");
const root = path.resolve(__dirname, "..");
const originalResolve = Module._resolveFilename;
const originalJs = Module._extensions[".js"];
Module._resolveFilename = function(request, parent, ...args) { return originalResolve.call(this, request.startsWith("@/") ? path.join(root, request.slice(2)) : request, parent, ...args); };
function compile(module, filename) { module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename); }
Module._extensions[".ts"] = compile;
Module._extensions[".js"] = (module, filename) => filename.startsWith(path.join(root, "lib") + path.sep) ? compile(module, filename) : originalJs(module, filename);
const { festivalStatus, festivalDateLabel, festivalVisitInfo, festivalVisitChecks, getFestivalById } = require("../lib/festivals.ts");
const festival = { id: "test", title: "축제", area: "서울", addr: "", image: "", mapx: "", mapy: "", startDate: "20261002", endDate: "20261004" };
assert.equal(festivalStatus(festival, "20261001"), "upcoming");
assert.equal(festivalStatus(festival, "20261002"), "ongoing");
assert.equal(festivalStatus(festival, "20261004"), "ongoing");
assert.equal(festivalStatus(festival, "20261005"), "ended");
assert.equal(festivalStatus({ ...festival, startDate: "20260230" }), "unknown");
assert.equal(festivalStatus({ ...festival, endDate: "20260930" }), "unknown");
assert.equal(festivalDateLabel("20261003"), "2026.10.03 (토)");
const mixed = festivalVisitInfo({ ...festival, intro: { usetime: "입장 무료, 체험 5,000원", playtime: "09:00~17:00", agelimit: "만 8세 이상" } });
assert.equal(mixed.fee, "입장 무료, 체험 5,000원");
assert.equal(mixed.hours, "09:00~17:00");
assert.equal(mixed.age, "만 8세 이상");
const noInfo = festivalVisitInfo({ ...festival, title: "무료 가족축제", intro: { usetime: "정보 없음", playtime: "null" } });
assert.deepEqual(noInfo, { hours: "", fee: "", age: "", reservation: "" }, "title keywords must not imply price, age, or opening hours");
const booking = festivalVisitInfo({ ...festival, info: [{ name: "사전예약 안내", text: "온라인 신청, 회차별 20명" }] });
assert.equal(booking.reservation, "온라인 신청, 회차별 20명");
assert.ok(festivalVisitChecks(festival).some((check) => check.detail.includes("요금 안내가 없습니다")));
assert.ok(!festivalVisitChecks(festival).some((check) => check.id === "age"));
const actual = getFestivalById("234232");
if (actual?.intro?.usetime) {
  const actualFacts = festivalVisitInfo(actual);
  assert.equal(actualFacts.fee, actual.intro.usetime);
  assert.equal(actualFacts.hours, actual.intro.playtime || "");
}
console.log("PASS: festival date boundaries, actual fee/time distinction, booking facts, and no inferred free or child conditions.");
