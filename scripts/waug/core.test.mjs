import {test} from 'node:test';
import assert from 'node:assert/strict';
import {importLinks} from './import.mjs';
import {validity} from './parse.mjs';
import {kstDay,readiness,schedule,publish,publicArticles,launchNow} from './core.mjs';
const now=new Date('2026-09-10T00:00:00Z');
function fixture(count=25){
  const products=[],articles=[];
  for(let i=0;i<count;i++){
    const id=`code${i}`,slug=`place-${i}`,checkedAt=now.toISOString();
    products.push({id,placeId:slug,affiliateUrl:`https://www.waug.com/r/${id}`,eligibility:'eligible',saleStatus:'available',lastCheckedAt:checkedAt,validUntil:'2026-12-31',verification:{status:'approved',source:'official'}});
    articles.push({slug,placeId:slug,area:i%2?'경기':'강원',theme:i%3?'체험':'공원',address:'검증된 주소',createdAt:checkedAt,title:'장소',description:'방문 안내',intro:'소개',sections:[{heading:'안내',paragraphs:['설명'],photoIndex:0},{heading:'준비',paragraphs:['준비 설명'],photoIndex:1}],sources:[{kind:'official'}],photos:[0,1].map(i=>({url:'https://example.com/photo'+i,alt:'사진',credit:'출처',placeMatched:true,rightsUrl:'rights',commercialAllowed:true,checkedAt})),internalLinks:[{href:'/places',verifiedAt:checkedAt}],review:{status:'approved',checkedAt},productIds:[id],thumbnail:{status:'approved',url:`https://mwohaji.kr/ticket-images/${slug}.jpg`,alt:'사진',width:1200,height:630,bytes:200000,mimeType:'image/jpeg',sha256:'sha',inputHash:'input',uploadedAt:checkedAt,verifiedAt:checkedAt,mobileCheckedAt:checkedAt,desktopCheckedAt:checkedAt,ogCheckedAt:checkedAt,sources:[{commercialAllowed:true,editAllowed:true,placeMatched:true,rightsUrl:'rights',checkedAt,credit:'credit'}]}});
  }
  return {products,state:{paused:false,articles,history:[]}};
}
test('KST midnight and validity ranges do not expire at their start',()=>{
  assert.equal(kstDay(new Date('2026-09-09T15:00:00Z')),'2026-09-10');
  assert.deepEqual(validity('유효기간 : 2026.09.01&nbsp;~ 2026.09.30까지 사용 가능'),{validFrom:'2026-09-01',validUntil:'2026-09-30'});
  assert.equal(validity('유효기간 : 구매 후 익일 ~ 2026.10.30까지 사용 가능').validUntil,'2026-10-30');
});
test('import preserves case, deduplicates exact links and retains tombstones',()=>{
  const db={products:[]};const table='| 장소 | https://www.waug.com/r/aBc123 |';importLinks(db,table);importLinks(db,table);
  assert.equal(db.products.filter(p=>p.id==='aBc123').length,1);assert.equal(db.products[0].affiliateUrl,'https://www.waug.com/r/aBc123');assert.equal(db.products.find(p=>p.id==='OuI5fLEv').eligibility,'excluded');
});
test('20 total nationwide; final day remainder; duplicate run is a no-op',()=>{
  const {products,state}=fixture();schedule(state,products,now);
  assert.equal(state.articles.filter(a=>a.scheduledAt.startsWith('2026-09-11')).length,20);
  assert.equal(publicArticles(state,products).length,0);
  const day1=new Date('2026-09-10T21:00:00Z');assert.equal(publish(state,products,day1).length,20);assert.equal(publish(state,products,day1).length,0);
  assert.equal(publish(state,products,new Date('2026-09-11T21:00:00Z')).length,5);
});
test('pause, exclusions, unknown sale, missing image rights and expiration block publication',()=>{
  const {products,state}=fixture(1);assert.deepEqual(readiness(state.articles[0],products,now),[]);
  state.paused=true;assert.deepEqual(schedule(state,products,now),[]);state.paused=false;
  for(const mutate of [p=>p.eligibility='excluded',p=>p.saleStatus='pending',p=>p.waterReviewRequired=true,p=>p.validUntil='2026-09-09']){const copy=structuredClone(products);mutate(copy[0]);assert.ok(readiness(state.articles[0],copy,now).length);}
  state.articles[0].thumbnail.sources[0].editAllowed=false;assert.ok(readiness(state.articles[0],products,now).length);
});
test('due articles whose checks expired are held; no future slug leaks',()=>{
  const {products,state}=fixture(1);schedule(state,products,now);assert.equal(publish(state,products,new Date('2026-09-20T00:00:00Z')).length,0);assert.equal(state.articles[0].status,'held');assert.equal(publicArticles(state,products).length,0);
});
test('existing same-day history caps backlog after retries',()=>{
  const {products,state}=fixture(25);schedule(state,products,now);
  state.history=Array.from({length:19},(_,i)=>({slug:`old-${i}`,day:'2026-09-11'}));
  assert.equal(publish(state,products,new Date('2026-09-10T21:00:00Z')).length,1);
});
test('launch of 30 prepared articles publishes only 20 including earlier same-day history',()=>{
  const {products,state}=fixture(55);state.publicationPolicy={launchDay:'2026-09-10'};
  const ids=state.articles.slice(0,30).map(a=>a.placeId);
  assert.equal(launchNow(state,products,ids,now).length,20);
  assert.equal(launchNow(state,products,ids,now).length,0);
  schedule(state,products,now);
  assert.equal(publish(state,products,new Date('2026-09-10T21:00:00Z')).length,20);
  assert.throws(()=>launchNow(state,products,ids,new Date('2026-09-10T21:00:00Z')));
});
test('original official WAUG photo may be used without edit permission; other unknown photos remain blocked',()=>{
  const {products,state}=fixture(1),im=state.articles[0].thumbnail;
  Object.assign(im,{kind:'waug-original',unedited:true,url:'https://d2mgzmtdeipcjp.cloudfront.net/files/good/photo.png',mimeType:'image/png',width:800,height:800});im.sources[0].editAllowed=false;
  im.sources[0].faceReview={status:'no-identifiable-faces'};
  assert.deepEqual(readiness(state.articles[0],products,now),[]);
  im.sources[0].commercialAllowed=false;assert.ok(readiness(state.articles[0],products,now).length);
});

test('AI thumbnail needs genuine provenance and disclosure, never unrelated photo credit',()=>{
  const {products,state}=fixture(1),im=state.articles[0].thumbnail;
  Object.assign(im,{kind:'ai-generated',sources:[],disclosure:'AI 생성 이미지',generation:{provider:'OpenAI imagegen',originalGeneration:true,promptHash:'saved-prompt',generatedAt:now.toISOString(),visualCheckedAt:now.toISOString()}});
  assert.deepEqual(readiness(state.articles[0],products,now),[]);
  im.sources=[{credit:'경기도'}];assert.ok(readiness(state.articles[0],products,now).length);
  im.sources=[];im.generation.promptHash=null;assert.ok(readiness(state.articles[0],products,now).length);
});

test('WAUG body photo without a face review blocks publication',()=>{
  const {products,state}=fixture(1),p=state.articles[0].photos[0];p.url='https://d2mgzmtdeipcjp.cloudfront.net/files/good/example.jpg';
  assert.ok(readiness(state.articles[0],products,now).includes('본문 사진 얼굴 검수 필요'));
  p.faceReview={status:'no-identifiable-faces'};assert.deepEqual(readiness(state.articles[0],products,now),[]);
});

test('two distinct body cuts must render, independent of thumbnail and URL sizes',()=>{
 const {products,state}=fixture(1),a=state.articles[0];
 for(const mutate of [c=>c.photos.pop(),c=>c.photos[1].url=c.photos[0].url+'?size=small',c=>c.photos[1].url=c.thumbnail.url,c=>delete c.sections[1].photoIndex]){const copy=structuredClone(a);mutate(copy);assert.ok(readiness(copy,products,now).includes('서로 다른 본문 이미지 2장 이상 실제 배치 필요'));}
});

test('existing reservations survive scheduler reruns and general publishers use an independent capacity',()=>{
 const {products,state}=fixture(3);state.articles[0].scheduledAt='2026-09-12T06:00:00+09:00';state.articles[0].status='scheduled';schedule(state,products,now);assert.equal(state.articles[0].scheduledAt,'2026-09-12T06:00:00+09:00');
 const day=new Date('2026-09-11T00:00:00Z');state.externalPublications={'2026-09-11':30};assert.equal(publish(state,products,day).length,2);assert.equal(publish(state,products,day).length,0);
});
