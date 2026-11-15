import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {load} from 'cheerio';

const base=(process.argv[2]||'http://127.0.0.1:3280').replace(/\/$/,'');
const output=process.argv[3]||'output/camping-naver-20261115/local-verification.json';
const store=JSON.parse(await fs.readFile('data/weekend-prep.json','utf8'));
const published=store.articles.filter(article=>article.status==='published'&&Date.parse(article.publishAt)<=Date.now());
const plan=JSON.parse(await fs.readFile('data/camping-naver-keywords-20261115.json','utf8'));
const collectionTitle='캠핑요리 추천 | 메뉴별 재료와 레시피';
const userAgent='Mozilla/5.0 (compatible; Yeti/1.1; +https://naver.me/spd)';
const origin='https://mwohaji.kr';
const get=async path=>{
  const response=await fetch(base+path,{headers:{'user-agent':userAgent},redirect:'manual',signal:AbortSignal.timeout(60000)});
  assert.equal(response.status,200,path+' HTTP status');
  return load(await response.text());
};
const schemas=$=>$('script[type="application/ld+json"]').toArray().flatMap(element=>{
  const value=JSON.parse($(element).text());return Array.isArray(value)?value:[value];
});
const metadata=($,title,description,path)=>{
  assert.equal($('h1').length,1,path+' one primary heading');
  assert.equal($('h1').first().text(),title,path+' H1');
  assert($('head title').text().startsWith(title),path+' search title');
  assert.equal($('meta[property="og:title"]').attr('content'),title,path+' OG title');
  assert.equal($('meta[name="twitter:title"]').attr('content'),title,path+' Twitter title');
  for(const selector of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]']){
    assert.equal($(selector).attr('content'),description,path+' '+selector);
  }
  assert.equal($('link[rel="canonical"]').attr('href'),origin+path,path+' canonical');
  assert(!/noindex/i.test($('meta[name="robots"]').attr('content')||''),path+' remains indexable');
  assert(!$('meta[name="keywords"]').length,path+' does not inherit unrelated home keywords');
};
const listing=await get('/weekend-prep');
metadata(listing,collectionTitle,listing('main>.prep-lead').text(),'/weekend-prep');
assert(!listing('main').text().includes('메뉴별 재료와 준비물'),'Removed directory stays absent');
const collection=schemas(listing).find(value=>value['@type']==='CollectionPage');
assert.equal(collection.name,collectionTitle);
assert.equal(collection.mainEntity.itemListElement.length,published.length);
for(const article of published){
  const item=collection.mainEntity.itemListElement.find(item=>item.url===origin+'/weekend-prep/'+article.slug);
  assert.equal(item?.name,article.title,article.slug+' collection link title');
}
const report=[];
const titles=new Set(),descriptions=new Set();
for(const article of published){
  const path='/weekend-prep/'+article.slug;
  const $=await get(path);
  metadata($,article.title,article.description,path);
  assert(!titles.has(article.title),article.slug+' unique title');titles.add(article.title);
  assert(!descriptions.has(article.description),article.slug+' unique description');descriptions.add(article.description);
  assert(article.description.length<=80,article.slug+' concise description');
  assert.equal($('.prep-lead').first().text(),article.description,article.slug+' visible first paragraph');
  const json=schemas($);
  const schema=json.find(value=>value['@type']==='Article');
  assert.equal(schema.headline,article.title,article.slug+' schema headline');
  assert.equal(schema.description,article.description,article.slug+' schema description');
  assert.equal(schema.mainEntityOfPage['@id'],origin+path,article.slug+' schema canonical');
  assert.equal(schema.datePublished,article.publishAt,article.slug+' original publication time');
  assert.equal(schema.dateModified,article.updatedAt,article.slug+' actual update time');
  const breadcrumbs=json.find(value=>value['@type']==='BreadcrumbList');
  assert.equal(breadcrumbs.itemListElement.at(-1).name,article.title,article.slug+' breadcrumb');
  assert.equal($('meta[property="og:image"]').attr('content'),origin+article.cover.url,article.slug+' existing cover');
  if(article.dishName){
    assert.equal($('#prep-checklist-title').text(),article.dishName+' 재료 장보기 목록',article.slug+' clean dish heading');
  }
  const items=[...(article.checklist||[]),...(article.shoppingItems||[])].filter(item=>item.group!=='common'&&item.affiliate?.reviewed);
  const hrefs=new Set($('a[rel~="sponsored"]').toArray().map(element=>$(element).attr('href')));
  for(const item of items)assert(hrefs.has(item.affiliate.url),article.slug+' original affiliate route for '+item.label);
  const expected=plan.entries.find(entry=>entry.slug===article.slug);
  assert.equal(article.title,expected.title);
  report.push({slug:article.slug,title:article.title,titleLength:article.title.length,descriptionLength:article.description.length,originalAffiliateLinksChecked:items.length});
}
const companionPairs=[['camp-seafood-pot-table','camping-seafood-hotpot-ingredient-checklist'],['camp-jeyuk-bokkeum','autumn-20260920-jeyuk-bokkeum-ingredient-checklist'],['camp-sundae-bokkeum','autumn-20260920-sundae-bokkeum-ingredient-checklist'],['camp-dakgalbi','autumn-20260920-dakgalbi-ingredient-checklist'],['camp-ojingeo-bokkeum','camping-squid-stir-fry-ingredients'],['camp-kimchi-fried-rice','camping-kimchi-fried-rice-ingredients']];
let companionLinks=0;
for(const pair of companionPairs)for(const slug of pair){
  const $=await get('/weekend-prep/'+slug);
  const other=pair.find(value=>value!==slug);
  assert.equal($('nav[aria-label="다른 캠핑요리"] a').first().attr('href'),'/weekend-prep/'+other,slug+' relevant companion link');
  companionLinks++;
}
let cards=listing('a.prep-card').length;
for(let page=2;page<=Math.ceil(published.length/9);page++){
  const $=await get('/weekend-prep?page='+page);
  assert.match($('meta[name="robots"]').attr('content'),/noindex/,'Paginated filters keep existing noindex');
  for(const element of $('a.prep-card').toArray()){
    const card=$(element),slug=card.attr('href').split('/').at(-1);
    assert.equal(card.find('h2').text(),published.find(article=>article.slug===slug).title);
  }
  cards+=$('a.prep-card').length;
}
assert.equal(cards,published.length,'All existing cards remain reachable');
const sitemapResponse=await fetch(base+'/sitemap.xml',{headers:{'user-agent':userAgent}});
assert.equal(sitemapResponse.status,200);
const xml=load(await sitemapResponse.text(),{xmlMode:true});
for(const article of published){
  const loc=origin+'/weekend-prep/'+article.slug;
  const urls=xml('url').toArray().filter(element=>xml(element).find('loc').text()===loc);
  assert.equal(urls.length,1,article.slug+' one unchanged sitemap URL');
  assert.equal(xml(urls[0]).find('lastmod').text().slice(0,10),article.updatedAt.slice(0,10),article.slug+' sitemap update');
}
const robotsResponse=await fetch(base+'/robots.txt',{headers:{'user-agent':userAgent}});
assert.equal(robotsResponse.status,200);
const robots=await robotsResponse.text();
assert(!/^Disallow:\s*\/weekend-prep\s*$/im.test(robots),'Preparation pages are crawlable');
const result={base,checkedAt:new Date().toISOString(),userAgent,articlesPassed:report.length,listingPages:Math.ceil(cards/9),cardsPassed:cards,companionLinksPassed:companionLinks,sitemapUrlsPassed:published.length,pages:report};
await fs.writeFile(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,pages:undefined}));
