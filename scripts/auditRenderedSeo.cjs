const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '.next', 'server', 'app');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml.body'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const listed = new Set(urls.map((url) => new URL(url).pathname));

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : entry.name.endsWith('.html') ? [file] : [];
  });
}
function attr(tag, key) {
  return tag.match(new RegExp(`(?:^|\\s)${key}=["']([^"']*)["']`, 'i'))?.[1] || '';
}
function meta(html, key, value) {
  return [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map((match) => match[0])
    .find((tag) => attr(tag, key).toLowerCase() === value)?.match(/\bcontent=["']([^"']*)["']/i)?.[1] || '';
}

const problems = [];
const checked = [];
const images = { checked: 0, missingAlt: [], missingLocalFile: [] };
for (const file of walk(root)) {
  const route = '/' + path.relative(root, file).replace(/\\/g, '/').replace(/\.html$/, '');
  const normalized = route === '/index' ? '/' : route.replace(/\/$/, '');
  if (!listed.has(normalized)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] || '';
  const description = meta(html, 'name', 'description');
  const robots = meta(html, 'name', 'robots');
  const canonicalTag = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => match[0]).find((tag) => attr(tag, 'rel') === 'canonical');
  const canonical = canonicalTag ? attr(canonicalTag, 'href') : '';
  const h1Count = [...html.matchAll(/<h1\b/gi)].length;
  const expected = `https://mwohaji.kr${normalized === '/' ? '' : normalized}`;
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    const src = attr(tag, 'src');
    images.checked++;
    if (!/\balt=["'][^"']*["']/i.test(tag)) images.missingAlt.push(normalized);
    if (src.startsWith('/') && !src.startsWith('/_next/') && !src.startsWith('//')) {
      const local = path.join(__dirname, '..', 'public', decodeURIComponent(src.split('?')[0]).slice(1));
      if (!fs.existsSync(local)) images.missingLocalFile.push({ route: normalized, src });
    }
  }
  for (const [name, bad] of [
    ['title', !title], ['description', !description], ['canonical', canonical !== expected],
    ['noindex-in-sitemap', /noindex/i.test(robots)], ['h1', h1Count !== 1],
  ]) if (bad) problems.push({ route: normalized, name, value: name === 'canonical' ? canonical : undefined });
  checked.push({ route: normalized, title, description });
}

const duplicate = (key) => {
  const values = new Map();
  for (const page of checked) {
    if (!values.has(page[key])) values.set(page[key], []);
    values.get(page[key]).push(page.route);
  }
  return [...values.values()].filter((routes) => routes.length > 1);
};
console.log(JSON.stringify({
  sitemapUrls: urls.length, duplicateSitemapUrls: urls.length - new Set(urls).size,
  staticIndexPagesChecked: checked.length, problems: problems.slice(0, 50),
  problemCount: problems.length, duplicateTitles: duplicate('title').slice(0, 10),
  duplicateDescriptions: duplicate('description').slice(0, 10),
  images: { checked: images.checked, missingAlt: images.missingAlt.slice(0, 10), missingLocalFile: images.missingLocalFile.slice(0, 10) },
}, null, 2));
if (problems.length || images.missingAlt.length || images.missingLocalFile.length || urls.length !== new Set(urls).size) process.exitCode = 1;
