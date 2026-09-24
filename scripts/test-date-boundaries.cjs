const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('lib/dates.ts', 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
const moduleRef = {exports: {}};
vm.runInNewContext(compiled, {module: moduleRef, exports: moduleRef.exports, Date});
const {weekendRangeYmd, weekRangeYmd, addDaysYmd, todayYmd} = moduleRef.exports;

for (const [day, expected] of [
  ['20260925', ['20260926', '20260927']], // Friday
  ['20260926', ['20260926', '20260927']], // Saturday
  ['20260927', ['20260927', '20260927']], // Sunday
  ['20260928', ['20261003', '20261004']], // Monday
]) {
  assert.deepEqual(Object.values(weekendRangeYmd(day)), expected, day);
}
assert.deepEqual(Object.values(weekRangeYmd('20260927')), ['20260921', '20260927']);
assert.equal(addDaysYmd('20261231', 1), '20270101');

const originalNow = Date.now;
try {
  Date.now = () => Date.parse('2026-09-24T14:59:59Z');
  assert.equal(todayYmd(), '20260924');
  Date.now = () => Date.parse('2026-09-24T15:00:00Z');
  assert.equal(todayYmd(), '20260925');
} finally {
  Date.now = originalNow;
}
console.log('KST date boundaries passed');
