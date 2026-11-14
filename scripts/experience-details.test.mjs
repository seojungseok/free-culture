import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeYouth,mergeYouthDetail,experienceParagraphs} from '../lib/experiences.mjs';
import {enrichYouthDetails} from './enrichExperienceDetails.mjs';
import {matchExperienceVenue} from '../lib/experienceVenue.mjs';
import {parseCentralScience} from './lib/sciencePrograms.mjs';
const now=()=>new Date('2026-11-14T12:00:00Z');
const raw={key1:'123',pgmNm:'가족 만들기',sdate:'2026/11/21',edate:'2026/11/21',sido:'서울특별시',sigungu:'종로구',target:'20',price:'무료'};
test('detail API supplies full readable content without scripts, private contact names or invented ages',()=>{
 const record=normalizeYouth(raw),body='<p>대상: 초등학생</p><p>'+('만들기 활동을 안내합니다. '.repeat(100))+'</p><script>malicious()</script>';
 const result=mergeYouthDetail(record,{...raw,addr:'서울특별시 종로구',tel:'02-123-4567',managernm:'개인 이름',info1:body,info2:'도구를 살펴보고 작품을 만듭니다.'},now().toISOString());
 assert(result.content.join(' ').length>650);assert.equal(result.audience,'초등학생');assert.equal(result.address,'서울특별시 종로구');assert.equal(result.phone,'02-123-4567');assert(!JSON.stringify(result).includes('malicious'));assert(!JSON.stringify(result).includes('개인 이름'));
 assert.throws(()=>mergeYouthDetail(record,{...raw,key1:'999'},now().toISOString()),/identity/);
 const visit=mergeYouthDetail({...record,city:'종로구'},{...raw,addr:'경기도 양주시 광적면 체험로 1',info1:'현장 체험 안내',info2:'체험 내용'},now().toISOString());assert.equal(visit.area,'경기');assert.equal(visit.city,'양주시');
 assert.deepEqual(experienceParagraphs('<p>첫 안내</p><p>다음 안내<br>준비물</p>'),['첫 안내','다음 안내','준비물']);
});
test('detail collection is bounded, preserves old content on provider failure and skips fresh or ended programmes',async()=>{
 const first=normalizeYouth(raw),cached={...normalizeYouth({...raw,key1:'124'}),detailCheckedAt:now().toISOString()},ended={...normalizeYouth({...raw,key1:'125'}),end:'2026-11-01'};
 const store={records:[first,cached,ended]};let calls=0;
 const result=await enrichYouthDetails(store,{max:1,now,pause:async()=>{},fetchDetail:async()=>{calls++;throw new Error('https://example.invalid/?serviceKey=synthetic-secret');}});
 assert.equal(calls,1);assert.equal(result.failures,1);assert.equal(first.detailCheckedAt,undefined);assert.equal(cached.detailCheckedAt,now().toISOString());assert(!JSON.stringify(result).includes('synthetic-secret'));
});
test('the same village name in another region, at another location or in an ambiguous match cannot supply photos',()=>{
 const record={title:'소리산마을',area:'경기',address:'경기도 양평군 단월면 물레골길 6',latitude:37.5,longitude:127.5};
 const venue={title:'소리산마을',area:'경기',addr:'경기도 양평군 단월면 물레골길 6',mapy:'37.5',mapx:'127.5'};
 assert.equal(matchExperienceVenue(record,[venue]),venue);assert.equal(matchExperienceVenue(record,[{...venue,area:'강원'}]),undefined);assert.equal(matchExperienceVenue(record,[{...venue,addr:'경기도 다른군 다른길',mapy:'38.5'}]),undefined);assert.equal(matchExperienceVenue(record,[venue,{...venue}]),undefined);
});
test('science programme identity is stable when a table is reordered and different programmes cannot reuse a URL',()=>{
 const html=(number,title)=>`<table><thead><tr><th>교육대상</th></tr></thead><tbody><tr><td>${number}</td><td>교육예정</td><td>${title}</td><td>초등학생</td><td>2026. 11. 21.</td><td>2026. 11. 20.</td><td>예약 안내</td></tr></tbody></table>`;
 const opts={url:'https://www.science.go.kr/mps/1092/allEduPrograms.do',now:now().toISOString()};
 assert.equal(parseCentralScience(html('1','체험 A'),opts)[0].id,parseCentralScience(html('8','체험 A'),opts)[0].id);
 assert.notEqual(parseCentralScience(html('1','체험 A'),opts)[0].id,parseCentralScience(html('1','체험 B'),opts)[0].id);
});
test('published detail data is backed by complete API checks and compressed local photos exist',()=>{
 const data=JSON.parse(fs.readFileSync('data/youth-experiences.json','utf8'));assert(data.detailRefresh);assert(data.records.some(record=>record.detailCheckedAt));assert(data.records.filter(record=>record.detailCheckedAt).every(record=>record.address&&(record.content.length||record.activities.length)));
 const media=JSON.parse(fs.readFileSync('data/experience-media.json','utf8'));for(const item of Object.values(media.images).filter(item=>item.src)){assert(item.width<=900&&item.height<=900);assert(fs.existsSync('public'+item.src));assert(!item.source.includes('serviceKey='));}
});
