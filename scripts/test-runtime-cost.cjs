// Compare optimized calculations to the deployed baseline without network calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const ts = require('typescript');
function loader(baseline) {
  const modules = new Map();
  function load(file) {
    file = path.resolve(file);
    if (!path.extname(file)) file += ['.ts','.tsx','.js','.mjs'].find(e => fs.existsSync(file+e)) || '.ts';
    if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file,'utf8'));
    if (modules.has(file)) return modules.get(file).exports;
    const m = {exports:{}}; modules.set(file,m);
    const relative = path.relative(process.cwd(),file).replaceAll('\\','/');
    const source = baseline && ['lib/courses.ts','lib/nearData.ts'].includes(relative)
      ? execFileSync('git',['show','ae3ef6f:'+relative],{encoding:'utf8'}) : fs.readFileSync(file,'utf8');
    const local = n => n === 'server-only' ? {} : n.startsWith('@/') ? load(n.slice(2)) : n.startsWith('.') ? load(path.resolve(path.dirname(file),n)) : require(n);
    new Function('exports','module','require',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(m.exports,m,local);
    return m.exports;
  }
  return load;
}
const before=loader(true),after=loader(false);
const facts=m=>m.getAllCourses().map(c=>({id:c.id,centroid:m.courseCentroid(c),city:m.courseCity(c),stops:m.courseAttractions(c)}));
const oldCourses=before('lib/courses'),newCourses=after('lib/courses');
const started=performance.now(),oldFacts=facts(oldCourses),oldMs=performance.now()-started;
const nextStarted=performance.now(),newFacts=facts(newCourses),newMs=performance.now()-nextStarted;
assert.deepEqual(newFacts,oldFacts);
const oldNear=before('lib/nearData'),newNear=after('lib/nearData');
const realNow=Date.now;
try {
  for (const now of [realNow(),realNow()+172800000]) {
    Date.now=()=>now;
    assert.deepEqual(newNear.nearbyPool(),oldNear.nearbyPool());
    assert.deepEqual(newNear.nearbyPool(),oldNear.nearbyPool());
  }
} finally { Date.now=realNow; }
assert.deepEqual(after('app/sitemap').default().map(x=>x.url),before('app/sitemap').default().map(x=>x.url));
console.log(`PASS: ${newFacts.length} course outputs, nearby results across dates, sitemap URLs; course calculation ${oldMs.toFixed(1)}ms -> ${newMs.toFixed(1)}ms (local only)`);
