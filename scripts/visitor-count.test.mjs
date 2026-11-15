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
function browserRuntime({hostname='mwohaji.kr',blockedStorage=false,blockedWrite=false,failedPost=false,alreadyCounted=false,hidden=false}={}){
 const calls=[],effects=[],storage=new Map(),states=[],timers=new Map(),listeners=new Map(),ids=new Set();let timerId=0,firstFailure=failedPost;
 let clock=Date.parse('2026-11-15T08:00:00Z');
 class Clock extends Date{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
 if(alreadyCounted)storage.set('vc_20261115','1');
 const source=fs.readFileSync('components/VisitorCount.tsx','utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const events={addEventListener:(event,fn)=>listeners.set(event,fn),removeEventListener:(event,fn)=>{if(listeners.get(event)===fn)listeners.delete(event);}};
 const document={hidden,...events};
 const sandbox={exports:{},Date:Clock,Number,Error,Math,AbortController,crypto:{randomUUID:()=> '12345678-abcd-4321-abcd-123456789012'},document,window:{location:{hostname},...events},setTimeout:(fn,delay)=>{const id=++timerId;timers.set(id,{fn,delay});return id;},clearTimeout:id=>timers.delete(id),sessionStorage:{getItem:key=>{if(blockedStorage)throw Error('blocked');return storage.get(key);},setItem:(key,value)=>{if(blockedWrite)throw Error('blocked');storage.set(key,value);}},fetch:async(url,options)=>{calls.push(options);if(options.method==='POST'){ids.add(JSON.parse(options.body).visitId);if(firstFailure){firstFailure=false;throw Error('response lost after durable write');}}return Response.json({day:visitorDay(new Date(clock)),total:55908+ids.size,today:315+ids.size});},require:name=>name==='react'?{useState:()=>[null,value=>states.push(value)],useEffect:fn=>effects.push(fn)}:{jsx:()=>({})}};
 vm.runInNewContext(compiled,sandbox);return {render:sandbox.exports.default,effects,calls,states,storage,timers,listeners,ids,document,setClock:value=>{clock=Date.parse(value);},retry:()=>{const [id,timer]=[...timers].sort((a,b)=>a[1].delay-b[1].delay)[0];timers.delete(id);timer.fn();}};
}
test('a lost write response leaves no done flag and safely retries the same id',async()=>{
 const browser=browserRuntime({failedPost:true});browser.render();const cleanup=browser.effects[0]();
 await new Promise(resolve=>setImmediate(resolve));assert.equal(browser.storage.get('vc_20261115'),undefined);assert.equal(browser.ids.size,1);
 browser.retry();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(browser.calls.length,2);assert.equal(browser.calls[0].body,browser.calls[1].body);assert.equal(browser.ids.size,1);assert.equal(browser.storage.get('vc_20261115'),'1');assert(browser.states.some(value=>value?.total===55909));
 cleanup();assert.equal(browser.timers.size,0);assert.equal(browser.listeners.size,0);
});
test('strict-mode remounts use the same pending session token',async()=>{
 const browser=browserRuntime();browser.render();const first=browser.effects[0]();first();const last=browser.effects[0]();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(browser.ids.size,1);assert(browser.calls.every(call=>call.body===browser.calls[0].body));last();
});
test('blocked storage, previews and already-counted legacy sessions only read counts',async()=>{
 for(const options of [{blockedStorage:true},{blockedWrite:true},{hostname:'localhost'},{alreadyCounted:true}]){
  const browser=browserRuntime(options);browser.render();const cleanup=browser.effects[0]();await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(browser.calls.map(call=>call.method),['GET']);assert(browser.states.some(value=>value?.total===55908));cleanup();
 }
});
test('hidden tabs wait for visibility and Korean midnight can count the next day',async()=>{
 const browser=browserRuntime({hidden:true});browser.render();const cleanup=browser.effects[0]();await new Promise(resolve=>setImmediate(resolve));assert.equal(browser.calls.length,0);
 browser.document.hidden=false;browser.listeners.get('visibilitychange')();await new Promise(resolve=>setImmediate(resolve));assert.equal(browser.storage.get('vc_20261115'),'1');
 browser.setClock('2026-11-15T15:00:00Z');browser.listeners.get('focus')();await new Promise(resolve=>setImmediate(resolve));assert.equal(browser.storage.get('vc_20261116'),'1');cleanup();
});
