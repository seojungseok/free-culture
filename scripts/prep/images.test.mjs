import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
const store=JSON.parse(fs.readFileSync('data/weekend-prep.json','utf8'));
import {publicationErrors} from './content.mjs';
test('all saved articles contain three or four distinct compressed images',async()=>{
 const hashes=new Set();let total=0;
 for(const a of store.articles){
  const photos=[a.cover,...a.sections.map(s=>s.image).filter(Boolean)];
  assert(photos.length>=3&&photos.length<=4,a.slug);
  for(const im of photos){
   assert(im.generated&&im.alt&&im.prompt);
   const bytes=fs.readFileSync('public'+im.url),meta=await sharp(bytes).metadata();
   assert.equal(meta.format,'webp');assert.equal(meta.width,im.width);assert.equal(meta.height,im.height);
   assert(meta.width<=1200&&meta.height<=800);assert(bytes.length<400000);
   hashes.add(crypto.createHash('sha256').update(bytes).digest('hex'));total++;
  }
 }
 assert.equal(hashes.size,total);
});
test('all eleven curated articles are published and fully reviewed',()=>{
 assert.equal(store.articles.length,11);
 for(const a of store.articles){
  const errors=publicationErrors(a,store);
  if(a.status==='published')assert.deepEqual(errors,[],a.slug);
  assert.equal(a.status,'published');
 }
});
test('five camping stir-fry guides can be followed from measured prep through recovery',()=>{
 const expected={
  'camp-jeyuk-bokkeum':['돼지고기 600g','40~60초','중심에 붉은 기','물이 고였다면','간편 제육볶음'],
  'camp-sundae-bokkeum':['순대 500g','1.5~2cm','주걱 두 개','양념이 바닥에 눌어붙으면','순대볶음 밀키트'],
  'camp-dakgalbi':['양념 닭 500g','고구마 150g','13~15분','가장 큰 닭 조각','양념된 한입 닭갈비'],
  'camp-ojingeo-bokkeum':['손질 오징어 500g','채소를 먼저','마지막 2~3분','오징어만 먼저','냉동 오징어볶음'],
  'camp-kimchi-fried-rice':['찬밥 420g','김치 국물은 분리','30~40초','밥이 질게','냉동 김치볶음밥'],
 };
 for(const [slug,phrases] of Object.entries(expected)){
  const article=store.articles.find(article=>article.slug===slug);assert(article,slug);
  const body=article.sections.map(section=>`${section.heading} ${section.text}`).join(' ');
  assert(body.length>1800,`${slug}: 본문이 따라 하기엔 짧습니다.`);
  for(const phrase of phrases)assert(body.includes(phrase),`${slug}: ${phrase}`);
  assert.equal(article.sections.at(-1).productIds.includes(article.shortcutProductId),true,slug);
 }
});
test('family article preserves age restriction beside every reused scene',()=>{
 const a=store.articles.find(a=>a.slug==='family-park-ring-ball-play');assert.equal(a.status,'published');
 assert(a.description.includes('14세 이상'));
 for(const im of [a.cover,...a.sections.map(s=>s.image).filter(Boolean)])assert(im.usageNotice.includes('14세 미만'));
 assert(store.products.find(p=>p.id==='9305516249').specification.includes('14세 미만용으로 권하지 않음'));
});
test('published guides contain the actionable cooking or buying core, not filler length',()=>{
 const body=slug=>store.articles.find(a=>a.slug===slug).sections.map(s=>`${s.heading} ${s.text}`).join(' ');
 const seafood=body('camp-seafood-pot-table');for(const phrase of ['무를 먼저 15분','단단한 해물부터','짜면 뜨거운 물','미나리'])assert(seafood.includes(phrase));
 const noodle=body('camp-noodle-lunch');for(const phrase of ['찬물','토렴','고명을 먼저'])assert(noodle.includes(phrase));
 const skewers=body('grilled-vegetable-side-dishes');for(const phrase of ['약 2cm','중불 직화','간접열'])assert(skewers.includes(phrase));
 const gear=body('autumn-camp-tarp-rest-corner');for(const phrase of ['에어텐트','타프','릴렉스체어','무엇부터 살까'])assert(gear.includes(phrase));
 for(const a of store.articles){
  assert([a.cover,...a.sections.map(s=>s.image).filter(Boolean)].flatMap(i=>i.tags).length>=3);
  assert(!JSON.stringify(a).includes('{{product:'));
 }
});
