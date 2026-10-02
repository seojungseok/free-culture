// Regression checks use stored notices without rewriting data or calling APIs.
const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), Module = require("node:module"), ts = require("typescript");
const root = path.resolve(__dirname, "..");
const originalResolve = Module._resolveFilename, originalJs = Module._extensions[".js"];
Module._resolveFilename = function(request, parent, ...args) { return originalResolve.call(this, request.startsWith("@/") ? path.join(root, request.slice(2)) : request, parent, ...args); };
function compile(module, filename) { module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename); }
Module._extensions[".ts"] = compile;
Module._extensions[".js"] = (module, filename) => filename.startsWith(path.join(root, "lib") + path.sep) ? compile(module, filename) : originalJs(module, filename);
const { classifyAdmission } = require("../lib/admission.js");
const { analyzePrice, FREE_LIKE } = require("../lib/price.js");
const { getAdmission } = require("../lib/fees.ts");
const { getIntro, introRows } = require("../lib/tourExtra.ts");
const examples = [
  ["무료", "free"], ["전관 무료", "free"], ["0원", "free"], ["입장료 없음", "free"], ["관람료 없음", "free"],
  ["5,000원", "paid"], ["유료", "paid"], ["1만원", "paid"], ["5천원", "paid"],
  ["전시시설 무료 / 체험 프로그램 유료", "unknown"], ["입장 무료, 체험 5,000원", "unknown"],
  ["무료 (특별전의 경우 유료)", "unknown"], ["무료 (체험료 별도)", "unknown"],
  ["어린이 무료", "unknown"], ["국가유공자 무료", "unknown"], ["주말 무료", "unknown"],
  ["0원 / 체험 3,000원", "unknown"], ["정보 없음", "unknown"], ["0", "unknown"], ["전화 문의", "unknown"],
];
for (const [text, expected] of examples) assert.equal(classifyAdmission(text), expected, text);
const event = analyzePrice("전시시설 무료 / 체험 프로그램 유료");
assert.equal(event.type, "partial_free");
assert.ok(!FREE_LIKE.has(event.type), "a mixed event must not pass the free-only filter");
assert.equal(analyzePrice("무료").type, "free");
const source = JSON.parse(fs.readFileSync(path.join(root, "data/place-intro.json"), "utf8")).intro;
const conditional = Object.entries(source).filter(([, value]) => value.admission === "free" && /유료|별도|유상|프로그램마다|전시.*상이/.test(value.fee || ""));
assert.ok(conditional.length >= 27, "cover the existing mixed-fee notices found in the audit");
for (const [id, value] of conditional) {
  assert.equal(getAdmission(id), "unknown", `${id}: legacy fees must not override a conditional notice`);
  assert.equal(getIntro(id).admission, "unknown", `${id}: detail and list badges must agree`);
  assert.equal(getIntro(id).fee, value.fee, `${id}: preserve the complete source fee`);
  assert.ok(introRows(id).some((row) => row.label === "이용요금" && row.value === value.fee), `${id}: source fee stays visible`);
}
const purelyFree = Object.entries(source).filter(([, value]) => value.fee?.trim() === "무료");
assert.ok(purelyFree.length > 0);
for (const [id] of purelyFree) {
  assert.equal(getAdmission(id), "free", `${id}: preserve explicit free admission`);
  assert.equal(getIntro(id).admission, "free");
}
console.log(JSON.stringify({ status: "PASS", conditionalFreeBadgesRemoved: conditional.length, explicitFreeNoticesPreserved: purelyFree.length, classificationCases: examples.length, mixedEvent: event.type }));
