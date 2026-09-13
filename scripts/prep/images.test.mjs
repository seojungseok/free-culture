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
test('published articles are fully reviewed and unresolved drafts remain held',()=>{
 for(const a of store.articles){
  const errors=publicationErrors(a,store);
  if(a.status==='published')assert.deepEqual(errors,[],a.slug);
  if(['family-park-ring-ball-play','barbecue-serving-station','pork-grill-vegetable-table','autumn-sunset-picnic-layering'].includes(a.slug)){
   assert.equal(a.status,'draft');assert(errors.length>0);
  }
 }
});
test('new basic articles have useful body copy and nine reviewed hotspots',()=>{
 for(const slug of ['camp-noodle-lunch','grilled-vegetable-side-dishes','autumn-camp-tarp-rest-corner']){
  const a=store.articles.find(a=>a.slug===slug);assert(a);assert.equal(a.status,'published');
  assert(a.sections.map(s=>s.text).join('').length>1000);
  assert.equal([a.cover,...a.sections.map(s=>s.image).filter(Boolean)].flatMap(i=>i.tags).length,9);
  assert(!JSON.stringify(a).includes('{{product:'));
 }
});
