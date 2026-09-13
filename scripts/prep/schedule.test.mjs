import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {koreaDate,planDaily,planInitial,remainingSlots,runSlots} from './schedule.mjs';
const config=JSON.parse(fs.readFileSync('data/weekend-prep-schedule.json','utf8'));
test('initial batch has exactly 18 unique topics, three per category',()=>{
 const slots=planInitial(config);assert.equal(slots.length,18);
 assert.deepEqual(remainingSlots(slots,slots),[]);
});
test('tomorrow 05 KST boundary, no initial-day daily batch',()=>{
 assert.equal(koreaDate('2026-09-13T20:00:00Z'),'2026-09-14');
 assert.equal(planDaily(config,'2026-09-13T10:00:00Z').length,0);
 assert.equal(planDaily(config,'2026-09-13T19:59:59Z').length,0);
 assert.equal(planDaily(config,'2026-09-13T20:00:00Z').length,5);
});
test('six-day rotation gives every category exactly five slots',()=>{
 const counts={};for(let day=14;day<20;day++)for(const slot of planDaily(config,`2026-09-${day}T05:00:00+09:00`))counts[slot.category]=(counts[slot.category]||0)+1;
 assert.deepEqual(Object.values(counts),[5,5,5,5,5,5]);
});
test('restart and failure receipts consume slots; no backlog catch-up',()=>{
 const slots=planDaily(config,'2026-09-14T05:00:00+09:00');
 assert.deepEqual(planDaily(config,'2026-09-14T23:00:00+09:00'),slots);
 const restored=JSON.parse(JSON.stringify(slots.map(s=>({id:s.id,status:'pending'}))));
 assert.equal(remainingSlots(slots,restored).length,0);
 assert.equal(planDaily(config,'2026-09-20T05:00:00+09:00').length,5);
});
test('one failed article leaves four successful daily attempts',async()=>{
 const records=[],success=[];
 await runSlots(planDaily(config,'2026-09-14T05:00:00+09:00'),[],{
  reserve:async s=>records.push({id:s.id,status:'pending'}),
  execute:async s=>{if(s.id.endsWith(':2'))throw Error('mock');success.push(s.id);},
  complete:async(s,r)=>Object.assign(records.find(x=>x.id===s.id),r)
 });
 assert.equal(success.length,4);assert.equal(records.filter(r=>r.status==='held').length,1);
});
test('cannot relax daily total or category balance',()=>{
 assert.throws(()=>planDaily({...config,dailyTotal:30},new Date()));
 assert.throws(()=>planInitial({...config,initialPerCategory:5}));
 assert.equal(config.enabled,false,'pending integration must not claim active automation');
});
