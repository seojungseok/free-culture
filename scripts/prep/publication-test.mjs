import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.PREP_VERIFY_BASE||'http://127.0.0.1:3258';
const nextBin=createRequire(import.meta.url).resolve('next/dist/bin/next');
const child=process.env.PREP_VERIFY_BASE?null:spawn(process.execPath,[nextBin,'start','--hostname','127.0.0.1','--port','3258'],{stdio:'ignore',windowsHide:true});
const store=JSON.parse(fs.readFileSync('data/weekend-prep.json','utf8'));
async function page(path){const r=await fetch(base+path,{headers:{'Cache-Control':'no-cache'}});assert.equal(r.status,200,path);return r.text();}
try{
 if(child)for(let i=0;i<40;i++){try{if((await fetch(base+'/weekend-prep')).ok)break;}catch{}await new Promise(r=>setTimeout(r,500));}
 const listing=await page('/weekend-prep');assert(!listing.includes('noindex'));for(const c of new Set(store.articles.map(a=>a.salesFormat==='food-checklist'||a.category==='요리 준비물'?'요리 재료 체크리스트':['캠핑 요리','바비큐 요리'].includes(a.category)||a.salesFormat==='food-recipe'?'캠핑요리 가이드':a.category)))assert(listing.includes(c));
 const second=await page('/weekend-prep?page=2');assert(second.includes('noindex'));
 const search=await page('/weekend-prep?q=nomatchingprep');assert(search.includes('noindex'));
 const sitemap=await page('/sitemap.xml');
 for(const a of store.articles){const path='/weekend-prep/'+a.slug,html=await page(path);
  assert(html.includes(a.title));assert(html.includes('rel="canonical"'));assert(html.includes(path));assert(html.includes('Article'));assert(html.includes('BreadcrumbList'));assert(!html.includes('noindex'));assert(!html.includes('aggregateRating'));assert(html.includes('sponsored noopener'));assert(sitemap.includes(path));
  for(const im of [a.cover,...a.sections.map(s=>s.image).filter(Boolean)])assert(html.includes(im.url),im.url);
  for(const id of a.productIds){const p=store.products.find(p=>p.id===id);assert(html.includes(p.affiliateUrl.replaceAll('&','&amp;')));}
  console.log('published verified:',a.slug);
 }
 assert.equal((await fetch(base+'/api/weekend-prep/admin')).status,403);
 assert.equal((await fetch(base+'/weekend-prep/not-a-real-prep-article')).status,404);
 const imageCount=store.articles.reduce((n,a)=>n+1+a.sections.filter(s=>s.image).length,0);
 console.log(`PASS: ${store.articles.length} curated public articles, ${imageCount} images, product links, canonical/schema/sitemap/filter protection`);
}finally{child?.kill();}
