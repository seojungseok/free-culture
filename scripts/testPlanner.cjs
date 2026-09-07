const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");
function load(file) {
  const source = fs.readFileSync(file, "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  new Function("exports", "module", "require", js)(module.exports, module, require);
  return module.exports;
}
const p = load("lib/planner.ts"), dates = load("lib/dates.ts");
assert.deepEqual(dates.weekendRangeYmd("20260906"), { start: "20260906", end: "20260906" });
assert.deepEqual(dates.weekendRangeYmd("20260907"), { start: "20260912", end: "20260913" });
assert.equal(p.validCoordinates(117.99, 19.69), false);
assert.equal(p.validCoordinates(126.97, 37.57), true);
const stop = (id, extra = {}) => ({id, title:id, href:"/places/spot/"+id, area:"서울", kind:"place", x:126.97, y:37.57, free:true, kids:true, ...extra});
const options = [
  {anchor:stop("1"), nearby:[stop("2",{x:126.98}),stop("3",{x:129}),stop("4",{kind:"food",free:false,kids:false})]},
  {anchor:stop("2"), nearby:[]},
  {anchor:stop("5",{kind:"event",start:"20260901",end:"20260906"}), nearby:[]},
  {anchor:stop("6",{free:false,kids:false}), nearby:[]},
];
const preferences = {area:"서울",date:"2026-09-12",hours:4,kids:true,free:true};
const plans = p.makePlans(options, preferences);
assert.equal(plans.length,1);
assert.deepEqual(plans[0].stops.map(s=>s.id),["1","2"]);
assert.equal(p.makePlans(options,{...preferences,hours:2})[0].stops.length,1);
assert.equal(p.makePlans(options,{...preferences,area:"부산"}).length,0);
assert.equal(p.makePlans(options,{...preferences,date:"invalid"}).length,0);
assert.equal(p.parseSaved("{broken").length,0);
assert.equal(p.parseSaved(JSON.stringify(plans)).length,1);
assert.equal(p.parseSaved(JSON.stringify([{...plans[0],stops:[stop('city',{kind:'course',href:'/city-tour/123456abcdef01'})]}])).length,1);
assert.equal(p.parseSaved(JSON.stringify([{...plans[0],stops:[stop("x",{href:"//evil.example"})]}])).length,0);
assert.equal(p.parseSaved(JSON.stringify([{...plans[0],stops:[stop("x",{href:"javascript:alert(1)"})]}])).length,0);
assert.equal(p.parseSaved(JSON.stringify([{...plans[0],stops:[]}])).length,0);
console.log("PASS: weekend dates, coordinates, active events, strict filters, distance, deduplication, saved-data safety");
const park=stop('park',{walk:true,parkingAvailable:true,accessText:'휠체어 대여',wheelchairEntry:false});
const lunch=stop('lunch',{kind:'food',href:'/food/spot/lunch',free:false,parkingAvailable:true});
const custom=[{anchor:park,nearby:[lunch,stop('unknown',{walk:true})]},{anchor:stop('museum',{culture:true}),nearby:[]}];
const pref={...preferences,kids:false,area:'서울',purpose:'walk',hours:8};
assert.equal(p.makePlans(custom,{...pref,meal:true,parking:'required'})[0].stops.length,2);
assert.equal(p.makePlans(custom,{...pref,access:'wheelchair'}).length,0);
assert.equal(p.makePlans(custom,{...pref,access:'info'})[0].stops.length,1);
assert.equal(p.makePlans(custom,{...pref,purpose:'culture',free:false})[0].stops[0].id,'museum');
assert.equal(p.makePlans(custom,{...pref,purpose:'event'}).length,0);
assert.equal(p.makePlans(custom,{...pref,query:'없는장소'}).length,0);
assert.equal(p.makePlans([{anchor:park,nearby:[]}],{...pref,meal:true}).length,0);
assert.equal(p.makePlans(custom,{...pref,parking:'required'})[0].stops.some(s=>!s.parkingAvailable),false);
console.log('PASS: purpose, meals, parking all-stop constraint, wheelchair rental is not entry, unknown exclusion, query');
