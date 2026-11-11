import test from 'node:test';
import assert from 'node:assert/strict';
import {collectIngredients,validCandidate} from './complete-ingredient-links.mjs';
import {ingredientQueries} from './ingredient-completion-plan.mjs';

const product={productId:123,productName:'국내산 세척 대파 1kg, 1개',productUrl:'https://link.coupang.com/re/AFFSDP?pageKey=123&itemId=456&lptag=AF123',productImage:'https://thumbnail.coupangcdn.com/example.jpg'};
test('catalog collection is explicit, one-product, sequential, and preserves the original URL',async()=>{
 let calls=0;const waits=[];
 const fetchProduct=async url=>{calls++;assert.equal(new URL(url).searchParams.get('limit'),'1');return Response.json({rCode:'0',data:{productData:[product]}});};
 await assert.rejects(collectIngredients({fetchProduct}));assert.equal(calls,0);
 const result=await collectIngredients({enabled:true,queries:[ingredientQueries[0],ingredientQueries[0]],fetchProduct,sleep:async ms=>waits.push(ms)});
 assert.equal(calls,2);assert.deepEqual(waits,[7100]);assert.equal(result.candidates.length,2);assert.equal(result.candidates[0].reviewed,false);assert(result.candidates[0].url===product.productUrl);
});
test('a failed response stops immediately without retrying or looking up more products',async()=>{
 let calls=0;await assert.rejects(collectIngredients({enabled:true,fetchProduct:async()=>{calls++;return new Response(null,{status:429});}}));assert.equal(calls,1);
});
test('an unrelated or malformed listing is never approved as a candidate',()=>{
 const q=ingredientQueries[0];assert(validCandidate(product,q));
 for(const patch of [{productName:'대파 씨앗'},{isOutOfStock:true},{productUrl:'https://link.coupang.com.evil.invalid/re/AFFSDP'},{productImage:'http://thumbnail.coupangcdn.com/example.jpg'},{productId:999}])assert.equal(validCandidate({...product,...patch},q),false);
 assert.equal(new Set(ingredientQueries.map(q=>q.key)).size,ingredientQueries.length);
});
