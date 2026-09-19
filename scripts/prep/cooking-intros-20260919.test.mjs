import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {validateShape,publicationErrors} from './content.mjs';
const now=JSON.parse(fs.readFileSync('data/weekend-prep.json','utf8'));
test('23 cooking introductions preserve existing content and all 69 photo links',()=>{
 const old=JSON.parse(execFileSync('git',['show','033d81c:data/weekend-prep.json'],{encoding:'utf8',maxBuffer:10000000}));
 assert.deepEqual(now.products,old.products);assert.equal(now.articles.length,old.articles.length);
 let count=0,photos=0;
 for(const before of old.articles){
  const after=structuredClone(now.articles.find(a=>a.slug===before.slug));
  if(before.salesFormat==='food-checklist'){
   count++;assert(after.introduction.heading);assert(after.introduction.text.length>140);
   assert.equal(after.introduction.text.split('\n').length,2);
   assert.deepEqual(publicationErrors(after,now),[]);
   for(const im of [after.cover,...after.sections.map(s=>s.image).filter(Boolean)]){
    photos++;assert(im.alt.trim().length>8);assert(im.tags.length>=3);
    for(const t of im.tags)assert(now.products.some(p=>p.id===t.productId&&p.affiliateUrl));
   }
   delete after.introduction;after.updatedAt=before.updatedAt;
  }
  assert.deepEqual(after,before);
 }
 assert.equal(count,23);assert.equal(photos,69);validateShape(now);
 const source=fs.readFileSync('components/PrepArticle.tsx','utf8');
 assert(source.indexOf('aria-label="요리 소개"')<source.indexOf('<PrepChecklist'));
});
test('invalid introduction is rejected',()=>{
 const bad=structuredClone(now);bad.articles[0].introduction={heading:'',text:42};
 assert.throws(()=>validateShape(bad),/요리 소개/);
});
