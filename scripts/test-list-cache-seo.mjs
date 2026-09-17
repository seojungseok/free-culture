import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.PREP_VERIFY_BASE||'http://127.0.0.1:3269';
async function read(path){const r=await fetch(base+path);assert.equal(r.status,200,path);return {r,html:await r.text()};}
const published=JSON.parse(fs.readFileSync('data/weekend-prep.json','utf8')).articles.filter(a=>a.status==='published'&&Date.parse(a.publishAt)<=Date.now());
const {r,html}=await read('/weekend-prep');
assert(!r.headers.get('cache-control')?.includes('no-store'),'Main list must be cacheable');
assert(html.includes('CollectionPage'));
assert(html.includes('ItemList'));
assert(html.includes('name="robots" content="index, follow"'));
for(const a of published)assert(html.includes(`href="/weekend-prep/${a.slug}"`),`Crawlable direct link: ${a.slug}`);
const schemas=[...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
const list=schemas.flat().find(s=>s['@type']==='CollectionPage').mainEntity.itemListElement;
assert.deepEqual(list.map(a=>a.url).sort(),published.map(a=>'https://mwohaji.kr/weekend-prep/'+a.slug).sort());
for(const q of ['?page=2','?q=nomatchingprep','?category='+encodeURIComponent('요리 재료 체크리스트'),'?category='+encodeURIComponent('요리 재료 체크리스트')+'&cooking='+encodeURIComponent('국물요리')]){
  const {html:result}=await read('/weekend-prep'+q);
  assert(result.includes('noindex'),q);
  assert(result.includes('href="https://mwohaji.kr/weekend-prep"'),q);
  assert(!result.includes('CollectionPage'),'Filtered results should not claim the full collection');
}
const empty=await read('/weekend-prep?q=nomatchingprep');
assert(empty.html.includes('검색 결과가 없어요.'));
assert(!empty.html.includes('class="prep-card"'));
const blank=await read('/weekend-prep?q=');
assert(blank.html.includes('href="https://mwohaji.kr/weekend-prep"'));
// Vercel matches an empty query to the results rewrite, while next start
// treats it as absent. Both must render the full list and its base canonical.
assert(blank.html.includes('class="prep-card"'));
const search=await read('/search');
assert(!search.r.headers.get('cache-control')?.includes('no-store'));
assert(search.html.includes('noindex'));
const results=await read('/search?q='+encodeURIComponent('서울 무료 공연'));
assert(results.html.includes('검색 결과'));
assert(results.html.includes('noindex'));
for(const route of ['/weekend-prep/filter','/search/results'])assert((await read(route)).html.includes('noindex'));
const sitemap=(await read('/sitemap.xml')).html;
assert(!sitemap.includes('/weekend-prep/filter'));
assert(!sitemap.includes('/search/results'));
for(const a of published){
  const article=(await read('/weekend-prep/'+a.slug)).html;
  assert(article.includes('max-image-preview:large'));
  assert(article.includes('name="twitter:card" content="summary_large_image"'));
  assert(article.includes('property="og:url" content="https://mwohaji.kr/weekend-prep/'+a.slug+'"'));
}
console.log(JSON.stringify({passed:true,publicArticles:published.length,checks:['cacheable landing pages','server-rendered crawlable directory','query rewrites including empty queries','noindex filtered/search results','canonical','collection schema','article social metadata','sitemap exclusions']}));
