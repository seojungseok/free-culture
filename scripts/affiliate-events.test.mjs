import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {affiliatePlacements,normalizeAffiliateEvent} from '../lib/affiliate-events.mjs';
const require=createRequire(import.meta.url),ts=require('typescript');
const root=fileURLToPath(new URL('../',import.meta.url));
const event={event:'affiliate_click',provider:'toss',placement:'home_winter_hero',page:'/',productId:123};

test('the receiver contract covers every maintained placement without collecting extra fields',()=>{
 for(const placement of affiliatePlacements){
  assert.deepEqual(normalizeAffiliateEvent({...event,placement,email:'must not be stored',destination:'must not be stored'}),{...event,placement});
 }
 for(const patch of [{placement:'unknown'},{event:'purchase'},{provider:'unknown'},{page:'/?email=private'},{page:'https://example.com'},{productId:-1},{productId:1.5},{productId:Number.MAX_SAFE_INTEGER+1}]){
  assert.equal(normalizeAffiliateEvent({...event,...patch}),null);
 }
 assert.equal(normalizeAffiliateEvent(null),null);
 assert.equal(normalizeAffiliateEvent([]),null);
});

test('real event route accepts hero, daily-deal and accommodation tracking and writes only the approved fields',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mwohaji-affiliate-test-'));
 const originalDir=process.env.AFFILIATE_EVENTS_DIR;
 process.env.AFFILIATE_EVENTS_DIR=dir;
 try{
  const source=fs.readFileSync(path.join(root,'app/api/affiliate/events/route.ts'),'utf8').replace('@/lib/affiliate-events.mjs',pathToFileURL(path.join(root,'lib/affiliate-events.mjs')).href);
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const route=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
  const request=(body,origin='https://mwohaji.kr')=>new Request('https://mwohaji.kr/api/affiliate/events',{method:'POST',headers:{origin,'content-type':'application/json'},body:typeof body==='string'?body:JSON.stringify(body)});
  for(const placement of ['home_winter_hero','food_deal_rail','home_stay']){
   for(const type of ['affiliate_impression','affiliate_click'])assert.equal((await route.POST(request({...event,event:type,placement,privateField:'discard'}))).status,204);
  }
  assert.equal((await route.POST(request({...event,placement:'unknown'}))).status,400);
  assert.equal((await route.POST(request('{broken'))).status,400);
  assert.equal((await route.POST(request(event,'https://unrelated.example'))).status,403);
  const lines=fs.readdirSync(dir).flatMap(name=>fs.readFileSync(path.join(dir,name),'utf8').trim().split('\n').map(line=>JSON.parse(line)));
  assert.equal(lines.length,6);
  for(const row of lines)assert.deepEqual(Object.keys(row).sort(),['at','event','page','placement','productId','provider']);
 }finally{
  if(originalDir===undefined)delete process.env.AFFILIATE_EVENTS_DIR;else process.env.AFFILIATE_EVENTS_DIR=originalDir;
  // Resolve and constrain the deletion to this freshly-created temporary directory.
  const resolved=path.resolve(dir),temporaryRoot=path.resolve(os.tmpdir())+path.sep;
  assert.ok(resolved.startsWith(temporaryRoot)&&path.basename(resolved).startsWith('mwohaji-affiliate-test-'));
  fs.rmSync(resolved,{recursive:true,force:true});
 }
});

function trackingRuntime(sendBeacon){
 const requests=[],ga=[];
 const source=fs.readFileSync(path.join(root,'lib/affiliate-track.ts'),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const sandbox={exports:{},require:()=>({normalizeAffiliateEvent}),Blob,navigator:{sendBeacon},window:{gtag:(...args)=>ga.push(args)},fetch:(...args)=>{requests.push(args);return Promise.resolve({status:204});}};
 vm.runInNewContext(compiled,sandbox);
 return {track:sandbox.exports.affiliateTrack,requests,ga};
}
test('beacon failure falls back once and successful queueing never duplicates the same request',()=>{
 for(const sendBeacon of [undefined,()=>false,()=>{throw new Error('blocked')}]){const {track,requests,ga}=trackingRuntime(sendBeacon);assert.doesNotThrow(()=>track('affiliate_click','toss','food_deal_rail','/',123));assert.equal(requests.length,1);assert.equal(requests[0][1].keepalive,true);assert.equal(ga.length,1);}
 const {track,requests,ga}=trackingRuntime(()=>true);track('affiliate_click','toss','home_winter_hero','/',123);assert.equal(requests.length,0);assert.equal(ga.length,1);
 track('purchase','toss','home_winter_hero','/',123);assert.equal(requests.length,0);assert.equal(ga.length,1);
});
