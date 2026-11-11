import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {createVisitorCounter,visitorDay} from '../lib/visitor-count.mjs';

test('the counter keeps the original Korean day and public historical namespace',async()=>{
 assert.equal(visitorDay(new Date('2026-11-11T14:59:59.999Z')),'20261111');
 assert.equal(visitorDay(new Date('2026-11-11T15:00:00Z')),'20261112');
 const calls=[];const counts={total:54474,d20261112:158};
 const counter=createVisitorCounter({now:()=>new Date('2026-11-11T15:01:00Z'),fetcher:async(url,options)=>{calls.push({url,options});const key=new URL(url).pathname.split('/').at(-1);return Response.json({value:counts[key]});}});
 assert.deepEqual(await counter.get(),{day:'20261112',total:54474,today:158});
 await counter.get();assert.equal(calls.length,2);
 for(const {url,options}of calls){assert(new URL(url).pathname.startsWith('/get/weekendpick-kr/'));assert.deepEqual(options.headers,{Accept:'application/json'});}
});
test('a failed increment is never retried or replaced by a reset',async()=>{
 const calls=[];const counter=createVisitorCounter({fetcher:async url=>{calls.push(url);return new Response(null,{status:503});}});
 await assert.rejects(counter.hit());assert.equal(calls.length,2);assert(calls.every(url=>new URL(url).pathname.startsWith('/hit/weekendpick-kr/')));
});
function browserRuntime({hostname='mwohaji.kr',blockedStorage=false,blockedWrite=false,failedPost=false}={}){
 const calls=[],effects=[],storage=new Map(),states=[];
 const source=fs.readFileSync('components/VisitorCount.tsx','utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const sandbox={exports:{},Date,Number,Error,window:{location:{hostname}},sessionStorage:{getItem:key=>{if(blockedStorage)throw Error('blocked');return storage.get(key);},setItem:(key,value)=>{if(blockedWrite)throw Error('blocked');storage.set(key,value);}},fetch:async(url,options)=>{calls.push(options.method);if(failedPost&&options.method==='POST')throw Error('uncertain result');return Response.json({day:'20261112',total:54474,today:158});},require:name=>name==='react'?{useState:()=>[null,value=>states.push(value)],useEffect:fn=>effects.push(fn)}:{jsx:()=>({})}};
 vm.runInNewContext(compiled,sandbox);return {render:sandbox.exports.default,effects,calls,states};
}
test('the browser claims the existing daily session flag before sending and reads on uncertain writes',async()=>{
 const browser=browserRuntime({failedPost:true});browser.render();browser.render();browser.effects[0]();browser.effects[1]();
 await new Promise(resolve=>setImmediate(resolve));assert.equal(browser.calls.filter(v=>v==='POST').length,1);assert(browser.calls.includes('GET'));assert(browser.states.length>0);
});
test('blocked browser storage and local previews still display counts without adding visits',async()=>{
 for(const options of [{blockedStorage:true},{blockedWrite:true},{hostname:'localhost'}]){
  const browser=browserRuntime(options);browser.render();assert.doesNotThrow(()=>browser.effects[0]());await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(browser.calls,['GET']);assert.equal(browser.states[0].total,54474);
 }
});
