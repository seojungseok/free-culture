import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceImageUrl,sceneReferences,imageRequest} from './image-request.mjs';
const refs=Array.from({length:3},(_,i)=>({productId:String(i),imageUrl:`https://image1.coupangcdn.com/image/${i}.jpg`}));
test('server scene generation sends all three references to edits, one medium WebP',async()=>{
 let count=0;const r=await imageRequest({model:'gpt-image-2',prompt:'test',references:refs},async()=>{count++;return new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'image/jpeg'}});});
 assert.equal(count,3);assert.equal(r.endpoint,'edits');assert.equal(r.body.getAll('image[]').length,3);assert.equal(r.body.get('n'),'1');assert.equal(r.body.get('quality'),'medium');assert.equal(r.body.get('output_format'),'webp');
});
test('SSRF and redirect targets, unverified products, wrong counts fail closed',async()=>{
 for(const url of ['http://127.0.0.1/x','https://evil.test/x','https://a.coupangcdn.com.evil.test/x','https://u:p@image1.coupangcdn.com/x'])assert.equal(referenceImageUrl(url),false);
 assert.throws(()=>sceneReferences({contentStyle:'shoppable-scene-v2',productIds:['1','2','3']},[]));
 await assert.rejects(imageRequest({model:'gpt-image-2',prompt:'test',references:refs.slice(0,2)}));
 await assert.rejects(imageRequest({model:'gpt-image-2',prompt:'test',references:refs},async()=>new Response('blocked',{status:403})));
});
