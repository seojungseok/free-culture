import test from 'node:test';
import assert from 'node:assert/strict';
import {selectTopDeals} from '../../lib/toss-top-deals.mjs';

const now=Date.parse('2026-11-05T03:00:00Z');
const deal={id:1,name:'어묵 확인된 하루특가',image:'https://example.com/image',price:1000,discountRate:15,links:{home:'https://toss.shopping/example'},endAt:new Date(now+1000).toISOString()};
const feed={version:1,checkedAt:new Date(now).toISOString(),products:[deal]};

test('confirmed daily deal disappears at its expiry boundary',()=>{
 assert.equal(selectTopDeals(feed,now).length,1);
 assert.equal(selectTopDeals(feed,now+1000).length,0);
});
test('ordinary items and items without an original link are excluded',()=>{
 assert.equal(selectTopDeals({...feed,products:[{...deal,endAt:undefined},{...deal,links:{}},{...deal,links:{home:'https://toss.shopping.example.com/link'}}]},now).length,0);
});
test('discount and food identity are required',()=>{
 assert.equal(selectTopDeals({...feed,products:[{...deal,discountRate:0},{...deal,discountRate:undefined},{...deal,name:'피크닉매트'},{...deal,name:'김치냉장고'},{...deal,name:'커피잔 세트'},{...deal,name:'호빵 찜기'}]},now).length,0);
});
test('겨울 완제품은 허용하되 붕어빵 조리도구와 재료는 제외한다',()=>{
 const products=['단팥 호빵','냉동 붕어빵','붕어빵 기계','붕어빵 팥앙금'].map(name=>({...deal,name}));
 assert.deepEqual(selectTopDeals({...feed,products},now).map(p=>p.name),['단팥 호빵','냉동 붕어빵']);
});
test('stale feeds and feeds from before the scheduled maintenance remain hidden',()=>{
 assert.equal(selectTopDeals({...feed,checkedAt:new Date(now-6*3600000).toISOString()},now).length,0);
 assert.equal(selectTopDeals({...feed,checkedAt:'2026-10-29T14:00:00Z'},now).length,0);
});
