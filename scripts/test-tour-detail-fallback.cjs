// In-memory provider/cache fixtures: no credentials or network requests.
const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), ts = require("typescript");
const root = path.resolve(__dirname, "..");
const oldDate = new Date(Date.now() - 60 * 86400000).toISOString();
const stored = { overview: "기존 소개", homepage: "https://official.example/?ref=original", tel: "031-123-4567", checkedAt: oldDate, overviewCheckedAt: oldDate };
const image = { full: "http://photos.example/original.jpg?ref=keep", thumb: "https://photos.example/thumb.jpg" };
const fixtures = { details: {
  partial: { ...stored }, empty: { ...stored }, failure: { ...stored },
  telephoneOnly: { tel: "031-999-9999", checkedAt: new Date().toISOString() },
  gallery: { ...stored, images: [image, image, { full: "javascript:invalid" }, { full: "https://photos.example/second.jpg" }] },
} };
const intro = { intro: { free: { fee: "무료", admission: "paid" }, paid: { fee: "성인 5,000원" }, conditional: { fee: "무료, 체험료 별도 3,000원", admission: "free" } } };
const overviews = { telephoneOnly: "별도 보관된 소개" };
const pets = { places: {} };
const ids = Array.from({ length: 100 }, (_, index) => `stored-${index}`);
for (const id of ids) {
  fixtures.details[id] = { ...stored, images: [image] };
  intro.intro[id] = { fee: "무료", admission: "paid" };
  pets.places[id] = { id, title: `저장 장소 ${id}`, overview: "보관된 반려동물 안내", enrichedAt: oldDate };
}
const originalFetch = global.fetch;
const envNames = ["TOUR_API_KEY", "TOUR_RUNTIME_FETCH", "NODE_ENV"];
const originalEnv = Object.fromEntries(envNames.map(name => [name, process.env[name]]));
process.env.TOUR_API_KEY = "test-fixture";
delete process.env.TOUR_RUNTIME_FETCH;
function createLoader() {
  const modules = new Map();
  const json = {
    "data/place-details.json": fixtures,
    "data/place-overviews.json": overviews,
    "data/place-intro.json": intro,
    "data/place-fees.json": { fees: { legacy: "paid" } },
    "data/pet-travel.json": pets,
  };
  function load(relative) {
    let filename = path.resolve(root, relative);
    if (!path.extname(filename)) filename += [".ts", ".js", ".mjs"].find(ext => fs.existsSync(filename + ext)) || ".ts";
    const repoFile = path.relative(root, filename).split(path.sep).join("/");
    assert(!repoFile.startsWith("../"), "Imports stay inside the repository");
    if (Object.hasOwn(json, repoFile)) return json[repoFile];
    if (modules.has(filename)) return modules.get(filename).exports;
    if (filename.endsWith(".json")) return JSON.parse(fs.readFileSync(filename, "utf8"));
    const mod = { exports: {} }; modules.set(filename, mod);
    const local = name => name === "server-only" ? {} : name.startsWith("@/") ? load(name.slice(2)) : name.startsWith(".") ? load(path.resolve(path.dirname(filename), name)) : require(name);
    const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    new Function("exports", "module", "require", source)(mod.exports, mod, local);
    return mod.exports;
  }
  return load;
}
let calls = 0;
global.fetch = async () => { calls++; throw new Error("Real network is forbidden in this test"); };
async function main() {
  try {
    const load = createLoader();
    const { fetchPlaceOverview, fetchPlaceImages, fetchAdmission } = load("lib/tourDetail.ts");
    const { fetchPetTravelDetail } = load("lib/petTravel.ts");
    for (const mode of ["production", "development"]) {
      process.env.NODE_ENV = mode;
      for (const id of ids) {
        const [overview, images, admission, pet] = await Promise.all([
          fetchPlaceOverview(id), fetchPlaceImages(id), fetchAdmission(id, "14"), fetchPetTravelDetail(id),
        ]);
        assert.deepEqual(overview, stored, "old stored details and original timestamps survive without live lookup");
        assert.deepEqual(images, [image], "stored image URLs and query strings are preserved");
        assert.equal(admission, "free", "actual fee text takes priority over a legacy badge");
        assert.deepEqual(pet, pets.places[id]);
      }
    }
    assert.equal(calls, 0, "100 distinct IDs in production and development must make zero provider calls even with an API key");
    assert.equal(await fetchAdmission("free", "14"), "free");
    assert.equal(await fetchAdmission("paid", "14"), "paid");
    assert.equal(await fetchAdmission("conditional", "14"), "unknown", "conditional paid exceptions cannot become a free badge");
    assert.equal(await fetchAdmission("legacy", "14"), "paid", "stored legacy fee states remain available");
    assert.equal(await fetchAdmission("missing", "14"), "unknown");
    assert.deepEqual(await fetchPlaceImages("gallery"), [image, { full: "https://photos.example/second.jpg", thumb: "https://photos.example/second.jpg" }]);
    assert.deepEqual(await fetchPlaceImages("missing"), []);
    assert.equal(await fetchPetTravelDetail("missing"), null);
    process.env.TOUR_RUNTIME_FETCH = "true";
    await Promise.all([fetchPlaceOverview("partial"), fetchPlaceImages("gallery"), fetchAdmission("free", "14"), fetchPetTravelDetail(ids[0])]);
    assert.equal(calls, 0, "only the exact explicit opt-in value 1 may make provider calls");

    // Preserve the original opt-in tests for partial/empty/failed responses.
    process.env.TOUR_RUNTIME_FETCH = "1";
    global.fetch = async (url) => {
      calls++;
      const id = new URL(url).searchParams.get("contentId");
      const item = id === "partial" ? { overview: "새 소개", homepage: "", tel: "" } : {};
      return { ok: id !== "failure", json: async () => ({ response: { header: { resultCode: "0000" }, body: { items: { item } } } }) };
    };
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
    assert.equal(calls, 3, "explicit opt-in retains the existing overview fetch behavior");
    const before = calls;
    const fresh = await fetchPlaceOverview("telephoneOnly");
    assert.equal(fresh.overview, "별도 보관된 소개", "a telephone-only detail record must retain the separate overview");
    assert.equal(fresh.tel, "031-999-9999");
    assert.equal(calls, before, "a fresh cache needs no provider request");
    assert.equal(fresh.overviewCheckedAt, undefined, "telephone retrieval time must not date the old overview");
    assert.deepEqual(await fetchPlaceImages("gallery"), [image, { full: "https://photos.example/second.jpg", thumb: "https://photos.example/second.jpg" }], "empty opt-in image results preserve stored gallery");
    assert.equal(await fetchAdmission("free", "14"), "free", "empty opt-in fee results preserve stored admission");
    assert.equal(await fetchPetTravelDetail(ids[0]), pets.places[ids[0]], "empty opt-in pet results preserve saved place");
    global.fetch = async () => ({ ok: true, json: async () => ({ response: { header: { resultCode: "0000" }, body: { items: { item: { usefee: "무료, 체험료 별도 3,000원" } } } } }) });
    assert.equal(await fetchAdmission("free", "14"), "unknown", "a newly fetched paid exception must not revert to an old free badge");
    global.fetch = async () => { calls++; return { ok: false, status: 429 }; };
    assert.deepEqual(await fetchPlaceImages("gallery"), [image, { full: "https://photos.example/second.jpg", thumb: "https://photos.example/second.jpg" }]);
    assert.equal(await fetchAdmission("free", "14"), "free");
    assert.equal(await fetchPetTravelDetail(ids[0]), pets.places[ids[0]]);
    console.log("PASS: default production/development calls for 100 distinct IDs use stored overview, original timestamps, galleries, admission and pet data with API 0; explicit opt-in and partial/empty/429 fallbacks remain covered.");
  } finally {
    global.fetch = originalFetch;
    for (const name of envNames) {
      if (originalEnv[name] === undefined) delete process.env[name];
      else process.env[name] = originalEnv[name];
    }
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
