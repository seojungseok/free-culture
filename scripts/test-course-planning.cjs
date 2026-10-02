// Run the TypeScript data helpers against stored production records, without a
// network request or a build. Also checks sparse and ambiguous source records.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const originalResolve = Module._resolveFilename;
const originalJs = Module._extensions[".js"];
const originalTs = Module._extensions[".ts"];
Module._resolveFilename = function (request, parent, ...args) {
  if (request.startsWith("@/")) request = path.join(root, request.slice(2));
  return originalResolve.call(this, request, parent, ...args);
};
function loadSource(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  module._compile(compiled, filename);
}
Module._extensions[".ts"] = loadSource;
Module._extensions[".js"] = (module, filename) => filename.startsWith(path.join(root, "lib") + path.sep) ? loadSource(module, filename) : originalJs(module, filename);

try {
  const { courseVisitPlan, resolveCoursePlace } = require(path.join(root, "lib/coursePlanning.ts"));
  const { getAllCourses, courseAttractions, getIndexableCourses } = require(path.join(root, "lib/courses.ts"));
  const { getAllPlaces } = require(path.join(root, "lib/tour.ts"));
  const { getIntro, introRows } = require(path.join(root, "lib/tourExtra.ts"));
  const { eventContentsText } = require(path.join(root, "lib/eventContents.ts"));
  const { distanceKm } = require(path.join(root, "lib/nearby.ts"));
  const stop = (name, extra = {}) => ({ num: 0, name, image: "", overview: "", ...extra });
  const course = (stops, extra = {}) => ({ id: "test", title: "Test", area: "서울", duration: "당일", themes: [], themeLabels: [], publishedAt: "", content: "", source: "official", image: "", mapx: "", mapy: "", tel: "", overview: "", stops, stopCount: stops.length, ...extra });

  assert.equal(resolveCoursePlace(stop("국립"), "서울"), undefined, "partial names must not borrow another place's facts");
  assert.equal(resolveCoursePlace(stop("존재하지 않는 장소"), "서울"), undefined);
  const places = getAllPlaces();
  const byName = new Map();
  for (const place of places) {
    const key = place.title.replace(/\s+/g, "");
    byName.set(key, [...(byName.get(key) || []), place]);
  }
  const duplicate = [...byName.values()].find((list) => list.length > 1);
  assert.ok(duplicate, "ambiguous-place test needs an actual duplicate name");
  assert.equal(resolveCoursePlace(stop(duplicate[0].title), "미지정"), undefined);
  const unique = [...byName.values()].find((list) => list.length === 1)[0];
  assert.equal(resolveCoursePlace(stop(unique.title), "미지정").id, unique.id, "a globally unique full name can cross a border");
  assert.equal(resolveCoursePlace(stop(unique.title, { placeId: unique.id }), unique.area).id, unique.id);

  const sparse = courseVisitPlan(course([stop("없는 장소 A", { mapx: "0", mapy: "0" }), stop("없는 장소 B") ]));
  assert.deepEqual(sparse.days[0].segmentsKm, [null]);
  assert.equal(sparse.days[0].totalStraightKm, null);
  assert.ok(sparse.days[0].stops.every((item) => !item.detailHref && item.facts.length === 0 && item.mapHref.includes("/search/")));
  const coordinates = courseVisitPlan(course([stop("없는 장소 A", { mapx: "126.978", mapy: "37.566" }), stop("없는 장소 B", { mapx: "126.988", mapy: "37.566" })]));
  assert.ok(coordinates.days[0].segmentsKm[0] > 0.8 && coordinates.days[0].segmentsKm[0] < 1);
  assert.equal(coordinates.days[0].totalStraightKm, coordinates.days[0].segmentsKm[0]);
  const list = courseVisitPlan(course([stop("없는 장소 A"), stop("없는 장소 B")], { format: "list", duration: "베스트" }));
  assert.deepEqual(list.days[0].segmentsKm, []);
  assert.equal(list.days[0].totalStraightKm, null, "a candidate list is not a route");

  let routesWithFacts = 0, routesWithDistances = 0, linkedStops = 0;
  const all = getAllCourses();
  for (const item of all) {
    const plan = courseVisitPlan(item);
    const expected = courseAttractions(item).filter((entry) => entry.name.trim());
    assert.deepEqual(plan.days.flatMap((day) => day.stops.map((entry) => entry.name)), expected.map((entry) => entry.name), `${item.id}: source sequence must remain intact`);
    if (plan.hasVisitFacts) routesWithFacts++;
    if (plan.days.some((day) => day.segmentsKm.some((distance) => distance !== null))) routesWithDistances++;
    for (const day of plan.days) {
      if (item.format !== "list") assert.ok(day.stops.length <= 3, `${item.id}: no more than three visits per day`);
      for (let i = 0; i < day.segmentsKm.length; i++) {
        const raw = distanceKm(day.stops[i], day.stops[i + 1]);
        assert.equal(day.segmentsKm[i], Number.isFinite(raw) ? raw : null);
      }
      for (const entry of day.stops) {
        if (!entry.detailHref) continue;
        linkedStops++;
        assert.ok(places.some((place) => `/places/spot/${place.id}` === entry.detailHref), `${item.id}: detail link must exist`);
        const facts = introRows(entry.placeId).map((row) => ({ label: row.label, value: eventContentsText(row.value) }));
        for (const fact of entry.facts) assert.ok(facts.some((row) => row.label === fact.label && row.value === fact.value), `${item.id}: visit facts must match stored source exactly`);
        assert.equal(entry.sourceCollectedAt, getIntro(entry.placeId)?.checkedAt, `${item.id}: only the per-place retrieval date may be displayed`);
      }
    }
  }
  console.log(JSON.stringify({ status: "PASS", publishedRoutes: all.length, indexableRoutes: getIndexableCourses().length, routesWithFacts, routesWithDistances, linkedStops }));
} finally {
  Module._resolveFilename = originalResolve;
  Module._extensions[".js"] = originalJs;
  if (originalTs) Module._extensions[".ts"] = originalTs;
  else delete Module._extensions[".ts"];
}
