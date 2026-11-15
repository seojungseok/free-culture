import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
const origin=process.argv[2]||'http://127.0.0.1:3281';
const store=JSON.parse(await fs.readFile('data/weekend-prep.json','utf8'));
const review=JSON.parse(await fs.readFile('data/winter-camping-publication-review-20261115.json','utf8'));
const get=async path=>{const r=await fetch(origin+path);assert.equal(r.status,200,path);return r;};
const results=[];
for(let start=0;start<store.articles.length;start+=4)await Promise.all(store.articles.slice(start,start+4).map(async article=>{
 const path='/weekend-prep/'+article.slug;const $=load(await(await get(path)).text());
 assert.equal($('h1').length,1,path);assert.equal($('h1').text(),article.title);
 assert.equal($('meta[name=description]').attr('content'),article.description);
 for(const key of ['og:title','twitter:title'])assert.equal($('meta[property="'+key+'"],meta[name="'+key+'"]').attr('content'),article.title);
 for(const key of ['og:description','twitter:description'])assert.equal($('meta[property="'+key+'"],meta[name="'+key+'"]').attr('content'),article.description);
 assert.equal($('link[rel=canonical]').attr('href'),'https://mwohaji.kr'+path);
 assert(!/noindex/.test($('meta[name=robots]').attr('content')||''));
 const schemas=$('script[type="application/ld+json"]').toArray().flatMap(el=>JSON.parse($(el).text()));
 assert(schemas.some(x=>x['@type']==='Article'&&x.headline===article.title));assert(schemas.some(x=>x['@type']==='BreadcrumbList'));
 const recipe=schemas.find(x=>x['@type']==='Recipe');
 if(article.recipe){
  assert.deepEqual(recipe.recipeIngredient,article.recipe.ingredients);assert.deepEqual(recipe.recipeInstructions.map(s=>({title:s.name,text:s.text})),article.recipe.steps);
  for(const step of recipe.recipeInstructions)assert($('article').text().includes(step.text));
  assert.equal($('.prep-photo').length,3);assert.equal($('.prep-simple-items li').length,article.shoppingItems.length);
  assert.equal($('.prep-simple-items .prep-order').length,article.shoppingItems.filter(i=>i.affiliate).length);
  for(const item of article.shoppingItems)assert($('.prep-simple-items').text().includes(item.quantity));
  assert(!/AI 연출|AI로 연출/.test($('article').text()));
 }else assert(!recipe);
 results.push({slug:article.slug,status:200,recipe:!!recipe});
}));
const listed=[];
for(let page=1;page<=7;page++){
 const path='/weekend-prep'+(page===1?'':'?page='+page);const $=load(await(await get(path)).text());
 listed.push(...$('.prep-grid .prep-card').toArray().map(el=>$(el).attr('href')));
 assert.equal($('.prep-directory').length,0,'No duplicate directory below listing');
 if(page>1)assert.match($('meta[name=robots]').attr('content'),/noindex/);
}
assert.equal(listed.length,59);assert.equal(new Set(listed).size,59);
for(const slug of review.recipeSlugs)assert(listed.includes('/weekend-prep/'+slug));
const hub=load(await(await get('/camping/cooking')).text());
for(const slug of review.recipeSlugs)assert(hub('a[href="/weekend-prep/'+slug+'"]').length);
const xml=await(await get('/sitemap.xml')).text();
for(const article of store.articles)assert(xml.includes('https://mwohaji.kr/weekend-prep/'+article.slug));
for(const article of store.articles.filter(a=>a.recipe))for(const photo of [article.cover,...article.sections.flatMap(s=>s.image?[s.image]:[])])assert.match((await get(photo.url)).headers.get('content-type'),/image\/webp/);
await get('/fonts/weekend-cover-myeongjo-900-v2.woff');
const report={checkedAt:new Date().toISOString(),origin,articles:results.length,newRecipes:results.filter(r=>r.recipe).length,listPages:7,uniqueListed:listed.length,sitemapArticles:store.articles.length,newPhotos:45,results};
await fs.writeFile('output/winter-camping-15-20261115/http-verification.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,results:undefined}));
