import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateShape,publicationErrors} from './content.mjs';
// Synthetic fixtures stay in memory and are never saved as product/content data.
function fixture(){
 const store=JSON.parse(fs.readFileSync('data/weekend-prep.json','utf8'));
 store.articles=[structuredClone(store.articles[0])];
 const a=store.articles[0];a.contentStyle='shoppable-scene-v2';
 delete a.salesFormat;delete a.quietProductIds;delete a.shortcutProductId;delete a.checklist;
 store.products=Array.from({length:4},(_,i)=>({...store.products[0],id:`fixture-${i}`,name:`테스트 상품 ${i}`,affiliateUrl:`https://link.coupang.com/a/fixture${i}`,image:`https://example.test/product-${i}.jpg`}));
 a.productIds=store.products.map(p=>p.id);
 for(const s of a.sections)s.productIds=[];
 a.sections[0].productIds=a.productIds;
 a.sections[0].text+=' '+store.products.map(p=>`${p.name} 선택 기준과 배치 방법을 확인합니다.`).join(' ');
 for(const im of [a.cover,...a.sections.map(s=>s.image).filter(Boolean)]){
  im.tags=store.products.map((p,i)=>({productId:p.id,x:15+i*20,y:50}));
  im.referenceProducts=store.products.map(p=>({productId:p.id,imageUrl:p.image}));
  im.productMatchReviewed=true;
 }
 return {store,a};
}
test('one scene supports four distinct reference-matched product hotspots',()=>{const {store,a}=fixture();validateShape(store);assert.deepEqual(publicationErrors(a,store),[]);});
test('three distinct products in each scene are permitted',()=>{const {store,a}=fixture();for(const im of [a.cover,...a.sections.map(s=>s.image).filter(Boolean)])im.tags.pop();assert.deepEqual(publicationErrors(a,store),[]);});
test('single-product play uses one reviewed product link in every scene',()=>{
 const store=JSON.parse(fs.readFileSync('data/weekend-prep.json','utf8'));
 const a=store.articles.find(a=>a.salesFormat==='single-product-play');
 assert(a);assert.equal(a.productIds.length,1);
 for(const im of [a.cover,...a.sections.map(s=>s.image).filter(Boolean)]){
  assert.equal(im.tags.length,1);assert.equal(im.tags[0].productId,a.productIds[0]);
 }
 assert.deepEqual(publicationErrors(a,store),[]);
});
test('missing, duplicate, or over-cap scene tags block publication',()=>{for(const mode of ['few','duplicate','many']){const {store,a}=fixture();if(mode==='few')a.cover.tags=a.cover.tags.slice(0,2);else if(mode==='duplicate')a.cover.tags[1].productId=a.cover.tags[0].productId;else a.cover.tags.push({productId:'fifth',x:50,y:80});assert(publicationErrors(a,store).some(x=>x.includes('태그 3~4개')));}});
test('reference URL mismatch, missing review, and missing product explanation block publication',()=>{const {store,a}=fixture();a.cover.referenceProducts[0].imageUrl='https://example.test/wrong.jpg';a.cover.productMatchReviewed=false;a.sections[0].productIds=a.sections[0].productIds.slice(1);const errors=publicationErrors(a,store);for(const word of ['참고 사진','외형·위치','본문 설명'])assert(errors.some(x=>x.includes(word)));});
test('malformed reference metadata and out-of-range coordinates fail shape validation',()=>{for(const change of [a=>a.cover.referenceProducts={},a=>a.cover.referenceProducts=[null],a=>a.cover.productMatchReviewed='yes',a=>a.cover.tags[0].x=101]){const {store,a}=fixture();change(a);assert.throws(()=>validateShape(store));}});
