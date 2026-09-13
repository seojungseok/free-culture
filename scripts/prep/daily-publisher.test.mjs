import test from 'node:test';
import assert from 'node:assert/strict';
import {publishDaily} from './daily-publisher.mjs';
import {planDaily} from './schedule.mjs';
const config={timezone:'Asia/Seoul',dailyTotal:5,publishHour:5,dailyStartDate:'2026-09-14',publisherEnabled:true};
const now='2026-09-14T05:00:00+09:00';
function fixture(){return {version:1,products:[],articles:planDaily(config,now).map((s,i)=>({slug:`fixture-${i}`,category:s.category,dailySlotId:s.id,publishAt:s.publishAt,status:'scheduled',contentStyle:'shoppable-scene-v2',productIds:[String(i)]}))};}
const checks={validate:()=>[],links:async()=>[]};
test('five total, not five per category; no repeat after durable reload',async()=>{
 const a=await publishDaily(fixture(),config,now,checks);assert.equal(a.report.published.length,5);
 const b=await publishDaily(JSON.parse(JSON.stringify(a.store)),config,now,checks);assert.equal(b.report.published.length,0);assert.equal(b.changed,false);
});
test('one failed article leaves four published, failure consumes only its slot',async()=>{
 const a=await publishDaily(fixture(),config,now,{...checks,links:async a=>a.slug==='fixture-1'?['bad']:[]});
 assert.equal(a.report.published.length,4);assert.equal(a.report.held.length,1);
 const b=await publishDaily(a.store,config,now,checks);assert.equal(b.report.published.length,0);
});
test('no early publication, no old backlog burst, no initial replacement publication',async()=>{
 assert.equal((await publishDaily(fixture(),config,'2026-09-14T04:59:59+09:00',checks)).report.published.length,0);
 assert.equal((await publishDaily(fixture(),config,'2026-09-15T05:00:00+09:00',checks)).report.published.length,0);
 const s=fixture();s.articles.forEach(a=>delete a.dailySlotId);
 assert.equal((await publishDaily(s,config,now,checks)).report.published.length,0);
});
test('duplicate slots, wrong category and shared products do not bypass cap',async()=>{
 const s=fixture();s.articles.push({...s.articles[0],slug:'duplicate'});s.articles[1].category='wrong';s.articles[2].productIds=s.articles[3].productIds;
 const result=await publishDaily(s,config,now,checks);assert.equal(result.report.published.length,1);assert.equal(result.report.held.length,4);
});
test('empty queue remains empty without marking fabricated success',async()=>{
 const r=await publishDaily({version:1,products:[],articles:[]},config,now,checks);assert.equal(r.report.published.length,0);assert.equal(r.report.missing.length,5);
});
