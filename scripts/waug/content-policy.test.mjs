import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TICKET_POLICY,guaranteeActive,bookingLabel} from '../../lib/ticket-guarantee.mjs';
import {VISIT_TOPICS,EDITORIAL_REVISION,contentErrors,ticketComparisonFreshness,recheckGuarantee,publicationGuarantee,recheckBeforePublish} from './content-policy.mjs';
import {publicArticles} from './core.mjs';
const now=new Date('2026-09-11T08:00:00Z');
function product(){return {id:'AbC',productId:'123',affiliateUrl:'https://www.waug.com/r/AbC',detailUrl:'https://www.waug.com/ko/activities/123',priceGuaranteeReview:{status:'approved',productId:'123',affiliateUrl:'https://www.waug.com/r/AbC',sourceUrl:'https://www.waug.com/ko/activities/123',productBadgeConfirmed:true,evidenceText:'해당 상품 최저가보장',conditions:'동일한 방문일과 옵션에 한함',checkedAt:now.toISOString()}};}
const response=body=>async()=>({ok:true,status:200,text:async()=>body});
const html='<h1>상품</h1><p>해당 상품 최저가보장</p><p>동일한 방문일과 옵션에 한함</p>';
test('product-specific review plus a live matching badge and conditions enables a bounded guarantee',async()=>{
 const p=product(),g=await recheckGuarantee(p,{now,fetcher:response(html)});
 assert.equal(g.status,'confirmed');assert.equal(guaranteeActive(g,p.affiliateUrl,+now),true);
 assert.equal(bookingLabel(g,p.affiliateUrl,+now),'이용권 가격·혜택 확인');
 assert.equal(guaranteeActive(g,p.affiliateUrl,+now+86400000),false);
 assert.equal(guaranteeActive(g,'https://www.waug.com/r/abc',+now),false);
 assert.equal(guaranteeActive({...g,checkedAt:'bad'},p.affiliateUrl,+now),false);
 assert.equal(guaranteeActive({...g,checkedAt:new Date(+now+1).toISOString()},p.affiliateUrl,+now),false);
});
test('missing review, global-only text, changed conditions, expired/future period and HTTP failure use normal booking',async()=>{
 for(const mutate of [p=>delete p.priceGuaranteeReview,p=>p.priceGuaranteeReview.productBadgeConfirmed=false,p=>p.priceGuaranteeReview.productId='999',p=>p.priceGuaranteeReview.endsAt=now.toISOString(),p=>p.priceGuaranteeReview.startsAt=new Date(+now+1).toISOString()]){const p=product();mutate(p);assert.equal((await recheckGuarantee(p,{now,fetcher:response(html)})).status,'unconfirmed');}
 for(const body of ['와그 최저가보장 정책','해당 상품 최저가보장 조건 변경'])assert.equal((await recheckGuarantee(product(),{now,fetcher:response(body)})).status,'unconfirmed');
 const g=await recheckGuarantee(product(),{now,fetcher:async()=>{throw Error('network unavailable');}});
 assert.equal(bookingLabel(g,product().affiliateUrl,+now),'이용권 가격·혜택 확인');
});
test('publication uses fresh article evidence and does not recheck legacy or future articles',async()=>{
 const p=product(),a={contentPolicyVersion:TICKET_POLICY,productIds:[p.id],status:'scheduled',scheduledAt:now.toISOString()};
 const legacy={...a,contentPolicyVersion:undefined},future={...a,scheduledAt:new Date(+now+86400000).toISOString()};let calls=0;
 await recheckBeforePublish({articles:[a,legacy,future]},[p],{now,fetcher:async()=>{calls++;return {ok:true,text:async()=>html};}});
 assert.equal(calls,1);assert.equal(legacy.priceGuaranteeChecks,undefined);assert.equal(future.priceGuaranteeChecks,undefined);
 assert.ok(publicationGuarantee(a,p,now));assert.equal(publicationGuarantee(a,p,new Date(+now+16*60000)),null);
});
test('new content requires complete evidenced visitor information and reviewed image rights; old articles retain old gates',()=>{
 assert.deepEqual(contentErrors({},now),[]);
 const a={contentPolicyVersion:TICKET_POLICY,placeName:'테스트',area:'서울',title:'서울 테스트 체험',description:'방문 안내',intro:'소개',sources:[],sections:[{kind:'visit'},{tickets:true}],faq:[{question:'질문',answer:'답'}],visitInfo:VISIT_TOPICS.map(topic=>({topic,status:'unknown',value:'자료에서 확인되지 않았습니다.'})),contentReview:{status:'approved',checkedAt:now.toISOString(),sourceCompared:true,uniqueCopy:true,searchIntent:'장소별 방문 준비',comparedSlugs:[],imageRightsChecked:true,noUnsupportedClaims:true},imageResearch:{unavailableReason:'확인된 본문 사진 없음'}};
 assert.deepEqual(contentErrors(a,now),[]);
 a.visitInfo[0].status='confirmed';assert.ok(contentErrors(a,now).some(x=>x.includes('추천 대상')));a.visitInfo[0].status='unknown';
 a.photos=Array.from({length:5},(_,i)=>({kind:'ai-generated',url:'image'+i,width:1200,height:630,role:'illustration',necessityNote:'보조 설명',generation:{nonDocumentaryReviewed:true,realPhotoSearchNote:'실제 자료 부족'}}));
 assert.ok(contentErrors(a,now).includes('AI 생성 이미지는 글당 최대 4장'));
 a.photos=[{url:'https://example.com/photo',width:1200,height:630,sourceUrl:'source',rightsUrl:'rights',usageConditions:'상업 허용',credit:'출처',checkedAt:now.toISOString(),commercialAllowed:true,placeMatched:true,provider:'waug',faceReview:{status:'no-identifiable-faces'}}];
 assert.ok(contentErrors(a,now).some(x=>x.includes('제휴 사용 허가')));
});
test('new drafts cannot omit their policy version and existing drafts cannot opt into it',()=>{
 const policy=JSON.parse(fs.readFileSync('data/waug/content-policy.json'));
 assert.deepEqual(contentErrors({slug:'future-new-place',createdAt:policy.effectiveAt},now),['신규 작성 기준 버전 필요']);
 assert.deepEqual(contentErrors({slug:policy.legacySlugs[0],contentPolicyVersion:TICKET_POLICY},now),['기존 작성 글에 신규 기준 소급 적용 금지']);
});
function revisedArticle(){
 const p=product();
 return {slug:'example-place',editorialRevision:EDITORIAL_REVISION,contentPolicyVersion:TICKET_POLICY,placeName:'테스트',area:'서울',title:'테스트 입장과 체험 안내',description:'입장과 체험을 안내합니다.',intro:'테스트에서는 전시를 관람하실 수 있어요.',sources:[{url:p.detailUrl,kind:'waug',checkedAt:now.toISOString()}],sections:[{heading:'이용권',paragraphs:['주간권으로 입장하실 수 있어요.'],tickets:true}],faq:[{question:'언제 입장하나요?',answer:'주간권은 오전 10시부터 입장하실 수 있어요.'}],ticketComparison:[{label:'주간권',entryTime:'10시',duration:'2시간',includes:'전시 관람',conditions:'지정일 입장',href:p.affiliateUrl,sourceUrls:[p.detailUrl],checkedAt:now.toISOString()}],productIds:[p.id],contentReview:{status:'approved',checkedAt:now.toISOString(),sourceCompared:true,uniqueCopy:true,searchIntent:'입장 준비',comparedSlugs:[],imageRightsChecked:true,noUnsupportedClaims:true},imageResearch:{unavailableReason:'기존 이미지 검수 대기'}};
}
test('revised content accepts only useful confirmed visit information without regional title or quantity quotas',()=>{
 const a=revisedArticle();assert.deepEqual(contentErrors(a,now,[product()]),[]);
 a.visitInfo=[{topic:'입장',status:'confirmed',value:'오전 10시 입장입니다.',sourceUrls:[product().detailUrl],checkedAt:now.toISOString()}];
 assert.deepEqual(contentErrors(a,now,[product()]),[]);
 a.visitInfo[0].status='unknown';assert.ok(contentErrors(a,now).some(e=>e.includes('방문 정보 근거')));
});
test('comparison fields, real registered sources and exact affiliate URL are required',()=>{
 for(const mutate of [a=>a.ticketComparison[0].duration=[],a=>a.ticketComparison[0].includes='',a=>a.ticketComparison[0].sourceUrls=['https://unregistered.example/source'],a=>a.ticketComparison[0].href='https://www.waug.com/r/abc',a=>a.ticketComparison[0].validUntil='bad',a=>a.ticketComparison[0].checkedAt='bad',a=>a.ticketComparison=[null],a=>a.ticketComparison={},a=>a.ticketComparison[0].sourceUrls='bad']) {
   const a=revisedArticle();mutate(a);assert.ok(contentErrors(a,now,[product()]).length);
 }
});
test('single-product comparison is optional while multiple products require a nonempty table',()=>{
 for(const comparison of [undefined,[]]) {
   const a=revisedArticle();a.ticketComparison=comparison;
   assert.deepEqual(contentErrors(a,now,[product()]),[]);
   a.productIds.push('second-product');
   assert.ok(contentErrors(a,now,[product()]).includes('확인된 이용권 비교표 필요'));
 }
 const a=revisedArticle();a.productIds.push('second-product');
 assert.deepEqual(contentErrors(a,now,[product()]),[]);
});
test('place title permits reordered tokens and omission of only the exact area token',()=>{
 const error='실제 장소 제목 및 본문과 일치하는 고유 검색 설명 확인';
 for(const [placeName,area,title] of [
   ['아르티스 동탄','경기','동탄 아르티스, 체험 안내'],
   ['서울 63 스카이 피크닉','서울','63 스카이 피크닉, 입장 안내'],
   ['  아르티스   동탄  ','경기','동탄 아르티스, 체험 안내']
 ]) {
   const a={...revisedArticle(),placeName,area,title};
   assert.deepEqual(contentErrors(a,now,[product()]),[]);
 }
 for(const [placeName,area,title] of [
   ['아르티스 동탄','경기','동탄 체험 안내'],
   ['아르티스 동탄','경기','아르티스 체험 안내'],
   ['서울 63 스카이 피크닉','서울','63 피크닉, 입장 안내'],
   ['서울숲 체험관','서울','숲 체험관 안내'],
   ['서울','서울','서울 나들이'],
   ['아르티스 동탄','경기',null]
 ]) {
   const a={...revisedArticle(),placeName,area,title};
   assert.ok(contentErrors(a,now,[product()]).includes(error));
 }
});
test('unknown comparison cells accept empty strings but retain types and essential values',()=>{
 const a=revisedArticle();
 for(const key of ['entryTime','duration','conditions'])a.ticketComparison[0][key]='';
 assert.deepEqual(contentErrors(a,now,[product()]),[]);
 for(const key of ['entryTime','duration','conditions'])for(const value of [undefined,null,[],123]) {
   const invalid=structuredClone(a);invalid.ticketComparison[0][key]=value;
   assert.ok(contentErrors(invalid,now,[product()]).includes('이용권 비교표 필드·실제 출처 확인'));
 }
 for(const key of ['label','includes'])for(const value of ['', ' ']) {
   const invalid=structuredClone(a);invalid.ticketComparison[0][key]=value;
   assert.ok(contentErrors(invalid,now,[product()]).includes('이용권 비교표 필드·실제 출처 확인'));
 }
});
test('section and FAQ expiry is optional and accepts only real YYYY-MM-DD dates',()=>{
 const a=revisedArticle();
 for(const key of ['sections','faq']) {
   a[key][0].validUntil='2026-09-30';
   assert.deepEqual(contentErrors(a,now,[product()]),[]);
   for(const value of ['',123,'2026-02-30','2026-09-31','2026-09-30T00:00:00Z']) {
     a[key][0].validUntil=value;
     assert.ok(contentErrors(a,now,[product()]).includes('섹션·FAQ validUntil 실제 유효일 확인'));
   }
   a[key][0].validUntil='2026-09-10';
   assert.deepEqual(contentErrors(a,now,[product()]),[]);
   delete a[key][0].validUntil;
 }
});
test('comparison due and stale boundaries use KST end of day and independent check age',()=>{
 const row=revisedArticle().ticketComparison[0];
 assert.equal(ticketComparisonFreshness(row,now),'fresh');
 assert.equal(ticketComparisonFreshness({...row,validUntil:'2026-09-12'},now),'due');
 assert.equal(ticketComparisonFreshness({...row,validUntil:'2026-09-10'},now),'stale');
 assert.equal(ticketComparisonFreshness({...row,validUntil:'2026-09-11'},new Date('2026-09-11T14:59:59.999Z')),'due');
 assert.equal(ticketComparisonFreshness({...row,validUntil:'2026-09-11'},new Date('2026-09-11T15:00:00Z')),'stale');
 assert.equal(ticketComparisonFreshness(row,new Date(+now+7*86400000)),'fresh');
 assert.equal(ticketComparisonFreshness(row,new Date(+now+7*86400000+1)),'stale');
 assert.equal(ticketComparisonFreshness({...row,checkedAt:new Date(+now+1).toISOString()},now),'stale');
 const a=revisedArticle();a.ticketComparison[0].validUntil='2026-09-10';assert.ok(contentErrors(a,now).some(e=>e.includes('stale')));
});
test('revised legacy preserves policy identity and still requires genuine editorial approval',()=>{
 const a=revisedArticle();a.slug=JSON.parse(fs.readFileSync('data/waug/content-policy.json')).legacySlugs[0];delete a.contentPolicyVersion;
 assert.deepEqual(contentErrors(a,now,[product()]),[]);
 a.contentReview.status='pending';assert.ok(contentErrors(a,now).some(e=>e.includes('검수 필요')));
 a.contentReview.status='approved';a.faq=[{question:'언제?',answer:'상품 페이지에서 확인하세요.'}];assert.ok(contentErrors(a,now).some(e=>e.includes('FAQ')));
});
test('public projection retains optional legacy FAQ, comparison and sources without changing images or mutating input',()=>{
 const p={...product(),eligibility:'eligible',saleStatus:'available'};
 for(const modern of [false,true]) {
 const a={...revisedArticle(),status:'published',publishedAt:now.toISOString(),thumbnail:{url:'existing-thumbnail',alt:'기존 이미지',width:1200,height:630,kind:'ai-generated',sources:[{credit:'기존 출처',rightsUrl:'existing-rights'}]},photos:[{url:'existing-photo',credit:'기존 출처'}],review:{checkedAt:now.toISOString()},visitInfo:[]};
 if(!modern)delete a.contentPolicyVersion;
 a.sections[0].photoIndex=0;a.sections[0].validUntil='2026-09-30';a.faq[0].validUntil='2026-09-30';
 const state={articles:[a],history:[{slug:a.slug}]},before=structuredClone(state);
 const projected=publicArticles(state,[p])[0];
 for(const key of ['editorialRevision','ticketComparison','faq','visitInfo','sources','sections','photos'])assert.deepEqual(projected[key],a[key],key);
 assert.equal(projected.thumbnail.url,a.thumbnail.url);assert.equal(projected.thumbnail.credit,'기존 출처');
 assert.equal(projected.thumbnail.kind,modern?'ai-generated':undefined);assert.equal(projected.contentPolicyVersion,modern?TICKET_POLICY:undefined);
 assert.equal(projected.tickets[0].href,p.affiliateUrl);assert.deepEqual(state,before);
 for(const key of ['editorialRevision','ticketComparison','faq','visitInfo'])delete a[key];
 const plain=publicArticles(state,[p])[0];for(const key of ['editorialRevision','ticketComparison','faq','visitInfo'])assert.equal(Object.hasOwn(plain,key),false);
 }
});
test('generator connects policy and template, keeps drafts pending, and drops old writing quotas',()=>{
 const writer=fs.readFileSync(new URL('./write-articles.mjs',import.meta.url),'utf8');
 const template=JSON.parse(fs.readFileSync(new URL('../../docs/waug-article-template.json',import.meta.url),'utf8'));
 assert.ok(writer.includes('JSON.stringify(articleTemplate)'));assert.ok(writer.includes('${writingRules}'));
 assert.ok(writer.includes('article.editorialRevision=EDITORIAL_REVISION'));
 assert.ok(writer.includes("status:'pending'"));assert.ok(writer.includes("status:'draft'"));
 assert.doesNotMatch(writer,/joined\.length\s*<|1800~2600|VISIT_TOPICS|항목을 모두 포함|sections\?\.length<4/);
 assert.ok(Array.isArray(template.ticketComparison));assert.deepEqual(template.visitInfo,[]);
});
