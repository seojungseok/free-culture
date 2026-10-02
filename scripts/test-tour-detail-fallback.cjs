// In-memory provider/cache fixtures: no credentials or network requests.
const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), Module = require("node:module"), ts = require("typescript");
const root = path.resolve(__dirname, "..");
const oldDate = new Date(Date.now() - 60 * 86400000).toISOString();
const stored = { overview: "기존 소개", homepage: "https://official.example/", tel: "031-123-4567", checkedAt: oldDate, overviewCheckedAt: oldDate };
const fixtures = { details: {
  partial: { ...stored }, empty: { ...stored }, failure: { ...stored },
  telephoneOnly: { tel: "031-999-9999", checkedAt: new Date().toISOString() },
} };
const originalResolve = Module._resolveFilename, originalLoad = Module._load, originalJs = Module._extensions[".js"], originalFetch = global.fetch;
Module._resolveFilename = function(request, parent, ...args) { return originalResolve.call(this, request.startsWith("@/") ? path.join(root, request.slice(2)) : request, parent, ...args); };
Module._load = function(request, ...args) {
  if (request === "server-only") return {};
  if (request === "@/data/place-details.json") return fixtures;
  if (request === "@/data/place-overviews.json") return { telephoneOnly: "별도 보관된 소개" };
  return originalLoad.call(this, request, ...args);
};
function compile(module, filename) { module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename); }
Module._extensions[".ts"] = compile;
Module._extensions[".js"] = (module, filename) => filename.startsWith(path.join(root, "lib") + path.sep) ? compile(module, filename) : originalJs(module, filename);
const originalKey = process.env.TOUR_API_KEY;
process.env.TOUR_API_KEY = "test-fixture";
let calls = 0;
global.fetch = async (url) => {
  calls++;
  const id = new URL(url).searchParams.get("contentId");
  const item = id === "partial" ? { overview: "새 소개", homepage: "", tel: "" } : {};
  return { ok: id !== "failure", json: async () => ({ response: { header: { resultCode: "0000" }, body: { items: { item } } } }) };
};
async function main() {
  try {
    const { fetchPlaceOverview } = require("../lib/tourDetail.ts");
    const partial = await fetchPlaceOverview("partial");
    assert.equal(partial.overview, "새 소개");
    assert.equal(partial.homepage, stored.homepage);
    assert.equal(partial.tel, stored.tel);
    assert.equal(partial.overviewCheckedAt, undefined, "a runtime fetch-cache hit has no newly verified date");
    const empty = await fetchPlaceOverview("empty");
    assert.equal(empty.overview, stored.overview);
    assert.equal(empty.homepage, stored.homepage);
    assert.equal(empty.tel, stored.tel);
    const failure = await fetchPlaceOverview("failure");
    assert.deepEqual(failure, stored);
    const before = calls;
    const fresh = await fetchPlaceOverview("telephoneOnly");
    assert.equal(fresh.overview, "별도 보관된 소개", "a telephone-only detail record must retain the separate overview");
    assert.equal(fresh.tel, "031-999-9999");
    assert.equal(calls, before, "a fresh cache needs no provider request");
    assert.equal(fresh.overviewCheckedAt, undefined, "telephone retrieval time must not date the old overview");
    console.log("PASS: partial and empty responses preserve details; telephone-only fresh cache preserves stored overview without inventing its date.");
  } finally {
    global.fetch = originalFetch;
    Module._resolveFilename = originalResolve;
    Module._load = originalLoad;
    Module._extensions[".js"] = originalJs;
    if (originalKey === undefined) delete process.env.TOUR_API_KEY;
    else process.env.TOUR_API_KEY = originalKey;
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
