import test from 'node:test';
import assert from 'node:assert/strict';
import { candidate, chooseAllowed, buildCourse, dailyRemaining, safeEvidence, checkSummaries } from './lib/winter-course.mjs';

const places=new Map(Array.from({length:8},(_,i)=>[String(i+1),{id:String(i+1),title:`장소${i+1}`,addr:`서울특별시 종로구 길 ${i+1}`,mapx:String(127+i*0.01),mapy:'37.5',type:'14'}]));
const stops=[...places.values()].map(p=>({name:p.title,placeId:p.id,addr:p.addr,mapx:p.mapx,mapy:p.mapy}));
const base={id:'x',source:'auto',duration:'당일',area:'서울',seasons:['winter'],stops:stops.slice(0,3)};
test('only winter-tagged, ID and address matched, plausible coordinate data enter pool',()=>{
 assert.ok(candidate(base,places));
 assert.equal(candidate({...base,seasons:['autumn']},places),null);
 assert.equal(candidate({...base,stops:[{...stops[0],name:'다른 곳'},...stops.slice(1,3)]},places),null);
 assert.equal(candidate({...base,stops:[{...stops[0],addr:'다른 주소'},...stops.slice(1,3)]},places),null);
 assert.equal(candidate({...base,stops:[{...stops[0],mapx:'0'},...stops.slice(1,3)]},places),null);
 const heritage={...places.get('1'),title:'고인돌 유적 [유네스코 세계유산]'};
 const heritagePlaces=new Map(places);heritagePlaces.set('1',heritage);
 assert.ok(candidate({...base,stops:[{...stops[0],name:heritage.title},...stops.slice(1,3)]},heritagePlaces));
 assert.equal(candidate({...base,stops:[{...stops[0],name:'<script>장소</script>'},...stops.slice(1,3)]},places),null);
});
test('published and held drafts count against separate daily KST limits',()=>{
 const rows=[{status:'held',duration:'당일',createdAt:'2026-10-27T15:00:00Z'},{status:'published',duration:'1박2일',publishedAt:'2026-10-28T00:00:00Z'},{status:'draft',duration:'당일',createdAt:'2026-10-27T14:59:59Z'}];
 assert.deepEqual(dailyRemaining(rows,{daily:{'당일':3,'1박2일':2}},new Date('2026-10-28T01:00:00Z')),{'당일':2,'1박2일':1});
});
test('known outdated Jeju attractions and unverified island/mountain routes are held',()=>{
 for(const id of ['2472824','2553685','3066924','126890','579637']) {
  const p={...places.get('1'),id}; const index=new Map(places); index.set(id,p);
  const s={...stops[0],placeId:id};
  assert.equal(candidate({...base,stops:[s,...stops.slice(1,3)]},index),null);
 }
});
test('model can select only approved IDs and cannot provide unsupported prose',()=>{
 const pool=[candidate(base,places)];
 assert.equal(chooseAllowed('{"day":["x"],"overnight":[]}',pool,{'당일':1,'1박2일':0})[0].sourceCourseId,'x');
 assert.throws(()=>chooseAllowed('{"day":["other"],"overnight":[]}',pool,{'당일':1,'1박2일':0}));
 assert.throws(()=>chooseAllowed('{"day":["x"],"overnight":[],"text":"무료"}',pool,{'당일':1,'1박2일':0}));
});
test('articles are held, distinguish days and only report straight-line distances',()=>{
 const c=candidate({...base,id:'o',duration:'1박2일',stops:stops.slice(0,6)},places);
 const a=buildCourse(c,new Date('2026-10-28T01:00:00Z'));
 assert.equal(a.status,'draft');assert.equal(a.stops.filter(s=>s.day===1).length,3);assert.equal(a.stops.filter(s=>s.day===2).length,3);
 assert.match(JSON.stringify(a.sections),/직선거리/);assert.doesNotMatch(JSON.stringify(a.sections),/무료|당일 배송|관람시간|눈꽃 보장/);
 assert.equal(a.sections.filter(s=>s.heading.includes('문화시설')).length,6);
});
test('generated feature needs an exact supplied quote and excludes variable or numeric claims',()=>{
 const original='이 박물관은 지역의 역사와 문화를 소개하는 전시 공간이다.';
 const e=new Map([['1',[original]]]);
 assert.equal(checkSummaries(JSON.stringify({stops:[{placeId:'1',quote:original,summary:'지역의 역사와 문화를 소개합니다.'}]}),e).size,1);
 assert.throws(()=>checkSummaries(JSON.stringify({stops:[{placeId:'1',quote:'없는 원문',summary:'지역의 역사와 문화를 소개합니다.'}]}),e));
 assert.throws(()=>checkSummaries(JSON.stringify({stops:[{placeId:'1',quote:original,summary:'무료로 방문할 수 있는 전시 공간입니다.'}]}),e));
 assert.deepEqual(safeEvidence('매주 월요일에는 휴무입니다. 입장료는 1000원입니다.'),[]);
});
