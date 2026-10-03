import test from 'node:test';import assert from 'node:assert/strict';import {enrichCoursePlaces} from './enrichCoursePlaces.mjs';import {QuotaError} from './lib/tourClient.mjs';
const courses=[{stops:[{placeId:'120',placeIdSource:{subcontentid:'120'}},{placeId:'120',placeIdSource:{subcontentid:'120'}},{placeId:'121',placeIdSource:{subcontentid:'121'}}]}];
test('official IDs are deduplicated and existing destination records are not fetched',async()=>{const store={places:{}},seen=[];const r=await enrichCoursePlaces({courses,existingIds:new Set(['121']),store,max:3,common:async(id,b)=>{seen.push(id);b.used++;return{contentid:id,contenttypeid:'12',title:'장소',overview:'실제 소개'};},intro:async(id,t,b)=>{b.used++;return{contentid:id,usetime:'09:00~18:00'};},info:async(id,t,b)=>{b.used++;return[{infoname:'입장료',infotext:'2,000원'}];},pause:async()=>{}});assert.deepEqual(seen,['120']);assert.equal(r.requests,3);assert.equal(store.places['120'].intro.usetime,'09:00~18:00');assert.equal(store.places['120'].info[0].text,'2,000원');});
test('wrong metadata identity cannot create a destination',async()=>{const store={places:{}};const r=await enrichCoursePlaces({courses,existingIds:new Set(['121']),store,common:async()=>({contentid:'999',title:'다른 장소'}),pause:async()=>{}});assert.equal(r.exitCode,1);assert.deepEqual(store.places,{});});
test('quota after metadata preserves it without claiming fresh visit conditions',async()=>{const store={places:{}};const r=await enrichCoursePlaces({courses,existingIds:new Set(['121']),store,common:async(id,b)=>{b.used++;return{contentid:id,title:'장소',contenttypeid:'12'};},intro:async()=>{throw new QuotaError('provider');},pause:async()=>{}});assert.equal(r.exitCode,75);assert.equal(store.places['120'].title,'장소');assert.equal(store.places['120'].introCheckedAt,undefined);});
test('empty intro checks and partial batches still progress to the missing info stage',async()=>{const store={places:{}};const base={courses,existingIds:new Set(['121']),store,pause:async()=>{},common:async(id,b)=>{b.used++;return{contentid:id,title:'장소',contenttypeid:'12'};},intro:async(id,t,b)=>{b.used++;return null;},info:async(id,t,b)=>{b.used++;return[{infoname:'입장료',infotext:'무료'}];}};await enrichCoursePlaces({...base,max:2});assert.ok(store.places['120'].introAttemptCheckedAt);assert.equal(store.places['120'].introCheckedAt,undefined);const next=await enrichCoursePlaces({...base,max:1,common:async()=>assert.fail('fresh common'),intro:async()=>assert.fail('empty intro already checked')});assert.equal(next.infoSaved,1);assert.equal(store.places['120'].info[0].text,'무료');assert.equal((await enrichCoursePlaces(base)).targets,0);});

test('successful empty common results preserve old facts and do not repeat before 30 days',async()=>{
  const previous={id:'120',title:'기존 장소',overview:'기존 공식 소개',commonCheckedAt:'2026-08-01T00:00:00Z',introCheckedAt:'2026-08-01T00:00:00Z',intro:{usetime:'기존 운영시간'}};
  const store={places:{'120':structuredClone(previous)}};
  let requests=0;
  const options={courses,existingIds:new Set(['121']),store,pause:async()=>{},now:()=>new Date('2026-10-04T00:00:00Z'),common:async(id,b)=>{requests++;b.used++;return undefined;},intro:async()=>assert.fail('no intro for empty common'),info:async()=>assert.fail('no info for empty common')};
  const result=await enrichCoursePlaces(options);
  assert.equal(result.exitCode,0);assert.equal(result.commonEmpty,1);assert.equal(result.attemptsSaved,1);
  assert.deepEqual(store.places['120'],previous);assert.equal(store.emptyCommonChecks['120'],'2026-10-04T00:00:00.000Z');
  assert.equal((await enrichCoursePlaces(options)).targets,0);assert.equal(requests,1);
  const refreshed=await enrichCoursePlaces({...options,now:()=>new Date('2026-11-05T00:00:00Z'),common:async(id,b)=>{b.used++;return{contentid:id,title:'갱신 장소',contenttypeid:'12'};},intro:async()=>null,info:async()=>[]});
  assert.equal(refreshed.exitCode,0);assert.equal(store.emptyCommonChecks['120'],undefined);assert.equal(store.places['120'].title,'갱신 장소');
});

test('three unavailable course IDs do not fail or prevent the next valid destination',async()=>{
  const ids=['2569482','2823794','2916358','120'];const store={places:{}};
  const result=await enrichCoursePlaces({courses:[{stops:ids.map(id=>({placeId:id,placeIdSource:{subcontentid:id}}))}],existingIds:new Set(),store,pause:async()=>{},common:async(id,b)=>{b.used++;return id==='120'?{contentid:id,title:'정상 장소',contenttypeid:'12'}:null;},intro:async()=>null,info:async()=>[]});
  assert.equal(result.exitCode,0);assert.equal(result.commonEmpty,3);assert.equal(result.commonSaved,1);assert.equal(result.failures,0);
  assert.equal(store.places['120'].title,'정상 장소');assert.equal(store.places['2569482'],undefined);assert.ok(store.emptyCommonChecks['2569482']);
});

test('malformed common data and real API errors still fail without marking an empty check',async()=>{
  for(const common of [async()=>({}),async()=>{throw new Error('HTTP 403');},async()=>{throw new Error('API 연결 실패');}]) {
    const store={places:{}};const result=await enrichCoursePlaces({courses,existingIds:new Set(['121']),store,common,pause:async()=>{}});
    assert.equal(result.exitCode,1);assert.equal(result.commonEmpty,0);assert.deepEqual(store.places,{});
  }
});
