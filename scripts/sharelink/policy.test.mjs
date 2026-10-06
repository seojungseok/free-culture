import test from 'node:test';
import assert from 'node:assert/strict';
import {currentProducts,freshnessMs} from '../../lib/sharelink-policy.mjs';
import {unwrap,SharelinkError} from './client.mjs';
const now=Date.parse('2026-10-06T15:00:00Z');
test('expired daily deals disappear at the exact end time; regular items remain',()=>{
 const feed={checkedAt:new Date(now-1000).toISOString(),products:[{id:1,endAt:new Date(now).toISOString()},{id:2},{id:3,endAt:'invalid'},{id:4,endAt:new Date(now+1000).toISOString()}]};
 assert.deepEqual(currentProducts(feed,now).map(p=>p.id),[2,4]);
});
test('stale, invalid and future-dated feeds cannot display prices',()=>{
 for(const at of [now-freshnessMs,now+1,NaN])assert.deepEqual(currentProducts({checkedAt:Number.isFinite(at)?new Date(at).toISOString():'invalid',products:[{id:1}]},now),[]);
});
test('empty successful provider results are normal; HTTP 200 provider failure is an error',()=>{
 const response={ok:true,status:200,headers:new Headers()};
 assert.deepEqual(unwrap(response,{resultType:'SUCCESS',success:{items:[]}}),{items:[]});
 assert.throws(()=>unwrap(response,{resultType:'FAIL',error:{errorCode:'OPENAPI_DENIED',reason:'private text'}}),e=>e instanceof SharelinkError&&!e.message.includes('private text'));
});
