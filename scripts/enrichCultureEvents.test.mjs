import test from 'node:test';import assert from 'node:assert/strict';
import {extractEventSource,publicSourceUrl,fetchSourcePage,cultureDetail} from './lib/cultureSource.mjs';import {enrichCultureEvents} from './enrichCultureEvents.mjs';import {QuotaError,createBudget} from './lib/tourClient.mjs';
const event={id:'1',title:'[서울] 체험 공연 <사칠>',startDate:'20261003',endDate:'20261010',contents:'',officialUrl:'https://example.org/events/1'};
const page=body=>`<html><head><title>체험 공연 사칠</title></head><body><main>${body}</main></body></html>`;
test('explicit age, runtime and application conditions come from the matched event only',()=>{const r=extractEventSource(page('<dl><dt>관람연령</dt><dd>14세 이상</dd><dt>소요시간</dt><dd>100분</dd><dt>신청방법</dt><dd>사전 온라인 신청</dd></dl>'),event,event.officialUrl);assert.equal(r.status,'verified');assert.deepEqual(r.facts,[{label:'관람연령',value:'14세 이상'},{label:'소요시간',value:'100분'},{label:'신청방법',value:'사전 온라인 신청'}]);});
test('angle-bracket names retain their distinguishing title and do not match another play',()=>{const r=extractEventSource('<title>체험 공연 다른작품</title><main>관람연령: 14세 이상</main>',event,event.officialUrl);assert.equal(r.status,'identity-unconfirmed');});
test('institution homepages cannot satisfy a named exhibition',()=>{const r=extractEventSource('<title>대전 서예진흥원</title><meta name="description" content="기관 소개">',{...event,title:'대전 서예진흥원 <청년작가전>'},event.officialUrl);assert.equal(r.status,'identity-unconfirmed');});
test('empty labels and general booking promotion cannot count as descriptions',()=>{const r=extractEventSource('<title>체험 공연 사칠</title><meta name="description" content="가격, 일정 상세 정보 확인하고 예매하세요"><main><p>프로그램 명</p></main>',event,event.officialUrl);assert.equal(r.status,'no-readable-detail');assert.deepEqual(r.facts,[]);});
test('a different performance edition is held when structured dates disagree',()=>{const html=page('')+'<script type="application/ld+json">{"@type":"TheaterEvent","name":"체험 공연 사칠","startDate":"2025-10-03"}</script>';assert.equal(extractEventSource(html,event,event.officialUrl).status,'schedule-conflict');});
test('table labels and literal Korean programme names remain intact',()=>{const r=extractEventSource(page('<table><tr><th><div>프로그램</div><div>명</div></th><td>체험 <기이한 미래식탁> 소책자 만들기</td></tr><tr><th>접수방법</th><td>현장 접수</td></tr></table>'),event,event.officialUrl);assert.equal(r.facts[0].label,'프로그램명');assert.match(r.facts[0].value,/기이한 미래식탁/);assert.equal(r.facts[1].value,'현장 접수');});
test('ended official table dates cannot provide current participation conditions',()=>{const r=extractEventSource(page('<table><tr><th>교육기간</th><td>2025-04-17 ~ 2026-05-22</td></tr><tr><th>접수방법</th><td>현장 접수</td></tr></table>'),event,event.officialUrl);assert.equal(r.status,'schedule-conflict');assert.deepEqual(r.facts,[]);});
test('a date outside the main programme body still prevents expired conditions',()=>{const html='<title>체험 공연 사칠</title><table><tr><th>교육기간</th><td>2025-04-17 ~ 2026-05-22</td></tr></table><main>신청방법: 현장 접수</main>';assert.equal(extractEventSource(html,event,event.officialUrl).status,'schedule-conflict');});
test('concrete activity rows survive while generic programme navigation is withheld',()=>{const r=extractEventSource(page('<table><tr><td>18:40~19:00(20분)</td><td>장승 동산 민속 산책</td><td>옥외 전시장</td></tr></table><p>프로그램 이용안내</p><p>장르에 구애받지 않고</p>'),event,event.officialUrl);assert.deepEqual(r.facts,[{label:'18:40~19:00(20분) 프로그램',value:'장승 동산 민속 산책'}]);});
test('source URLs cannot carry credentials or reach private networks through redirects',async()=>{for(const url of ['http://127.0.0.1/a','http://10.0.0.2/a','https://user:pass@example.org/','javascript:alert(1)','https://example.org/?serviceKey=secret'])assert.equal(publicSourceUrl(url),'');await assert.rejects(fetchSourcePage('https://example.org/',{resolve:async()=>[{address:'1.1.1.1'}],fetcher:async()=>new Response('',{status:302,headers:{location:'http://127.0.0.1/'}})}),/unsafe-source/);});
test('daily quota is distinct from authentication failure and stops queued requests',async()=>{const b=createBudget(5);const options={key:'test',throttle:async()=>{},fetcher:async()=>new Response('<returnReasonCode>22</returnReasonCode>',{status:429})};await assert.rejects(cultureDetail('1',b,options),e=>e instanceof QuotaError&&e.reason==='provider'&&e.code==='22');assert.equal(b.used,1);await assert.rejects(cultureDetail('2',b,options));assert.equal(b.used,1);await assert.rejects(cultureDetail('1',createBudget(5),{...options,fetcher:async()=>new Response('<response><header><resultCode>30</resultCode></header></response>')}),e=>!(e instanceof QuotaError));});
test('short rate limits respect retry-after and each attempt consumes the budget',async()=>{let calls=0;const waits=[],b=createBudget(3);const r=await cultureDetail('1',b,{key:'test',throttle:async()=>{},pause:async(ms)=>waits.push(ms),fetcher:async()=>++calls===1?new Response('<returnReasonCode>23</returnReasonCode>',{status:429,headers:{'retry-after':'2'}}):new Response('<response><header><resultCode>00</resultCode></header><body><items><item><seq>1</seq><contents1>실제 설명</contents1></item></items></body></response>')});assert.equal(r.contents1,'실제 설명');assert.equal(b.used,2);assert.deepEqual(waits,[2000]);});
test('successful empty responses preserve original prose and quota never refreshes its timestamp',async()=>{const events=[{...event,contents:''},{...event,id:'2',contents:''}],store={events:{'2':{providerCheckedAt:'2000-01-01'}}};const r=await enrichCultureEvents({events,store,max:2,pageMax:0,workers:1,detailFetcher:async(id,b)=>{b.used++;if(id==='2')throw new QuotaError('provider');return{seq:id,contents1:'',url:event.officialUrl};},pause:async()=>{}});assert.equal(r.exitCode,75);assert.ok(store.events['1'].providerCheckedAt);assert.equal(store.events['2'].providerCheckedAt,'2000-01-01');assert.equal(events[0].contents,'');});

test('an exact official detail heading supplies facts even with a generic site title',()=>{
  const html='<title>문화포털</title><main><div class="wrap-info"><p class="view-tit">체험 공연 사칠</p><dl><dt>기간</dt><dd>2026-10-03 ~ 2026-10-10</dd><dt>공연시간</dt><dd>오후 7:30</dd><dt>소요시간</dt><dd>1시간 20분</dd></dl></div></main>';
  const result=extractEventSource(html,event,event.officialUrl);
  assert.equal(result.status,'verified');assert.deepEqual(result.facts,[{label:'공연시간',value:'오후 7:30'},{label:'소요시간',value:'1시간 20분'}]);
});
test('a matching card title in an event list cannot establish detail identity',()=>{
  const result=extractEventSource('<title>공연 목록</title><main><article><h3>체험 공연 사칠</h3><p>관람연령: 14세 이상</p></article></main>',event,event.officialUrl);
  assert.equal(result.status,'identity-unconfirmed');
});
test('a wrong single-day edition in a definition list is rejected',()=>{
  const result=extractEventSource(page('<dl><dt>기간</dt><dd>2025-10-03</dd><dt>관람연령</dt><dd>14세 이상</dd></dl>'),event,event.officialUrl);
  assert.equal(result.status,'schedule-conflict');
});
test('a duration labelled time cannot replace the actual performance clock',()=>{
  const result=extractEventSource(page('<dl><dt>시간</dt><dd>80분 (인터미션 15분 포함)</dd></dl>'),event,event.officialUrl);
  assert.deepEqual(result.facts,[{label:'소요시간',value:'80분 (인터미션 15분 포함)'}]);
});
test('an official public per-ID fallback preserves provenance and does not redate unchanged content',async()=>{
  const current={...event,startDate:'20991003',endDate:'20991010',contents:'이미 확보한 소개도 보존합니다.'};
  const store={events:{}};let calls=0;
  const pageFetcher=async url=>{calls++;return{url,html:url.includes('culture.go.kr')?'<title>문화포털</title><main><p class="view-tit">체험 공연 사칠</p><dl><dt>공연시간</dt><dd>19:30</dd><dt>관람연령</dt><dd>14세 이상</dd></dl></main>':'<title>기관 소개</title>'};};
  const options={events:[current],store,max:0,pageMax:1,workers:1,pageFetcher,pause:async()=>{},now:()=>new Date('2026-11-16T12:00:00Z')};
  const result=await enrichCultureEvents(options);const detail=store.events['1'].sourceDetail;
  assert.equal(result.requests,0);assert.equal(result.portalDetails,1);assert.equal(calls,2);
  assert(detail.facts.every(f=>f.sourceUrl.includes('pblprfrSn=1')));assert.equal(current.contents,'이미 확보한 소개도 보존합니다.');
  const modified=detail.contentUpdatedAt;store.events['1'].parserVersion=0;
  await enrichCultureEvents({...options,now:()=>new Date('2026-11-17T12:00:00Z')});
  assert.equal(store.events['1'].sourceDetail.contentUpdatedAt,modified);
  assert.notEqual(store.events['1'].sourceDetail.checkedAt,detail.checkedAt);
});
