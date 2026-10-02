// Read-only checks of the built website. No provider credentials are used.
import fs from 'node:fs';
const base = process.env.CONTENT_CHECK_BASE || 'http://127.0.0.1:3210';
const cases = [
  ['/', '이번 주말'], ['/about', '편집과 추천 기준'], ['/contact', '문의'], ['/privacy', '개인정보'],
  ['/places/spot/126511', '정보 출처'], ['/food/spot/2871024', '정보 출처'],
  ['/camping/101354', '정보 출처'], ['/course/c/daejeon-heritage-1n2d-y9in32', '방문'],
  ['/festivals/234232', '이용요금'], ['/festivals', '축제'], ['/camping', '캠핑'],
  ['/robots.txt', 'Sitemap:'], ['/sitemap.xml', 'https://mwohaji.kr/'],
  ['/api/pet-travel', 'items'], ['/api/nearby?area=%EC%84%9C%EC%9A%B8', 'total'], ['/__content_check_missing_page__', '', 404],
];
const results = [], titles = new Set();
for (const [path, marker, expected = 200] of cases) {
  const started = Date.now();
  try {
    const response = await fetch(new URL(path, base), { headers: { 'User-Agent': 'Mozilla/5.0 mwohaji-content-check' }, redirect: 'manual', signal: AbortSignal.timeout(30000) });
    const body = await response.text();
    const html = (response.headers.get('content-type') || '').includes('text/html');
    const title = html ? body.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '' : '';
    const canonical = html ? body.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1] || '' : '';
    const description = html ? body.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i)?.[1] || '' : '';
    const robots = html ? body.match(/<meta[^>]+name="robots"[^>]+content="([^"]*)"/i)?.[1] || '' : '';
    let jsonLdValid = true;
    for (const match of body.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
      try { JSON.parse(match[1]); } catch { jsonLdValid = false; }
    }
    const duplicateTitle = Boolean(title && titles.has(title));
    if (title) titles.add(title);
    const metadataOk = !html || expected !== 200 || Boolean(title && description && /^https:\/\/mwohaji\.kr(?:\/|$)/.test(canonical));
    results.push({ path, status: response.status, ms: Date.now() - started, markerPresent: !marker || body.includes(marker), title, canonical, robots, jsonLdValid, duplicateTitle,
      ok: response.status === expected && (!marker || body.includes(marker)) && metadataOk && jsonLdValid && !duplicateTitle });
  } catch (error) { results.push({ path, status: null, ok: false, error: error.name }); }
}
const report = { checkedAt: new Date().toISOString(), base, ok: results.every(result => result.ok), results };
if (process.env.CONTENT_CHECK_OUTPUT) fs.writeFileSync(process.env.CONTENT_CHECK_OUTPUT, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
