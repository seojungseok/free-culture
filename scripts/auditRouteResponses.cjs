const assert = require('node:assert/strict');
const base = process.env.AUDIT_BASE || 'http://127.0.0.1:3027';
const cases = [
  ['/', 200, true], ['/about', 200, true], ['/contact', 200, true],
  ['/privacy', 200, true], ['/kids', 200, true], ['/date', 200, true],
  ['/region/seoul', 200, true], ['/places/seoul', 200, true],
  ['/food/seoul/korean', 200, false], ['/food/category/korean', 200, false],
  ['/course/incheon/day', 200, false], ['/course/theme/beach', 200, false],
  ['/camping/type/general', 200, false], ['/region/seoul/exhibition', 200, false],
  ['/date/seoul', 200, false], ['/date/seoul/종로구', 200, false],
  ['/date/c/2717547', 200, false], ['/kids/c/2476731', 200, false],
  ['/event/374432', 200, true], ['/event/383591', 200, false],
  ['/festivals/busan-407', 200, true],
  ['/camping/collections', 200, false],
  ['/camping/collections/gyeonggi-elec', 200, false],
  ['/places/spot/2451912', 200, true], ['/places/spot/2930839', 200, false],
  ['/food/spot/2654055', 200, false],
  ['/camping/101354', 200, true], ['/camping/2782', 200, false],
  ['/city-tour/7d01e3da99a969', 200, true],
  ['/pet-travel/127422', 200, true], ['/pet-travel/2738711', 200, true],
  ['/not-a-real-page-adsense-audit', 404, null],
];
const month = new Date(Date.now() + 9 * 60 * 60 * 1000).getUTCMonth() + 1;
cases.push([`/month/${month}`, 200, true]);
if (month > 1) cases.push([`/month/${month - 1}`, 200, false]);

function attr(tag, name) {
  return tag.match(new RegExp(`(?:^|\\s)${name}=["']([^"']*)["']`, 'i'))?.[1] || '';
}
function headTag(html, tag, key, value) {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))]
    .map((match) => match[0]).find((item) => attr(item, key) === value) || '';
}
async function check([route, status, index]) {
  const response = await fetch(base + encodeURI(route), { redirect: 'manual', signal: AbortSignal.timeout(18000) });
  assert.equal(response.status, status, route);
  if (status !== 200) return { route, status };
  const html = await response.text();
  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] || '';
  const description = attr(headTag(html, 'meta', 'name', 'description'), 'content');
  const robots = attr(headTag(html, 'meta', 'name', 'robots'), 'content');
  const canonical = attr(headTag(html, 'link', 'rel', 'canonical'), 'href');
  assert(title && description && canonical, route + ' missing metadata');
  assert.equal(canonical, 'https://mwohaji.kr' + (route === '/' ? '' : encodeURI(route)), route + ' canonical');
  assert.equal(!/noindex/i.test(robots), index, route + ' indexability');
  assert.equal([...html.matchAll(/<h1\b/gi)].length, 1, route + ' h1');
  return { route, status, index };
}

(async () => {
  const results = [];
  for (let i = 0; i < cases.length; i += 4) {
    results.push(...await Promise.all(cases.slice(i, i + 4).map(check)));
  }
  const redirects = [['/tickets', '/places'], ['/tickets/place-ga75y9uv', '/places/spot/2451912'], ['/places/spot/3353336', '/places/spot/2774564']];
  for (const [route, target] of redirects) {
    const response = await fetch(base + route, { redirect: 'manual' });
    assert.equal(response.status, 301, route);
    assert.equal(new URL(response.headers.get('location'), base).pathname, target, route);
  }
  for (const route of ['/places/spot/2774564?utm_source=audit', '/events?utm_medium=audit', '/food?ref=audit&source=test']) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    const canonical = attr(headTag(html, 'link', 'rel', 'canonical'), 'href');
    assert.equal(canonical, 'https://mwohaji.kr' + route.split('?')[0], route + ' canonical');
  }
  const ads = await fetch(base + '/ads.txt');
  assert.equal(ads.status, 200);
  assert.match(await ads.text(), /^google\.com, pub-\d{16}, DIRECT, f08c47fec0942fa0/m);
  console.log(JSON.stringify({ checked: results.length, redirects: redirects.length, adsTxt: 'valid', results }, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; });
