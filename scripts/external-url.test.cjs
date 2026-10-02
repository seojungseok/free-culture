const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const file = path.join(__dirname, '..', 'lib', 'externalUrl.ts');
const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const mod = { exports: {} };
new Function('exports', 'module', 'require', compiled)(mod.exports, mod, require);
const { normalizeExternalUrl } = mod.exports;
const cases = [
  ['https://example.com/r/item?aff_id=123&track=Foo%2Fbar#options', 'https://example.com/r/item?aff_id=123&track=Foo%2Fbar#options'],
  ['http://example.com/booking?x=1&y=2', 'http://example.com/booking?x=1&y=2'],
  ['www.theariut.com', 'https://www.theariut.com'],
  ['kimpocamping.com', 'https://kimpocamping.com'],
  ['관광농원.com', 'https://관광농원.com'],
  ['www.포레스트카라반.kr', 'https://www.포레스트카라반.kr'],
  ['//example.com/book?a=1', 'https://example.com/book?a=1'],
  ['<a href="http://example.com/r/book?track=1&amp;source=2">예약</a>', 'http://example.com/r/book?track=1&source=2'],
  ["<a href='javascript:alert(1)'>예약</a><a href='https://example.com/r/book?x=1'>공식</a>", 'https://example.com/r/book?x=1'],
  ['thankqcamping.com / 모바일(m.thankqcamping.com)', 'https://thankqcamping.com'],
  ['캠핏, 여기어때, 캠핑톡, https://naver.me/FzSZmUL1', 'https://naver.me/FzSZmUL1'],
  ['네이버 (https://naver.me/IMyAZXM6)', 'https://naver.me/IMyAZXM6'],
  ['https://first.example.com,https://second.example.com', 'https://first.example.com'],
  ['https://first.example.com\nhttps://second.example.com', 'https://first.example.com'],
  ['https:\\/\\/daeposup.modoo.at\\/', 'https://daeposup.modoo.at/'],
  ['https://example.com/book?redirect=https://partner.example.com/r?aff=1', 'https://example.com/book?redirect=https://partner.example.com/r?aff=1'],
  ['javascript:https://example.com', ''],
  ['java\nscript:alert(1)', ''],
  ['javascript&#58;alert(1)', ''],
  ['data:text/html,https://example.com', ''],
  ['file:///C:/example.com', ''],
  ['https://user:password@example.com', ''],
  ['https://example.com\\@evil.example.com', ''],
  ['museumnamhae@naver.com', ''],
  ['www.하늘빛수목원,com', ''],
  ['sinbukresort,co.kr', ''],
  ['땡큐캠핑, 네이버', ''],
  ['네이버에서 더팜스테이로 예약 가능합니다.', ''],
  ['/local/booking', ''],
  ['010-5312-9190', ''],
  [null, ''],
];
for (const [input, expected] of cases) assert.equal(normalizeExternalUrl(input), expected, JSON.stringify(input));
const camps = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'camping.json'), 'utf8')).camps;
let valid = 0, recovered = 0, withheld = 0;
for (const camp of camps) {
  const result = normalizeExternalUrl(camp.homepage);
  if (!result) { if (camp.homepage) withheld++; continue; }
  assert.match(result, /^https?:\/\//i);
  const parsed = new URL(result);
  assert(!parsed.username && !parsed.password && parsed.hostname);
  valid++;
  if (result !== camp.homepage.trim()) recovered++;
}
console.log(JSON.stringify({ tests: cases.length, campsChecked: camps.length, validClickableHomepages: valid, recoveredSourceValues: recovered, withheldNonUrlValues: withheld }, null, 2));
const campingSource = fs.readFileSync(path.join(__dirname, '..', 'lib', 'camping.ts'), 'utf8');
const campingCompiled = ts.transpileModule(campingSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
const campingMod = { exports: {} };
const minimalCamp = { id: 'schema-fixture', name: '스키마 확인', area: '서울', addr: '', facilities: null, types: null };
const campingRequire = name => {
  if (name === '@/data/camping.json') return { count: camps.length, camps: [...camps, minimalCamp] };
  if (name === '@/data/camping-images.json') return {};
  if (name === '@/lib/classify') return { SIDO_LIST: [...new Set(camps.map(camp => camp.area))] };
  if (name === '@/lib/address') return { displayAddress: value => value };
  if (name === '@/lib/externalUrl') return { normalizeExternalUrl };
  throw new Error(`Unexpected camping import: ${name}`);
};
new Function('exports', 'module', 'require', campingCompiled)(campingMod.exports, campingMod, campingRequire);
const normalizedCamps = campingMod.exports.getAllCamps();
assert.equal(normalizedCamps.length, camps.length + 1, 'normalization does not drop source records');
const requiredStrings = ['id','name','area','sigungu','addr','mapx','mapy','petRaw','lctCl','resve','operPd','tel','homepage','image','intro'];
for (const camp of normalizedCamps) {
  for (const field of requiredStrings) assert.equal(typeof camp[field], 'string', `${camp.id} ${field}`);
  assert(Array.isArray(camp.types), `${camp.id} types`);
  assert(camp.facilities && typeof camp.facilities === 'object' && !Array.isArray(camp.facilities));
  assert(Object.values(camp.facilities).every(value => typeof value === 'boolean'));
  camp.intro.trim();
}
for (let index = 0; index < camps.length; index++) {
  assert.equal(normalizedCamps[index].id, String(camps[index].id), 'existing IDs stay unchanged');
  assert.equal(normalizedCamps[index].checkedAt, camps[index].checkedAt, 'successful collection timestamps stay unchanged');
}
console.log(`PASS: ${camps.length} source records plus an incomplete fixture retain their IDs, optional field shapes and collection timestamps.`);
