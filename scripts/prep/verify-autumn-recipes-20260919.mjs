import fs from 'node:fs';
import assert from 'node:assert/strict';
import {recipeConfigs} from './autumn-recipes-config.mjs';
const base=process.env.PREP_VERIFY_BASE||'http://127.0.0.1:3264';
const canonicalBase=process.env.PREP_CANONICAL_BASE||'https://mwohaji.kr';
const store=JSON.parse(fs.readFileSync('data/weekend-prep.json','utf8'));
const articles=recipeConfigs().map(r=>store.articles.find(a=>a.slug===`autumn-camping-${r.key}-ingredient-checklist`));
const fresh=base.includes('127.0.0.1')?'':'?verify=autumn-20260919';
const results=[];
for(const a of articles){
 const path='/weekend-prep/'+a.slug;
 const r=await fetch(base+path+fresh);assert.equal(r.status,200,path);const html=await r.text();
 assert(html.includes(a.title),path+' title');assert(html.includes(a.description),path+' description');
 assert(html.includes('rel="canonical" href="'+canonicalBase+path+'"'),path+' canonical');
 assert(!/<meta name="robots" content="[^"]*noindex/.test(html),path+' index');
 const blocks=[...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].flatMap(m=>JSON.parse(m[1]));
 assert(blocks.some(b=>b['@type']==='Article'&&b.headline===a.title&&b.dateModified===a.updatedAt));
 assert(blocks.some(b=>b['@type']==='BreadcrumbList'));
 assert(html.includes('type="checkbox"'));
 assert(!/link\.coupang|coupa\.ng|waug\.com\/r\/|rel="sponsored/i.test(html),path+' no affiliate links');
 for(const photo of [a.cover,...a.sections.map(s=>s.image).filter(Boolean)]){
  assert(html.includes(photo.url));const im=await fetch(base+photo.url,{method:'HEAD'});assert.equal(im.status,200);
 }
 results.push({slug:a.slug,http:200,metadata:true,canonical:true,structuredData:true,images:3});
}
const sitemapResponse=await fetch(base+'/sitemap.xml'+fresh);assert.equal(sitemapResponse.status,200);const sitemap=await sitemapResponse.text();
for(const a of articles)assert(sitemap.includes('/weekend-prep/'+a.slug),a.slug+' sitemap');
const listing=await (await fetch(base+'/weekend-prep'+fresh)).text();
for(const a of articles)assert(listing.includes('/weekend-prep/'+a.slug),a.slug+' directory link');
console.log(JSON.stringify({base,articles:results,sitemap:true,directoryLinks:true},null,2));
