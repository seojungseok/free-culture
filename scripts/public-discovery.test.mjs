import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {collectLearning} from './collectLearning.mjs';
import {normalizeLearningClass,registrationState,isWeekendClass,isFamilyClass,dateOnly} from '../lib/learning.mjs';
import {normalizeAccessible} from '../lib/accessible.mjs';
const row={lctreNm:'가족 도자기 체험',lctreCo:'생활문화 체험',edcStartDay:'2026-12-01',edcEndDay:'2026-12-31',edcPlace:'문화센터',operInstitutionNm:'공공 교육원',edcRdnmadr:'경기도 수원시',lctreCost:'0',referenceDate:'2026-11-01',rceptStartDate:'2026-11-01',rceptEndDate:'2026-11-20',operDay:'토요일',edcTrgetType:'초1-3',homepageUrl:'https://public.example/notice'};
const now=new Date('2026-11-14T12:00:00Z');
test('unknown prices, unsafe links, invalid dates and weekday-only classes remain distinct',()=>{
 const course=normalizeLearningClass(row);
 assert.equal(course.tuition,0);assert.equal(course.area,'경기');assert(isWeekendClass(course));assert(isFamilyClass(course));
 assert.equal(registrationState(course,'2026-11-14'),'접수기간 내');assert.equal(registrationState(course,'2026-11-21'),'접수기간 지남');assert.equal(registrationState(course,'2027-01-01'),'교육 종료');
 assert.equal(normalizeLearningClass({...row,lctreCost:'',homepageUrl:'javascript:alert(1)'}).tuition,null);
 assert.equal(normalizeLearningClass({...row,homepageUrl:'https://user:pass@public.example/'}).homepage,'');
 assert(!isWeekendClass({...course,weekdays:'평일'}));assert(!isWeekendClass({...course,weekdays:'월 + 금'}));
 assert.equal(dateOnly('2026-02-30'),'');assert.equal(normalizeLearningClass({...row,edcStartDay:'2026-12-32'}),null);
});
test('full pagination finishes before a new learning snapshot can replace the old one',async()=>{
 let attempts=0;
 const makeBody=(items,total=2)=>Response.json({header:{resultCode:'00'},body:{totalCount:total,items:{item:items}}});
 const result=await collectLearning({key:'synthetic',now,pause:async()=>{},fetchImpl:async()=>{attempts++;return makeBody([{...row,lctreNm:'가족 도자기 체험 '+attempts}]);}});
 assert.equal(attempts,2);assert.equal(result.courses.length,2);assert.equal(result.refresh.complete,true);
 attempts=0;
 await assert.rejects(collectLearning({key:'synthetic',now,pause:async()=>{},fetchImpl:async()=>{attempts++;return attempts===1?makeBody([row]):new Response('',{status:503});}}),/HTTP 503/);
 assert.equal(attempts,2);
});
test('provider and network failures never expose keys or request URLs',async()=>{
 await assert.rejects(collectLearning({key:'synthetic',now,fetchImpl:async()=>{throw new Error('https://private.invalid/?serviceKey=synthetic');}}),error=>!error.message.includes('synthetic')&&!error.message.includes('https://'));
 await assert.rejects(collectLearning({key:'synthetic',now,fetchImpl:async()=>Response.json({header:{resultCode:'30'}})}),/승인/);
});
test('accessibility restrictions survive and equipment rental never becomes an entry claim',()=>{
 const place=normalizeAccessible({contentid:'123',title:'예시 공원',addr1:'서울특별시 종로구',contenttypeid:'12'},{route:'경사로가 있으나 모래로 된 길임',wheelchair:'대여 가능',restroom:'장애인 화장실 없음'},now.toISOString());
 assert.match(place.facts.route,/모래/);assert.match(place.facts.restroom,/없음/);assert.equal(place.facts.wheelchair,'대여 가능');assert(!('wheelchairEntry' in place));
});
test('saved learning records have no ended courses or invented zero prices; accessibility spans 17 regions',()=>{
 const learning=JSON.parse(fs.readFileSync('data/learning-classes.json','utf8'));
 assert(learning.refresh.complete);assert(learning.refresh.totalRows>=learning.courses.length);assert(learning.refresh.calls<=100);
 for(const course of learning.courses){assert(course.end>=learning.refresh.checkedAt.slice(0,10));assert(course.referenceDate);assert(course.tuition===null||Number.isFinite(course.tuition));}
 const accessible=JSON.parse(fs.readFileSync('data/accessible-travel.json','utf8'));
 assert.equal(new Set(Object.values(accessible.places).map(place=>place.area)).size,17);
 assert(Object.values(accessible.places).every(place=>Object.keys(place.facts).length&&place.source.startsWith('https://www.data.go.kr/')));
});
