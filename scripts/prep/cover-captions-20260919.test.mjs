import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
test('caption-only covers preserve all text, URLs, products and remaining media',async()=>{
 const old=JSON.parse(execFileSync('git',['show','2c4b526:data/weekend-prep.json'],{encoding:'utf8',maxBuffer:10000000}));
 const now=JSON.parse(fs.readFileSync('data/weekend-prep.json','utf8'));
 const changes=JSON.parse(fs.readFileSync('data/prep-cover-captions-20260919.json','utf8')).items;
 assert.deepEqual(now.products,old.products);
 assert.equal(now.articles.length,old.articles.length);
 let changed=0;
 for(const before of old.articles){
  const after=structuredClone(now.articles.find(a=>a.slug===before.slug));
  const item=changes.find(i=>'/prep-images/'+i.file===before.cover.url);
  if(item){
   changed++;
   assert.equal(after.cover.url,'/prep-images/'+item.output);
   const image=await sharp('public'+after.cover.url).metadata();
   assert.equal(image.width,1200);assert.equal(image.height,800);
   assert(fs.statSync('public'+after.cover.url).size<400000);
   assert.deepEqual(after.cover.referenceProducts,before.cover.referenceProducts);
   assert.deepEqual(after.cover.tags.map(t=>t.productId),before.cover.tags.map(t=>t.productId));
   after.cover=before.cover;after.updatedAt=before.updatedAt;
  }
  assert.deepEqual(after,before);
 }
 assert.equal(changed,changes.length);
});
