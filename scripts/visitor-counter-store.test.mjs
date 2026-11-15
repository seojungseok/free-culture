import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createFileVisitorCounter,validVisitorId} from '../lib/visitor-counter-store.mjs';
const baseline={version:1,namespace:'weekendpick-kr',day:'20261115',total:55908,today:315};
const fixed=()=>new Date('2026-11-15T08:00:00Z');
const temporary=()=>{fs.mkdirSync('.cache',{recursive:true});return fs.mkdtempSync(path.resolve('.cache/visitor-counter-test-'));};
const token='12345678-abcd-4321-abcd-123456789012';
function store(directory=temporary(),extra={}){return createFileVisitorCounter({directory,baseline,now:fixed,...extra});}

test('reads preserve history without adding visits or an upstream request',()=>{
 const directory=temporary(),counter=store(directory);assert.deepEqual(counter.get(),{day:'20261115',total:55908,today:315});assert.deepEqual(counter.get(),counter.get());
 assert.deepEqual(fs.readdirSync(directory),['baseline.json']);assert.throws(()=>store(undefined,{directory:undefined}).get(),/not configured/);
});
test('same-session retries and process restarts preserve one committed visit',()=>{
 const directory=temporary(),counter=store(directory);assert.equal(counter.hit(token).recorded,true);assert.deepEqual(counter.hit(token),{day:'20261115',total:55909,today:316,recorded:false});
 assert.deepEqual(store(directory).get(),{day:'20261115',total:55909,today:316});assert.equal(store(directory).hit(token).recorded,false);
 assert.equal(store(directory,{baseline:{...baseline,total:0,today:0}}).get().total,55909);
 const raw=fs.readFileSync(path.join(directory,'20261115.visits'),'utf8');assert(!raw.includes(token));assert.match(raw.trim(),/^[a-f0-9]{64}$/);
});
test('Korean midnight starts today at zero and keeps total while allowing the same session again',()=>{
 const directory=temporary();let time=new Date('2026-11-15T14:59:59.999Z');const counter=store(directory,{now:()=>time});counter.hit(token);
 time=new Date('2026-11-15T15:00:00Z');assert.deepEqual(counter.get(),{day:'20261116',total:55909,today:0});assert.deepEqual(counter.hit(token),{day:'20261116',total:55910,today:1,recorded:true});
});
test('separate writers refresh caches and physical duplicates count once',()=>{
 const directory=temporary(),a=store(directory),b=store(directory);a.get();a.hit(token);b.hit('another-session-12345678');assert.equal(a.get().today,317);
 const file=path.join(directory,'20261115.visits'),row=fs.readFileSync(file,'utf8').trim().split('\n')[0];fs.appendFileSync(file,'\n'+row+'\n');assert.equal(a.get().today,317);
});
test('concurrent processes cannot inflate one id or lose independent sessions',async()=>{
 const directory=temporary();store(directory).get();const moduleUrl=new URL('../lib/visitor-counter-store.mjs',import.meta.url).href;
 const run=id=>new Promise((resolve,reject)=>{const source=`import {createFileVisitorCounter} from ${JSON.stringify(moduleUrl)};const c=createFileVisitorCounter({directory:process.argv[1],baseline:${JSON.stringify(baseline)},now:()=>new Date('2026-11-15T08:00:00Z')});c.hit(process.argv[2]);`;const child=spawn(process.execPath,['--input-type=module','-e',source,directory,id],{stdio:['ignore','ignore','pipe']});let error='';child.stderr.on('data',chunk=>{error+=chunk;});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(error||'Worker failed')));});
 await Promise.all([token,token,token,'distinct-session-1111','distinct-session-2222','distinct-session-3333'].map(run));assert.deepEqual(store(directory).get(),{day:'20261115',total:55912,today:319});
});
test('a crash tail cannot join the next record or discard committed visits',()=>{
 const directory=temporary(),counter=store(directory);counter.hit(token);fs.appendFileSync(path.join(directory,'20261115.visits'),'abcd');assert.equal(counter.hit('a-new-session-12345678').today,317);assert.equal(store(directory).get().total,55910);
});
test('a complete hash without its commit newline is not counted',()=>{
 const directory=temporary(),counter=store(directory);counter.get();fs.writeFileSync(path.join(directory,'20261115.visits'),'a'.repeat(64));assert.equal(counter.get().today,315);
 counter.hit(token);assert.equal(store(directory).get().today,317);
});
test('invalid identities or damaged history fail instead of inventing zero',()=>{
 for(const id of ['',null,'../x','a'.repeat(81)])assert.equal(validVisitorId(id),false);
 assert.throws(()=>store().hit('../x'),/Invalid visitor id/);assert.throws(()=>store(temporary(),{baseline:{...baseline,total:-1}}).get(),/baseline/);
 const directory=temporary();fs.writeFileSync(path.join(directory,'baseline.json'),'broken');assert.throws(()=>store(directory).get());
});
test('legacy recovery cannot reduce history or overwrite new visits and stops after full recovery',async()=>{
 const counter=store();counter.hit(token);let calls=0;
 await counter.reconcileLegacy({fetcher:async url=>{calls++;return url.endsWith('/total')?Response.json({value:55920}):new Response(null,{status:503});}});assert.deepEqual(counter.get(),{day:'20261115',total:55921,today:316});
 await counter.reconcileLegacy({fetcher:async url=>{calls++;return Response.json({value:url.endsWith('/total')?55919:320});}});assert.deepEqual(counter.get(),{day:'20261115',total:55921,today:321});
 await counter.reconcileLegacy({fetcher:()=>{throw Error('Must not fetch after recovery');}});assert.equal(calls,4);
});
test('an external outage never blocks local counting and recovery only reads original keys',async()=>{
 const counter=store(),calls=[];await counter.reconcileLegacy({fetcher:async url=>{calls.push(url);throw Error('offline');}});
 assert.equal(counter.hit(token).total,55909);assert.equal(counter.get().total,55909);assert.equal(calls.length,2);assert(calls.every(url=>new URL(url).pathname.startsWith('/get/weekendpick-kr/')));
});
