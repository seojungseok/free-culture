import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
const store=JSON.parse(fs.readFileSync('data/weekend-prep.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('data/weekend-prep-image-batch.json','utf8'));
test('18 drafts have unique reviewed AI covers; no article exceeds four images',async()=>{
 assert.equal(manifest.images.length,17);assert.equal(store.articles.length,18);
 const hashes=new Set();
 for(const a of store.articles){
  assert(a.cover.generated&&a.cover.reviewed&&a.cover.prompt&&a.cover.alt);
  const bytes=fs.readFileSync('public'+a.cover.url),meta=await sharp(bytes).metadata();
  assert.equal(meta.format,'webp');assert.equal(meta.width,a.cover.width);assert.equal(meta.height,a.cover.height);
  assert(meta.width<=1200&&meta.height<=800);assert(bytes.length<400000);
  hashes.add(crypto.createHash('sha256').update(bytes).digest('hex'));
  assert([a.cover,...a.sections.map(s=>s.image).filter(Boolean)].filter(i=>i.generated).length<=4);
  assert.equal(a.status,'draft','image approval does not approve products/publication');
 }
 assert.equal(hashes.size,18);
});
