import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {experienceEditorial,classEditorial,uniqueClassEditorials,programmeWinter,experienceDirectoryEditorial} from '../lib/programmeEditorial.mjs';
import {experienceCity} from '../lib/experiences.mjs';
import {groupProgrammeSessions} from '../lib/programmeAvailability.mjs';
import {searchBounds,publicKeyword} from './research-experience-keywords.mjs';

const today='2026-11-15',read=name=>JSON.parse(fs.readFileSync('data/'+name+'.json','utf8'));
const venues=read('experience-venues').venues;
const experiences=['youth','science','rural'].flatMap(source=>read(source+'-experiences').records.map(row=>{const kind=source==='youth'?'family':source,address=row.address||venues[kind+'/'+row.id]?.address||'';return {...row,kind,address,city:experienceCity(address)||row.city};}));
const learning=read('learning-classes'),classes=[...learning.courses,...learning.archivedCourses];

test('monthly counts retain censored ranges and unknown values',()=>{
 assert.deepEqual(searchBounds('< 10'),{min:0,max:9});
 assert.deepEqual(searchBounds(80),{min:80,max:80});
 const limited=publicKeyword({relKeyword:'예시',monthlyPcQcCnt:'< 10',monthlyMobileQcCnt:10,compIdx:'높음'});
 assert.equal(limited.total,null);assert.equal(limited.totalMin,10);assert.equal(limited.totalMax,19);
 assert.equal(publicKeyword({relKeyword:'미제공'}).total,null);
 const research=read('experience-keyword-research-20261115');
 assert.equal(research.exact.length,250);assert(research.exact.every(row=>row.keyword&&!row.unavailable));
 assert.match(research.competitionDefinition,/not organic/);
 assert(!/X-API-KEY|X-Signature|credentials|customerId|secret/i.test(JSON.stringify(research)));
});

test('source activity relevance outranks a higher-volume incidental keyword',()=>{
 const mentoring=experienceEditorial(experiences.find(item=>item.id==='384587'),today);
 assert.equal(mentoring.topicId,'mentoring');assert(!mentoring.title.includes('과학'));
 const pottery=experienceEditorial({title:'흙놀이',area:'경기',city:'이천시',kind:'rural',programs:['도예 체험'],content:['방학캠프와 관련 없는 마을 자료']},today);
 assert.equal(pottery.topicId,'pottery');assert.match(pottery.title,/경기도 이천시.*도예/);assert(!pottery.title.includes('겨울방학캠프'));
 const one=classEditorial({title:'문화강좌',description:'홈패션',area:'경남',address:'경상남도 고성군',start:'2026-12-01',end:'2026-12-31',tuition:0,institution:'문화센터',audience:'성인',venue:'문화센터'},today);
 assert.match(one.title,/홈패션 강좌/);assert.match(one.lead,/수강료 0원/);assert(!one.lead.includes('무료'));assert(!one.title.includes('원데이'));
});

test('winter-break labels need an explicit programme and a current matching period',()=>{
 const item=experiences.find(item=>item.id==='384687'),editorial=experienceEditorial(item,today);
 assert(editorial.winter.named);assert.match(editorial.title,/겨울방학 프로그램.*손뜨개·웹툰/);assert(!editorial.title.includes('초등'));
 for(const override of [{end:'2026-02-10'},{active:false},{title:'겨울철 자동차 관리',content:[],start:'2026-11-17',end:'2026-11-17'},{title:'여름방학 특강',content:[],start:'2027-07-01',end:'2027-08-10'}])assert(!programmeWinter({...item,...override},today).named);
 const annual={title:'문화강좌',start:'2026-01-01',end:'2026-12-31',audience:'성인',tuition:0};
 assert(!programmeWinter(annual,today).planning);assert(!classEditorial(annual,today).paragraphs.some(line=>line.includes('겨울방학')));
 assert(!experienceDirectoryEditorial({region:'경기',records:experiences.filter(item=>item.area==='경기'),today}).title.includes('겨울방학'));
});

test('one-day wording only describes a matching single-day source schedule',()=>{
 const base={title:'도예 수업',area:'경기',address:'경기도 이천시',start:'2026-12-01',end:'2026-12-01',tuition:5000};
 assert.match(classEditorial(base,today).title,/원데이 클래스/);
 assert(!classEditorial({...base,end:'2026-12-30'},today).title.includes('원데이'));
});

test('every stored article receives readable, distinct source-based search copy',()=>{
 const pages=['family','science','rural'].flatMap(kind=>groupProgrammeSessions(experiences.filter(item=>item.kind===kind),kind));
 const experienceCopy=pages.map(item=>experienceEditorial(item,today));
 const classCopy=[...uniqueClassEditorials(classes,today).values()];
 assert.ok(pages.length>0&&classes.length>0);
 assert.equal(pages.reduce((n,page)=>n+page.aliases.length,0),experiences.length);
 assert.equal(classCopy.length,new Set(classes.map(item=>item.id)).size);
 for(const copy of [...experienceCopy,...classCopy]){
  assert(copy.title&&copy.introduction&&copy.description);assert(copy.description.length<=150);
  assert(!/undefined|NaN|\[object Object\]|방법를/.test([copy.title,copy.description,copy.introduction].join(' ')),copy.title);
  assert(!/^[?？\ufffd]/u.test(copy.title));
 }
 assert.equal(new Set(experienceCopy.map(copy=>copy.title)).size,experienceCopy.length);
 assert.equal(new Set(classCopy.map(copy=>copy.title)).size,classCopy.length);
 const originals=JSON.stringify(experiences);experiences.forEach(item=>experienceEditorial(item,today));assert.equal(JSON.stringify(experiences),originals);
});
