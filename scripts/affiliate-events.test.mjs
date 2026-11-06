import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {affiliatePlacements,normalizeAffiliateEvent} from '../lib/affiliate-events.mjs';
import {createAffiliateEventReport} from '../lib/affiliate-events-report.mjs';
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

test('offline reports use Korean date boundaries and discard identity fields and malformed lines',()=>{
 const report=createAffiliateEventReport({from:'2026-11-06',to:'2026-11-06'});
 const put=(at,patch={})=>report.consume(JSON.stringify({...event,event:'affiliate_impression',at,...patch}));
 put('2026-11-05T14:59:59.999Z');
 put('2026-11-05T15:00:00.000Z',{email:'synthetic@example.invalid',ip:'192.0.2.1',sessionId:'do-not-keep'});
 put('2026-11-06T14:59:59.999Z',{event:'affiliate_click'});
 put('2026-11-06T15:00:00.000Z');
 put('2026-02-30T00:00:00.000Z');
 put('2026-11-06T01:00:00.000Z',{event:'purchase'});
 put('2026-11-06T01:00:00.000Z',{page:'/?email=private'});
 report.consume('{broken');report.consume('');
 const result=report.finish();
 assert.deepEqual(result.quality,{inspectedLines:9,blankLines:1,invalidJsonLines:1,invalidEventLines:2,invalidTimestampLines:1,excludedByPeriod:2,acceptedEvents:2});
 assert.deepEqual(result.totals,{impressions:1,clicks:1,saveActions:0,clickToImpressionEventRatioPct:100});
 assert.equal(result.rows.length,1);assert.equal(result.rows[0].date,'2026-11-06');
 assert.equal(result.period.fromInclusive,'2026-11-05T15:00:00.000Z');
 assert.equal(result.period.toExclusive,'2026-11-06T15:00:00.000Z');
 assert.equal(result.purchaseCollected,false);
 assert(!/synthetic@|192\.0\.2\.1|sessionId|do-not-keep/.test(JSON.stringify(result)));
});

test('offline event ratios preserve repeats, protect zero denominators, and separate placements and products',()=>{
 const report=createAffiliateEventReport();
 for(const kind of ['affiliate_impression','affiliate_click','affiliate_click','affiliate_save'])report.consume(JSON.stringify({...event,event:kind,at:'2026-11-06T00:00:00.000Z'}));
 report.consume(JSON.stringify({...event,productId:456,placement:'food_deal_rail',at:'2026-11-06T00:00:00.000Z'}));
 const result=report.finish();
 assert.equal(result.rows.length,2);
 const hero=result.rows.find(row=>row.productId===123),rail=result.rows.find(row=>row.productId===456);
 assert.equal(hero.clickToImpressionEventRatioPct,200);assert.equal(hero.saveActions,1);
 assert.equal(rail.impressions,0);assert.equal(rail.clickToImpressionEventRatioPct,null);
 assert.equal(result.metricLabel,'클릭/노출 이벤트 비율');
 assert.match(result.notes.join(' '),/사용자 전환율/);assert.match(result.notes.join(' '),/최종 저장 수가 아닙니다/);
});

test('timestamp periods are half-open and invalid periods fail instead of producing misleading zero counts',()=>{
 const report=createAffiliateEventReport({from:'2026-11-06T09:00:00+09:00',to:'2026-11-06T09:01:00+09:00'});
 for(const at of ['2026-11-06T00:00:00.000Z','2026-11-06T00:01:00.000Z'])report.consume(JSON.stringify({...event,at}));
 assert.equal(report.finish().quality.acceptedEvents,1);assert.equal(report.finish().quality.excludedByPeriod,1);
 for(const options of [{from:'2026-02-30'},{to:'2026-11-06T10:00:00'},{from:'2026-11-07',to:'2026-11-06'}])assert.throws(()=>createAffiliateEventReport(options));
});

test('offline CLI reads UTC-partitioned logs without modifying them and refuses missing logs or in-place output',()=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'mwohaji-affiliate-report-'));
 try{
  const input=path.join(temporary,'events');fs.mkdirSync(input);
  const name=path.join(input,'2026-11-05.jsonl');
  const original=JSON.stringify({...event,at:'2026-11-05T15:01:00.000Z',privateField:'synthetic-private'})+'\n{broken\n';
  fs.writeFileSync(name,original);
  fs.writeFileSync(path.join(input,'unrelated.json'),'private file must not be read');
  const script=path.join(root,'scripts/report-affiliate-events.mjs'),output=path.join(temporary,'report.json');
  const run=(...args)=>spawnSync(process.execPath,[script,'--input',input,...args],{encoding:'utf8'});
  const good=run('--from','2026-11-06','--to','2026-11-06','--output',output);
  assert.equal(good.status,0,good.stderr);
  const report=JSON.parse(fs.readFileSync(output,'utf8'));
  assert.equal(report.sourceFiles,1);assert.equal(report.quality.acceptedEvents,1);assert.equal(report.quality.invalidJsonLines,1);
  assert.equal(fs.readFileSync(name,'utf8'),original);
  assert(!fs.readFileSync(output,'utf8').includes('synthetic-private'));
  const savedReport=fs.readFileSync(output,'utf8');
  assert.equal(run('--output',output).status,1);
  assert.equal(fs.readFileSync(output,'utf8'),savedReport);
  assert.equal(run('--output',name).status,1);
  if(process.platform==='win32')assert.equal(run('--output',path.join(input.toUpperCase(),'new-report.json')).status,1);
  assert.equal(fs.readFileSync(name,'utf8'),original);
  const empty=path.join(temporary,'empty');fs.mkdirSync(empty);
  const missing=spawnSync(process.execPath,[script,'--input',empty],{encoding:'utf8'});
  assert.equal(missing.status,1);assert.equal(JSON.parse(missing.stderr).passed,false);
 }finally{
  const resolved=path.resolve(temporary);
  assert(resolved.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(resolved).startsWith('mwohaji-affiliate-report-'));
  fs.rmSync(resolved,{recursive:true,force:true});
 }
});
