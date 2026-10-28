import test from 'node:test';
import assert from 'node:assert/strict';
import { remainingPublications, preparePublication, publicationSlug, availableTargets, bestPortfolio } from './lib/winter-publish.mjs';
import { inspectOfficialPlace } from './lib/winter-official-evidence.mjs';
import { isPublicWinterCourse } from '../lib/winter-course-validation.mjs';
import fs from 'node:fs';

const now=new Date('2026-10-28T13:30:00Z');
const draft={id:'id',slug:'id',sourceCourseId:'seoul-test-day-one',status:'draft',area:'서울',duration:'당일',stops:[{placeId:'1',name:'첫번째 박물관',addr:'서울',mapx:'126.9',mapy:'37.5',day:1},{placeId:'2',name:'두번째 미술관',addr:'서울',mapx:'126.91',mapy:'37.51',day:1}]};
const record=name=>({name,eligible:true,verifiedAt:'2026-10-20T00:00:00Z',sourceUrl:'https://museum.seoul.go.kr/exhibit',feature:`${name}은 지역 역사와 문화를 소개하는 곳입니다.`,winterReason:'겨울에는 전시 안내를 확인하고 방문 순서를 조절해 보세요.'});
const registry={version:1,places:{'1':record('첫번째 박물관'),'2':record('두번째 미술관')}};

test('Korean day budgets count only published items, not held or drafts',()=>{
 const rows=[{status:'published',duration:'당일',publishedAt:'2026-10-27T15:00:00Z'},{status:'draft',duration:'당일',createdAt:now.toISOString()},{status:'held',duration:'1박2일',createdAt:now.toISOString()},{status:'published',duration:'1박2일',publishedAt:'2026-10-27T14:59:59Z'}];
 assert.deepEqual(remainingPublications(rows,now),{'당일':2,'1박2일':2});
});
test('an unavailable duration does not prevent another duration from publishing',()=>{
 assert.deepEqual(availableTargets({'당일':3,'1박2일':2},[{duration:'당일'},{duration:'당일'}]),{'당일':2,'1박2일':0});
 assert.deepEqual(availableTargets({'당일':0,'1박2일':2},[{duration:'1박2일'}]),{'당일':0,'1박2일':1});
});
test('overlapping candidate does not block the best partial day and overnight portfolio',()=>{
 const make=(id,duration,ids)=>({sourceCourseId:id,duration,stops:ids.map(placeId=>({placeId}))});
 const pool=[make('overlap','당일',['1','2','3']),make('day2','당일',['5','6','7']),make('day3','당일',['8','9','10']),make('overnight','1박2일',['1','2','3','4'])];
 const selected=bestPortfolio(pool,{'당일':3,'1박2일':2});
 assert.deepEqual(new Set(selected.map(c=>c.sourceCourseId)),new Set(['day2','day3','overnight']));
 assert.deepEqual(availableTargets({'당일':3,'1박2일':2},selected),{'당일':2,'1박2일':1});
});
test('only source-verified drafts can publish and status is consumable by the site',()=>{
 const result=preparePublication(draft,registry,now);
 assert.ok(result);assert.equal(result.status,'published');assert.ok(isPublicWinterCourse(result,now));assert.equal(result.sources.length,2);
 assert.equal(preparePublication({...draft,status:'held'},registry,now),null);
 assert.equal(preparePublication(draft,{version:1,places:{'1':registry.places['1']}},now),null);
 assert.equal(preparePublication(draft,{version:1,places:{...registry.places,'2':{...registry.places['2'],verifiedAt:'2025-01-01'}}},now),null);
 assert.equal(preparePublication(draft,{version:1,places:{...registry.places,'2':{...registry.places['2'],feature:'무료 관람이 가능합니다.'}}},now),null);
});
test('course slugs are deterministic and show region and period',()=>{
 assert.equal(publicationSlug('seoul-family-day-ervk2g','당일'),'seoul-bukchon-winter-daytrip');
 assert.equal(publicationSlug('busan-nature-1n2d-ilhzk2','1박2일'),'busan-winter-1n2d-course');
 assert.equal(publicationSlug('incheon-new-day-abc','당일'),publicationSlug('incheon-new-day-abc','당일'));
 assert.match(publicationSlug('incheon-new-day-abc','당일'),/^incheon-winter-daytrip-/);
});
test('the four researched opening courses preserve route context and official sources',()=>{
 const data=JSON.parse(fs.readFileSync('data/winter-courses.json','utf8'));
 const ids=['seoul-family-day-ervk2g','busan-family-day-mnyk49','seoul-heritage-1n2d-cfrk65','busan-nature-1n2d-ilhzk2'];
 for(const id of ids){
   const course=data.courses.find(c=>c.sourceCourseId===id);
   assert.ok(course && isPublicWinterCourse(course));
   assert.equal(course.slug,publicationSlug(id,course.duration));
   assert.equal(course.sources.length,course.stops.length);
   const text=course.sections.flatMap(s=>s.paragraphs).join(' ');
   assert.doesNotMatch(text,/(?:누리마루 APEC하우스|부산타워\(다이아몬드타워\)|케이블카)을/);
   assert.match(text,/공식 안내/);
   if(course.duration==='1박2일')assert.match(text,/숙소 주변 정류장/);
 }
 const seoul=data.courses.find(c=>c.sourceCourseId==='seoul-heritage-1n2d-cfrk65');
 assert.match(seoul.sections.flatMap(s=>s.paragraphs).join(' '),/같은 경희궁 권역/);
});
test('official verification requires approved host, venue identity and matching source',async()=>{
 const place={id:'12',title:'첫번째 박물관'}, detail={homepage:'https://museum.seoul.go.kr/exhibit',overview:'첫번째 박물관은 지역 역사와 문화를 소개하는 곳입니다.'};
 const html=`<html><p>${detail.overview}</p></html>`;
 const ok=async()=>new Response(html,{status:200,headers:{'content-type':'text/html'}});
 assert.ok(await inspectOfficialPlace(place,detail,ok,now));
 assert.equal(await inspectOfficialPlace(place,{...detail,homepage:'https://example.com/exhibit'},ok,now),null);
 assert.equal(await inspectOfficialPlace(place,detail,async()=>new Response('다른 시설',{status:200,headers:{'content-type':'text/html'}}),now),null);
 assert.equal(await inspectOfficialPlace(place,detail,async()=>new Response(`${html} 영업 종료`,{status:200,headers:{'content-type':'text/html'}}),now),null);
 assert.equal(await inspectOfficialPlace(place,detail,async()=>new Response('',{status:302,headers:{location:'https://evil.example/exhibit'}}),now),null);
 const job='첫번째 박물관은 기간제 직원 채용과 면접을 실시합니다.';
 assert.equal(await inspectOfficialPlace(place,{...detail,overview:job},async()=>new Response(`<p>${job}</p>`,{status:200,headers:{'content-type':'text/html'}}),now),null);
 const titleOnly=async()=>new Response('<title>첫번째 박물관 | 서울시</title><p>첫번째 박물관</p>',{status:200,headers:{'content-type':'text/html'}});
 assert.equal((await inspectOfficialPlace(place,{...detail,overview:''},titleOnly,now))?.verificationMethod,'official-title-identity-only');
 const navigationOnly=async()=>new Response('<title>여행 목록</title><nav>첫번째 박물관</nav>',{status:200,headers:{'content-type':'text/html'}});
 assert.equal(await inspectOfficialPlace(place,{...detail,overview:''},navigationOnly,now),null);
});
