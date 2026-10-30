import test from 'node:test';
import assert from 'node:assert/strict';
import {coupangFetch} from './coupang.mjs';
import {sharedProductRequest} from './github-budget.mjs';

test('search and one-product deeplink use the same durable budget without caching links',async()=>{
 const old=globalThis.fetch, names=['COUPANG_ACCESS_KEY','COUPANG_SECRET_KEY','COUPANG_QUEUE_GITHUB_TOKEN'];
 const previous=Object.fromEntries(names.map(n=>[n,process.env[n]]));
 Object.assign(process.env,{COUPANG_ACCESS_KEY:'fixture',COUPANG_SECRET_KEY:'fixture',COUPANG_QUEUE_GITHUB_TOKEN:'fixture'});
 let rev=1, tick=0, calls=[], acquisitions=0;
 let state={version:1,revision:'a',cap:10,window:60000,interval:6100,nextAt:0,events:[],lock:null,cache:{}};
 globalThis.fetch=async(input,options)=>{
  const u=new URL(input);const date=new Date(Date.UTC(2026,0,1,0,0,tick+=10)).toUTCString();
  if(u.hostname==='api.github.com'){
   if(options.method==='PUT'){const body=JSON.parse(options.body);assert.equal(body.sha,String(rev));const next=JSON.parse(Buffer.from(body.content,'base64').toString());if(!state.lock&&next.lock)acquisitions++;state=next;rev++;return Response.json({},{headers:{date}});}
   return Response.json({sha:String(rev),encoding:'base64',content:Buffer.from(JSON.stringify(state)).toString('base64')},{headers:{date}});
  }
  assert.equal(u.hostname,'api-gateway.coupang.com');calls.push({url:u,options});
  return Response.json({rCode:'0',data:options.method==='POST'?[{shortenUrl:'https://link.coupang.com/a/fixture'}]:{productData:[]}});
 };
 try {
  const search='https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/v1/products/search?keyword=test&limit=10';
  const link='https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink';
  const body={coupangUrls:['https://www.coupang.com/vp/products/123?itemId=456'],subId:'oneulfit'};
  await coupangFetch(search);await coupangFetch(link,{method:'POST',body});await coupangFetch(link,{method:'POST',body});
  assert.equal(calls.length,3);assert.equal(calls[0].url.searchParams.get('limit'),'1');assert.equal(calls[1].options.method,'POST');
  assert.deepEqual(JSON.parse(calls[1].options.body),body);assert.equal(acquisitions,3);assert.equal(Object.keys(state.cache).length,1);
  const before=calls.length;
  await assert.rejects(coupangFetch(link,{method:'POST',body:{coupangUrls:[body.coupangUrls[0],body.coupangUrls[0]]}}));
  await assert.rejects(coupangFetch(link,{method:'POST',body:{coupangUrls:['https://example.com/vp/products/123']}}));
  await assert.rejects(coupangFetch('https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/v1/products/goldbox'));
  assert.equal(calls.length,before);
 } finally {globalThis.fetch=old;for(const n of names){if(previous[n]===undefined)delete process.env[n];else process.env[n]=previous[n];}}
});

test('disabled cache does not reuse or persist link responses',async()=>{
 let state={version:1,revision:'a',cap:10,window:60000,interval:6100,nextAt:0,events:[],lock:null,cache:{}};
 let rev=0,now=0,calls=0;
 const backend={read:async()=>({state:structuredClone(state),sha:String(rev),now}),write:async(s,next)=>{if(s.sha!==String(rev))return false;state=structuredClone(next);rev++;return true;}};
 const opts={backend,sleep:async ms=>{now+=ms;},cacheEnabled:false};
 for(let i=0;i<2;i++)await sharedProductRequest('same',async()=>{calls++;return Response.json({ok:true});},opts);
 assert.equal(calls,2);assert.deepEqual(state.cache,{});
});
