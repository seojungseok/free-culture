import test from 'node:test';
import assert from 'node:assert/strict';
import {currentProducts,freshnessMs} from '../../lib/sharelink-policy.mjs';
import {unwrap,SharelinkError,withClient} from './client.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {eligibleHomeDeal,homeDealGroup} from './home-deals.mjs';
const now=Date.parse('2026-10-06T15:00:00Z');
test('home shows only matching active timed food deals, never regular discounts or sold-out items',()=>{
 const p={tacaItemId:1,displayName:'토시살 200g 2팩',displayPrice:23000,isSoldOut:false,mainImageUrls:['https://example.com/product.jpg']};
 assert.equal(eligibleHomeDeal({...p,endAt:new Date(now+1000).toISOString()},p,now),true);
 for(const change of [{},{endAt:new Date(now).toISOString()},{endAt:'invalid'},{endAt:new Date(now+1000).toISOString(),isSoldOut:true}])assert.equal(eligibleHomeDeal({...p,...change},p,now),false);
 assert.equal(eligibleHomeDeal({...p,endAt:new Date(now+1000).toISOString()},{...p,displayPrice:24000},now),false);
 assert.equal(homeDealGroup('연세우유 190ml 48개'),'daily');assert.equal(homeDealGroup('가방 백팩'),null);
});
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
test('collector delays mixed product and link calls so every rolling minute stays within 10 requests and 10 products',async()=>{
 const stateDir=fs.mkdtempSync(path.join(os.tmpdir(),'sharelink-budget-test-'));
 const originalNow=Date.now,originalTimeout=globalThis.setTimeout;
 const access=process.env.TOSS_SHARELINK_ACCESS_KEY,secret=process.env.TOSS_SHARELINK_SECRET_KEY;
 let clock=originalNow();const calls=[];
 try {
  process.env.TOSS_SHARELINK_ACCESS_KEY='test-access';process.env.TOSS_SHARELINK_SECRET_KEY='test-secret';
  Date.now=()=>clock;globalThis.setTimeout=(cb,ms)=>{clock+=ms;queueMicrotask(cb);return 0;};
  const fetchImpl=async url=>{
   if(url.includes('/token'))return new Response(JSON.stringify({access_token:'test-token',expires_in:3600}),{status:200});
   calls.push({at:clock,products:url.includes('/products/detail')?1:0});
   return new Response(JSON.stringify({resultType:'SUCCESS',success:{items:[]}}),{status:200});
  };
  await withClient(async({request})=>{for(let i=0;i<15;i++)await request('/products/detail?tacaItemIds=1');for(let i=0;i<12;i++)await request('/links',{method:'POST',body:{}});},{stateDir,fetchImpl});
  assert.equal(calls.length,27);
  for(const c of calls){const window=calls.filter(r=>r.at<=c.at&&r.at>c.at-60000);assert.ok(window.length<=10);assert.ok(window.reduce((n,r)=>n+r.products,0)<=10);}
  assert.ok(clock-calls[0].at>=120000);
 }finally{
  Date.now=originalNow;globalThis.setTimeout=originalTimeout;
  if(access===undefined)delete process.env.TOSS_SHARELINK_ACCESS_KEY;else process.env.TOSS_SHARELINK_ACCESS_KEY=access;
  if(secret===undefined)delete process.env.TOSS_SHARELINK_SECRET_KEY;else process.env.TOSS_SHARELINK_SECRET_KEY=secret;
  for(const name of fs.readdirSync(stateDir))fs.unlinkSync(path.join(stateDir,name));fs.rmdirSync(stateDir);
 }
});
