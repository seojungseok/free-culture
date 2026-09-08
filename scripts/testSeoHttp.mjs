import fs from 'node:fs';
const base = process.env.TEST_BASE_URL || 'http://localhost:3210';
const routes = ['/', '/region/seoul', '/region/gyeonggi', '/region/incheon', '/region/busan', '/region/jeju', '/event/374432', '/places/spot/809490', '/kids/c/809490', '/course/c/ulsan-nature-day-1uttc9i', '/city-tour/b2c85d7e3f7c38', '/pet-travel', '/camping/collections'];
const links = new Set(), images = new Set(), results = [];
async function check(route, collect = false) {
  try {
    const r = await fetch(new URL(route, base), {signal: AbortSignal.timeout(15000)});
    const html = await r.text();
    results.push({route, status:r.status});
    if (collect) {
      const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] || html;
      for (const m of [...main.matchAll(/href="(\/[^"?#]*)"/g)].slice(0, 8)) links.add(m[1].replaceAll('&amp;', '&'));
      for (const m of [...main.matchAll(/<img[^>]*src="([^"]+)"/g)].slice(0, 2)) images.add(m[1].replaceAll('&amp;', '&'));
    }
  } catch (e) { results.push({route, error:e.name}); }
}
for (const route of routes) await check(route, true);
const queue = [...links].filter(r => !routes.includes(r));
await Promise.all(Array.from({length:3}, async () => {while(queue.length) await check(queue.shift());}));
for (const route of ['/robots.txt','/sitemap.xml','/api/pet-travel']) await check(route);
const missing = await fetch(base+'/region/not-a-real-region', {signal:AbortSignal.timeout(15000)});
const imageResults = [];
for (const src of [...images].slice(0, 16)) {
  try {
    const r = await fetch(new URL(src, base), {signal:AbortSignal.timeout(15000), headers:{Range:'bytes=0-128'}});
    imageResults.push({src, status:r.status, type:r.headers.get('content-type')});
    await r.body?.cancel();
  } catch(e) {imageResults.push({src,error:e.name});}
}
const failures = results.filter(r=>r.error || r.status!==200);
const report={checked:results.length,failures,notFoundStatus:missing.status,images:imageResults,results};
fs.writeFileSync('docs/seo-link-check.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({checked:results.length,failures,notFoundStatus:missing.status,images:imageResults},null,2));
if(failures.length || missing.status!==404 || imageResults.some(r=>r.error || ![200,206].includes(r.status) || !r.type?.startsWith('image/'))) process.exitCode=1;
