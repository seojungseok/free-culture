import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {publicationErrors,validateShape} from './content.mjs';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const store=read('data/weekend-prep.json');
const review=read('data/winter-camping-publication-review-20261115.json');
const images=read('data/winter-camping-images-20261115.json');
const articles=review.recipeSlugs.map(slug=>store.articles.find(a=>a.slug===slug));

test('15 complete new recipes preserve every field of the existing 44 articles',()=>{
 validateShape(store);assert.equal(articles.length,15);assert(articles.every(Boolean));
 assert.equal(new Set(articles.map(a=>a.title)).size,15);
 assert.equal(Object.keys(review.previousArticles).length,44);
 for(const [slug,hash]of Object.entries(review.previousArticles)){
  const old=store.articles.find(a=>a.slug===slug);assert(old,slug);
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(old)).digest('hex'),hash,slug);
 }
 for(const article of articles){assert.equal(article.category,'캠핑요리 가이드');assert.deepEqual(publicationErrors(article,store),[],article.slug);assert(article.description.length<=80);}
});
test('each recipe has three inspected distinct scenes and responsive compressed files',()=>{
 assert.equal(images.images.length,45);assert.equal(review.visualReview.reviewed,true);
 const hashes=new Set();
 for(const article of articles){
  const photos=[article.cover,...article.sections.flatMap(s=>s.image?[s.image]:[])];assert.equal(photos.length,3);
  for(const photo of photos){const record=images.images.find(r=>r.url===photo.url);assert(record);assert.equal(photo.reviewed,true);assert(photo.prompt);assert(!/AI 연출|AI로|생성형/.test(photo.alt));
   for(const variant of record.variants){const data=fs.readFileSync('public'+variant.url);assert.equal(crypto.createHash('sha256').update(data).digest('hex'),variant.sha256);}
   assert(!hashes.has(record.variants[0].sha256));hashes.add(record.variants[0].sha256);
  }
 }
 assert.equal(hashes.size,45);
});
test('visible quantities and all recipe instructions are sourced from the same text as the Recipe schema',()=>{
 for(const article of articles){
  assert(article.recipe.ingredients.length>=4);assert.equal(article.recipe.steps.length,5);
  for(const step of article.recipe.steps)assert(article.sections.some(s=>s.text===step.text&&(s.heading===step.title||s.heading.endsWith(' · '+step.title))),article.slug);
  for(const item of article.shoppingItems){assert(item.quantity);assert(item.role);assert(article.recipe.ingredients.includes(item.label+' '+item.quantity));}
  const text=article.sections.map(s=>s.text).join('\n');
  assert(text.length>900,article.slug);assert(article.sources.length>=2);
  assert(article.sources.every(s=>s.url.startsWith('https://')&&Number.isFinite(Date.parse(s.checkedAt))));
  assert(!/직접 먹어|직접 써|무조건|조회수 보장|분이면 완성|별점/.test(text));
 }
});
test('only exact existing reviewed ingredient records have purchase buttons',()=>{
 const old=store.articles.filter(a=>review.previousArticles[a.slug]);
 const approved=new Set(old.flatMap(a=>[...(a.checklist||[]),...(a.shoppingItems||[])]).filter(i=>i.affiliate?.reviewed).map(i=>JSON.stringify(i.affiliate)));
 let ordinary=0;for(const article of articles){let linked=0;for(const item of article.shoppingItems){if(item.affiliate){linked++;assert(approved.has(JSON.stringify(item.affiliate)),article.slug+' / '+item.label);}else ordinary++;}assert(linked>=3);}
 assert.equal(ordinary,19);assert.equal(review.newProductLookup.requestsMade,0);
 for(const [key,label]of [['mille-feuille-nabe','샤브샤브용 소고기'],['pork-suyuk','수육용 통삼겹살'],['sundubu-jjigae','순두부'],['tteok-mandu-soup','떡국떡']])assert(!articles.find(a=>a.slug==='winter-camping-'+key).shoppingItems.find(i=>i.label===label).affiliate);
});
test('search evidence is observed Naver wording, with real related links and food-specific cooking endpoints',()=>{
 const evidence=read('data/winter-camping-keyword-research-20261115.json');assert(evidence.results.length>=15);assert(evidence.results.every(r=>r.suggestions.length));
 for(const article of articles){for(const link of article.internalLinks.filter(l=>l.href.startsWith('/weekend-prep/')))assert(store.articles.some(a=>'/weekend-prep/'+a.slug===link.href),link.href);}
 for(const key of ['mille-feuille-nabe','mandu-jeongol','dakhanmari','gochujang-jjigae','beef-radish-soup','pork-suyuk','beef-sprouts-stir-fry'])assert.match(JSON.stringify(articles.find(a=>a.slug==='winter-camping-'+key).sections),/75℃.*1분/);
 for(const key of ['oyster-radish-soup','dongtae-tang','gambas'])assert.match(JSON.stringify(articles.find(a=>a.slug==='winter-camping-'+key).sections),/85℃.*1분/);
 assert.match(JSON.stringify(articles.find(a=>a.slug==='winter-camping-steamed-eggs').sections),/71℃/);
});
