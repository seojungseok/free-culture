const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '.next', 'server', 'app');
const base = process.env.AUDIT_BASE || 'http://127.0.0.1:3027';
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml.body'), 'utf8');
const listed = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname));
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : entry.name.endsWith('.html') ? [file] : [];
  });
}
const linked = new Set();
const badMarkup = [];
for (const file of walk(root)) {
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']*)["']/gi)) {
    const href = match[1].replace(/&amp;/g, '&');
    if (!href) { badMarkup.push({ file, problem: 'empty href' }); continue; }
    if (!href.startsWith('/')) continue;
    const pathname = new URL(href, 'https://mwohaji.kr').pathname;
    if (/^\/tickets(?:\/|$)/.test(pathname)) badMarkup.push({ file, pathname, problem: 'old tickets link' });
    if (!pathname.startsWith('/_next/') && !pathname.startsWith('/api/')) linked.add(pathname);
  }
}
const toCheck = [...linked].filter((pathname) => !listed.has(pathname));
const bad = [...badMarkup];
const statuses = {};
let done = 0;
async function check(route) {
  try {
    const response = await fetch(base + route, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(15000) });
    statuses[response.status] = (statuses[response.status] || 0) + 1;
    if (response.status >= 300) bad.push({ route, status: response.status, location: response.headers.get('location') });
  } catch (error) {
    bad.push({ route, error: error.message });
  }
  done++;
  if (done % 300 === 0) console.error('checked', done, '/', toCheck.length);
}
(async () => {
  let next = 0;
  await Promise.all(Array.from({ length: 12 }, async () => {
    while (next < toCheck.length) await check(toCheck[next++]);
  }));
  console.log(JSON.stringify({ uniqueInternalLinks: linked.size, sitemapLinked: linked.size - toCheck.length, nonSitemapChecked: toCheck.length, statuses, bad: bad.slice(0, 50), badCount: bad.length }, null, 2));
  if (bad.length) process.exitCode = 1;
})();
