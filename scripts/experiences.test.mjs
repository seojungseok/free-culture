import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeRural,normalizeYouth} from '../lib/experiences.mjs';
import {scienceDates,parseCentralScience,parseIncheonScience} from './lib/sciencePrograms.mjs';
import {buildDataFreshness} from '../lib/data-freshness.mjs';
test('a youth participant count cannot become an age restriction',()=>{
 const row={key1:'123',pgmNm:'가족 만들기',sdate:'2026/11/21',edate:'2026/11/21',target:'20',price:'무료',atContent:'활동 내용'};
 assert.equal(normalizeYouth(row).audience,'공식 안내에서 연령·학년 확인');
 assert.equal(normalizeYouth({...row,atContent:'대상: 초등학생 10명\n장소: 공공 체험관'}).audience,'초등학생 10명');
 assert.equal(normalizeYouth({...row,price:'무료(일부 대상만)'}).free,false);
});
test('rural programs retain source dates and do not fabricate prices, seasons or ages',()=>{
 const village=normalizeRural({exprnVilageNm:'체험마을',rdnmadr:'경기도 가평군',exprnCn:'사과따기+두부만들기',referenceDate:'2026-09-22',homepageUrl:'javascript:bad()'});
 assert.deepEqual(village.programs,['사과따기','두부만들기']);assert.equal(village.homepage,'');assert(!('price' in village));assert(!('age' in village));assert(!('season' in village));assert.equal(village.referenceDate,'2026-09-22');
});
test('science dates separate time ranges from actual registration end dates',()=>{
 assert.deepEqual(scienceDates('2026. 11. 6. (금) 10:00 - 11. 20. (금) 17:00',2026),['2026-11-06','2026-11-20']);
 assert.deepEqual(scienceDates('11월 7일~11월 28일(월 4차시/토)',2026),['2026-11-07','2026-11-28']);
 const html='<table><thead><tr><th>교육대상</th></tr></thead><tbody><tr><td>1</td><td>교육예정</td><td>자연 체험</td><td>초등학생</td><td>2026. 11. 21.(토)</td><td>2026. 11. 6. 10:00 - 11. 20. 17:00</td><td><a href="https://rsvn.science.go.kr/nsm/edcarsvn/edcarsvnDetail?edcPrgmid=1">예약</a></td></tr></tbody></table>';
 const result=parseCentralScience(html,{url:'https://www.science.go.kr/mps/1092/allEduPrograms.do',now:'2026-11-14T00:00:00Z'});
 assert.equal(result[0].registrationEnd,'2026-11-20');assert.equal(result[0].end,'2026-11-21');assert(result[0].officialUrl.includes('edcPrgmid=1'));
 assert.throws(()=>parseIncheonScience('<html/>',{url:'https://aicei.ice.go.kr/'}));
});
test('current source records support the three distinct new activities',()=>{
 const rural=JSON.parse(fs.readFileSync('data/rural-experiences.json','utf8')),youth=JSON.parse(fs.readFileSync('data/youth-experiences.json','utf8')),science=JSON.parse(fs.readFileSync('data/science-experiences.json','utf8'));
 assert(rural.records.length>0);assert(youth.records.length>0);assert(science.records.length>0);
 assert(rural.records.every(record=>record.programs.length&&record.referenceDate));
 assert(youth.records.every(record=>record.end>=youth.generatedAt.slice(0,10)));
 assert(science.records.every(record=>record.source.startsWith('https://www.science.go.kr/')||record.source.startsWith('https://aicei.ice.go.kr/')));
});
test('an empty upcoming program season with a completed source check is valid, not a missing collection',()=>{
 const snapshot={'youth-experiences.json':{generatedAt:'2026-11-14T00:00:00Z',refresh:{complete:true},records:[]}};
 assert.equal(buildDataFreshness(snapshot,new Date('2026-11-14T01:00:00Z')).sources.find(source=>source.id==='youth-experiences').status,'fresh');
 snapshot['youth-experiences.json'].refresh.complete=false;
 assert.equal(buildDataFreshness(snapshot,new Date('2026-11-14T01:00:00Z')).sources.find(source=>source.id==='youth-experiences').status,'missing');
});
