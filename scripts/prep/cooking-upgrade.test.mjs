import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const sandbox={exports:{},URL,Date};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/prep-affiliate.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,sandbox);
const {prepGuideItems,prepShoppingItems}=sandbox.exports;
const store=JSON.parse(fs.readFileSync('data/weekend-prep.json','utf8'));
const cooking=JSON.parse(fs.readFileSync('data/prep-cooking-guides.json','utf8'));

test('every published cooking guide omits household purchases and preserves its ingredient links',()=>{
 let checked=0,hidden=0;
 const before=JSON.stringify(store);
 for(const article of store.articles.filter(article=>/요리|재료/.test(article.category))){
  checked++;
  const raw=article.checklist || article.shoppingItems || [];
  const shown=prepGuideItems(article,store.articles);
  hidden+=raw.length-shown.length;
  assert(shown.length>0,article.slug);
  assert(shown.every(item=>item.group!=='common'),article.slug);
  assert(shown.every(item=>!(/냄비|국자|국그릇|접시|식판|조리.?집게|도마|뒤집개|생수|조리용 물/).test(item.label)),article.slug);
  if(article.checklist?.length){
   assert(!/냄비|국자|국그릇|조리도구|집게/.test(article.description),article.slug);
   const photos=[article.cover,...article.sections.map(section=>section.image).filter(Boolean)];
   assert(photos.length>=3&&photos.length<=4,article.slug);
   assert.equal(new Set(photos.map(photo=>photo.url)).size,photos.length,article.slug);
  }
  for(const item of shown){assert.equal(item.affiliate?.reviewed,true);assert(raw.includes(item));}
 }
 assert.equal(checked,42);
 assert(hidden>100);
 assert.equal(JSON.stringify(store),before,'Filtering never deletes the original tracking records');
});
test('camping equipment and outdoor play retain their reviewed products',()=>{
 for(const article of store.articles.filter(article=>['캠핑용품','야외 놀이'].includes(article.category))){
  const items=article.shoppingItems || article.checklist;
  assert.equal(prepShoppingItems(article,items),items);
 }
});

test('ingredient guides show clean ingredient covers and move finished food into the body',()=>{
 const ingredients=store.articles.filter(article=>article.checklist?.length);
 assert.equal(ingredients.length,33);
 for(const article of ingredients){
  const photos=[article.cover,...article.sections.map(section=>section.image).filter(Boolean)];
  assert(!photos.some(photo=>photo.url.includes('-cover-unified-v2.webp')),article.slug);
  assert(!article.cover.url.endsWith('-finished.webp'),article.slug);
 }
 const fishcake=ingredients.find(article=>article.slug==='camping-fishcake-soup-ingredient-checklist');
 assert.equal(fishcake.cover.url,'/prep-images/camp-fishcake-soup-checklist-cover.webp');
 assert.equal(fishcake.sections[0].image.url,'/prep-images/camp-fishcake-soup-finished.webp');
});
test('each soup recipe has usable quantities, ingredient order, corrections, alternatives and dated sources',()=>{
 assert.equal(Object.keys(cooking.guides).length,15);
 assert(Number.isFinite(Date.parse(cooking.checkedAt)));
 const titles=new Set();
 for(const [slug,guide] of Object.entries(cooking.guides)){
  assert(store.articles.some(article=>article.slug===slug&&article.status==='published'));
  assert(!titles.has(guide.title));titles.add(guide.title);
  assert(guide.ingredients.length>=3);
  assert(guide.steps.length>=6);
  assert(guide.steps.every(step=>step.title&&step.text.length>25));
  assert(guide.fixes.length>=2);
  assert(guide.alternative&&guide.safety);
  assert(guide.sources.every(source=>new URL(source.url).protocol==='https:'));
  assert(!/몇 분이면 완성|무조건|직접 먹어|별점/.test(JSON.stringify(guide)));
 }
});
test('seafood and meat guides retain objective cooking endpoints',()=>{
 for(const slug of ['autumn-flower-crab-soup-ingredient-checklist','camping-seafood-hotpot-ingredient-checklist','camping-seafood-ramen-ingredients','camping-mussel-soup-ingredients','autumn-camping-mackerel-potato-braise-ingredient-checklist','autumn-20260920-mussel-seaweed-soup-ingredient-checklist']){
  assert.match(cooking.guides[slug].safety,/85℃.*1분/);
 }
 for(const slug of ['camping-beef-mushroom-hotpot-ingredient-checklist','autumn-camping-pork-kimchi-stew-ingredient-checklist','autumn-camping-chicken-potato-stew-ingredient-checklist']){
  assert.match(cooking.guides[slug].safety,/75℃.*1분/);
 }
 assert.match(JSON.stringify(cooking.guides['autumn-camping-chicken-potato-stew-ingredient-checklist']),/생닭을 씻지/);
});
