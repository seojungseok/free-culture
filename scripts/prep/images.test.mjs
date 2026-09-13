import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
const store=JSON.parse(fs.readFileSync('data/weekend-prep.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('data/weekend-prep-image-batch.json','utf8'));
test('all 18 articles contain three distinct reviewed images, 54 total',async()=>{
 const body=JSON.parse(fs.readFileSync('data/weekend-prep-body-images.json','utf8'));
 assert.equal(body.images.length,35);
 const hashes=new Set();let total=0;
 for(const a of store.articles){
  const photos=[a.cover,...a.sections.map(s=>s.image).filter(Boolean)];
  assert.equal(photos.length,3,a.slug);
  for(const im of photos){
   assert(im.generated&&im.reviewed&&im.alt&&im.prompt);
   const bytes=fs.readFileSync('public'+im.url),meta=await sharp(bytes).metadata();
   assert.equal(meta.format,'webp');assert.equal(meta.width,im.width);assert.equal(meta.height,im.height);
   assert(meta.width<=1200&&meta.height<=800);assert(bytes.length<400000);
   hashes.add(crypto.createHash('sha256').update(bytes).digest('hex'));total++;
  }
 }
 assert.equal(total,54);assert.equal(hashes.size,54);
});
test('18 articles have unique reviewed AI covers; no article exceeds four images',async()=>{
 assert.equal(manifest.images.length,17);assert.equal(store.articles.length,18);
 const hashes=new Set();
 for(const a of store.articles){
  assert(a.cover.generated&&a.cover.reviewed&&a.cover.prompt&&a.cover.alt);
  const bytes=fs.readFileSync('public'+a.cover.url),meta=await sharp(bytes).metadata();
  assert.equal(meta.format,'webp');assert.equal(meta.width,a.cover.width);assert.equal(meta.height,a.cover.height);
  assert(meta.width<=1200&&meta.height<=800);assert(bytes.length<400000);
  hashes.add(crypto.createHash('sha256').update(bytes).digest('hex'));
  assert([a.cover,...a.sections.map(s=>s.image).filter(Boolean)].filter(i=>i.generated).length<=4);
  assert.equal(a.status,'published');assert(a.reviewed);
 }
 assert.equal(hashes.size,18);
});
