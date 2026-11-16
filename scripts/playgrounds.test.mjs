import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {normalizePlayground,isPlaygroundCandidate,areaFor} from '../lib/playgrounds.mjs';
import {collectPlaygrounds,savePlaygroundSnapshot} from './collectPlaygrounds.mjs';
import {refreshPlaygroundTour} from './refreshPlaygroundTour.mjs';
import {createHash} from 'node:crypto';
import {playgroundSeason,canRecommendPlayground,isTemporarilyClosed} from '../lib/playgroundSeason.mjs';
import {checkPlaygroundOperations,operationFingerprint} from './checkPlaygroundOperations.mjs';
import {filterPlaygroundGuides,playgroundBrowseHref} from '../lib/playgroundContent.mjs';
const at='2026-11-16T13:12:06.198Z';
const row=(id,extra={})=>({pfctSn:String(id),pfctNm:'한빛공원 놀이터',ronaAddr:'서울특별시 광진구 능동로 1',instlPlaceCd:'A003',prvtPblcYnCdNm:'공공',operYnCdNm:'운영',wowaStylRideCd:'X002',clsgYmd:'',rgnCdNm:'서울특별시 광진구',...extra});
const reply=(items,page=1,total=items.length,size=2)=>({ok:true,json:async()=>({response:{header:{resultCode:'00'},body:{items,pageIndex:String(page),recordCountPerPage:String(size),totalCnt:String(total)}}})});
test('운영·공공·허용 설치장소만 공개 후보, 물놀이 여부는 등록값으로만 판별',()=>{
 assert.equal(isPlaygroundCandidate(normalizePlayground(row(1),at)),true);
 for(const extra of [{operYnCdNm:'이용금지'},{prvtPblcYnCdNm:'민간'},{clsgYmd:'20261101'}])assert.equal(isPlaygroundCandidate(normalizePlayground(row(1,extra),at)),false);
 assert.equal(normalizePlayground(row(1,{instlPlaceCd:'A010'}),at),null);
 assert.equal(normalizePlayground(row(1,{wowaStylRideCd:'알수없음'}),at).waterEquipment,null);
 assert.equal(normalizePlayground(row(1,{wowaStylRideCd:'X001'}),at).waterEquipment,true);
});
test('축약 지역과 행정구역 원자료를 사용해 불완전 주소 보완',()=>{
 assert.equal(areaFor('충북 청주시'), '충북');assert.equal(areaFor('경남 김해시'),'경남');
 assert.equal(areaFor('전남광주통합특별시 광산구 선암동'),'광주');
 const result=normalizePlayground(row(1,{ronaAddr:'726',rgnCdNm:'경상남도 김해시 부곡동'}),at);
 assert.equal(result.area,'경남');assert.equal(result.address,'경상남도 김해시 부곡동 726');
});
test('마지막 페이지까지 일치할 때만 완전 수집, 키는 URLSearchParams로 한 번 인코딩',async()=>{
 let calls=0;const result=await collectPlaygrounds({key:'test%2Bkey%3D',now:new Date(at),pageSize:2,places:['A003'],pause:async()=>{},fetchImpl:async url=>{calls++;assert.equal(url.searchParams.get('serviceKey'),'test+key=');return calls===1?reply([row(1),row(2)],1,3):reply([row(3)],2,3);}});
 assert.equal(result.records.length,3);assert.equal(result.refresh.complete,true);assert.equal(calls,2);
});
test('HTTP·인증·누락·중복·건수 변동은 성공 자료로 저장하지 않음',async()=>{
 const responses=[{ok:false,status:403},{ok:true,json:async()=>({response:{header:{resultCode:'30',resultMsg:'test-secret'},body:{}}})},reply([row(1)],1,3),reply([row(1),row(1)],1,2),reply([row(1,{instlPlaceCd:'A010'})],1,1)];
 for(const response of responses){await assert.rejects(collectPlaygrounds({key:'test-secret',pageSize:2,places:['A003'],fetchImpl:async()=>response}),error=>!error.message.includes('test-secret'));}
 let call=0;await assert.rejects(collectPlaygrounds({key:'x',pageSize:2,places:['A003'],pause:async()=>{},fetchImpl:async()=>++call===1?reply([row(1),row(2)],1,3):reply([row(3)],2,4)}),/전체 건수 변경/);
});
test('네트워크 오류의 인증 URL을 노출하지 않고 요청 예산 초과도 중단',async()=>{
 await assert.rejects(collectPlaygrounds({key:'secret',fetchImpl:async()=>{throw Error('https://example.org?serviceKey=secret');}}),error=>!error.message.includes('secret'));
 await assert.rejects(collectPlaygrounds({key:'x',maxCalls:1,pageSize:2,places:['A003'],pause:async()=>{},fetchImpl:async()=>reply([row(1),row(2)],1,3)}),/예산 초과/);
});
test('시설 급감·불완전 수집은 기존 파일 보존, 사라진 항목은 보관',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'playground-test-')),file=path.join(directory,'snapshot.json');
 const base={generatedAt:at,refresh:{complete:true,groups:[{placeCode:'A003',total:10,received:10,complete:true}]},records:Array.from({length:10},(_,i)=>normalizePlayground(row(i+1),at))};
 try{savePlaygroundSnapshot(structuredClone(base),{file});const before=fs.readFileSync(file,'utf8');assert.throws(()=>savePlaygroundSnapshot({...structuredClone(base),refresh:{complete:false}},{file}),/불완전/);assert.equal(fs.readFileSync(file,'utf8'),before);assert.throws(()=>savePlaygroundSnapshot({...structuredClone(base),refresh:{complete:true,groups:[{placeCode:'A003',total:1,received:1,complete:true}]},records:[base.records[0]]},{file}),/급감/);assert.equal(fs.readFileSync(file,'utf8'),before);const updated=structuredClone(base);updated.records.pop();updated.refresh.groups[0].total=updated.refresh.groups[0].received=9;savePlaygroundSnapshot(updated,{file});assert.equal(updated.records.at(-1).listed,false);assert.equal(updated.records.at(-1).active,false);}finally{fs.rmSync(directory,{recursive:true});}
});
test('발행 글마다 실제 시설·API 사진·고유 검색 설명과 충분한 본문이 연결됨',()=>{
 const snapshot=JSON.parse(fs.readFileSync('data/playgrounds.json')),guides=JSON.parse(fs.readFileSync('data/playground-guides.json')).guides,tour=JSON.parse(fs.readFileSync('data/playground-tour.json')),ids=new Map(snapshot.records.map(p=>[p.id,p]));
 assert.equal(new Set(guides.map(g=>g.description)).size,guides.length);
 for(const g of guides){assert.ok(g.description.length<=80);assert.ok(g.sections.length>=3);assert.ok(g.sections.flatMap(s=>s.paragraphs).join('').length>=400,g.slug+' 장소별 본문');for(const key of ['address','fee','feeDetails','hours','booking','age','parking','closed','phone'])assert.ok(g.visit[key]?.trim(),g.slug+' 방문정보 '+key);for(const id of g.facilityIds)assert.ok(ids.has(id),g.slug+'의 실제 시설 연결 확인');const p=tour.places[g.tourId];assert.ok(p.intro);assert.ok(p.photos.length>=2);for(const image of p.photos){assert.equal(image.contentId,g.tourId);assert.ok(['Type1','Type3'].includes(image.license));assert.equal(new URL(image.original).hostname,'tong.visitkorea.or.kr');assert.ok(fs.existsSync('public'+image.src));if(image.license==='Type3')assert.equal(createHash('sha256').update(fs.readFileSync('public'+image.src)).digest('hex'),image.originalSha256);}}
});
test('11월 16일 기준 주말은 21일, 겨울은 실내 우선이며 물놀이는 개장 검증 없으면 제외',()=>{
 const now=new Date(at),season=playgroundSeason(now),facility=normalizePlayground(row(1),at),review={status:'verified',checkedAt:at,closedWeekdays:[1],exceptions:[]};
 assert.equal(season.today,'2026-11-16');assert.equal(season.weekend,'2026-11-21');assert.equal(season.winter,true);
 assert.equal(canRecommendPlayground({indoor:true},[facility],review,{now}),true);
 assert.equal(canRecommendPlayground({indoor:false},[facility],review,{now}),false);
 assert.equal(canRecommendPlayground({indoor:true},[{...facility,waterEquipment:true}],review,{now}),false);
 assert.equal(canRecommendPlayground({indoor:true},[facility],{...review,checkedAt:undefined},{now}),false);
 assert.equal(canRecommendPlayground({indoor:true},[facility],{...review,checkedAt:'2026-11-10T00:00:00Z'},{now}),false);
 assert.equal(canRecommendPlayground({indoor:true},[{...facility,checkedAt:'2026-11-10T00:00:00Z'}],review,{now}),false);
});
test('공지 등록일을 휴장 시작일로 사용하지 않고 실제 11월 24일 하루에만 제한',()=>{
 const review={status:'verified',checkedAt:at,closedWeekdays:[1],exceptions:[{start:'2026-11-24',end:'2026-11-24'}]},now=new Date(at),facility=normalizePlayground(row(1),at);
 assert.equal(isTemporarilyClosed(review,'2026-11-11'),false);assert.equal(isTemporarilyClosed(review,'2026-11-16'),false);assert.equal(isTemporarilyClosed(review,'2026-11-24'),true);assert.equal(isTemporarilyClosed(review,'2026-11-25'),false);
 assert.equal(canRecommendPlayground({indoor:true},[facility],review,{now,forDate:'2026-11-24'}),false);
 assert.equal(canRecommendPlayground({indoor:true},[facility],review,{now,forDate:'2026-11-25'}),true);
 assert.equal(canRecommendPlayground({indoor:true},[facility],review,{now,forDate:'2026-11-16'}),false);
});
test('공식 운영·공지 본문 변경이나 확인 실패 시 추천에서 보류하고 이전 확인시각을 보존',async()=>{
 const html='<html><body>겨울 실내놀이터 운영시간 10시부터 17시, 매주 월요일 정기휴관 안내입니다.</body></html>',hash=operationFingerprint(html),input={reviews:{guide:{status:'verified',checkedAt:at,sources:[{url:'https://example.org',mode:'page',reviewedHash:hash}]}}};
 const unchanged=await checkPlaygroundOperations(input,{now:new Date(at),fetchImpl:async()=>({ok:true,text:async()=>html})});assert.equal(unchanged.reviews.guide.status,'verified');
 const changed=await checkPlaygroundOperations(input,{now:new Date(at),fetchImpl:async()=>({ok:true,text:async()=>html.replace('10시','11시')})});assert.equal(changed.reviews.guide.status,'review-required');assert.equal(input.reviews.guide.status,'verified');
 const failed=await checkPlaygroundOperations(input,{now:new Date('2026-11-17T00:00:00Z'),fetchImpl:async()=>{throw Error('offline');}});assert.equal(failed.reviews.guide.status,'review-required');assert.equal(failed.reviews.guide.checkedAt,at);
});
test('관광 API 변경을 감지하되 편집 글·사진·원본 입력을 덮어쓰지 않음',async()=>{
 const input={places:{'123':{checkedAt:at,intro:{contentid:'123',usetime:'상시 개방',parking:'가능'},photos:[{src:'reviewed.webp'}]}}};
 const changed=await refreshPlaygroundTour({input,now:new Date(at),pause:async()=>{},fetchIntro:async()=>({contentid:'123',usetime:'09:00~17:00',parking:'가능'})});
 assert.equal(changed.places['123'].introChangedSinceReview,true);assert.equal(input.places['123'].intro.usetime,'상시 개방');assert.equal(changed.places['123'].photos[0].src,'reviewed.webp');
 await assert.rejects(refreshPlaygroundTour({input,pause:async()=>{},fetchIntro:async()=>undefined}),/필수정보/);
});

test('무료 필터는 입장료 기준이며 보호자·주차 무료를 전체 무료로 오인하지 않음',()=>{
 const input=[{slug:'paid',area:'대전',indoor:true,name:'나무놀이터',visit:{feeKind:'paid',fee:'유아 5,000원',highlights:['보호자 무료','주차 무료']}},{slug:'free',area:'서울',indoor:false,name:'어린이 공원',visit:{feeKind:'free',highlights:['모험나라']}}];
 assert.deepEqual(filterPlaygroundGuides(input,{type:'free'}).map(g=>g.slug),['free']);
 assert.deepEqual(filterPlaygroundGuides(input,{type:'indoor',area:'대전'}).map(g=>g.slug),['paid']);
 assert.equal(filterPlaygroundGuides(input,{type:'free',area:'대전'}).length,0);
 assert.deepEqual(filterPlaygroundGuides(input,{area:'서울',q:'모험 나라'}).map(g=>g.slug),['free']);
 const href=playgroundBrowseHref('서울','free','어린이');assert.equal(new URL(href,'https://mwohaji.kr').searchParams.get('area'),'서울');assert.equal(new URL(href,'https://mwohaji.kr').searchParams.get('type'),'free');
});

test('상세 API의 요금 변경은 재검토로 표시하고 잘못 연결된 장소는 저장하지 않음',async()=>{
 const input={places:{'123':{checkedAt:at,intro:{contentid:'123',usetime:'상시 개방'},photos:[{src:'reviewed.webp'}]}}};
 const options={input,detailsOnly:true,initializeReviewed:true,pause:async()=>{},now:new Date(at),fetchCommon:async()=>({contentid:'123',title:'한빛공원',addr1:'서울특별시 광진구',homepage:'<a href="https://example.org">공식</a>',mapx:'127',mapy:'37'}),fetchInfo:async()=>[{infoname:'입장료',infotext:'무료'},{infoname:'화장실',infotext:'있음'}]};
 const checked=await refreshPlaygroundTour(options);assert.equal(checked.places['123'].common.address,'서울특별시 광진구');assert.equal(checked.places['123'].common.homepage,'https://example.org');assert.equal(checked.places['123'].detailsChangedSinceReview,false);assert.equal(checked.places['123'].checkedAt,at);
 const changed=await refreshPlaygroundTour({...options,input:checked,initializeReviewed:false,fetchInfo:async()=>[{infoname:'입장료',infotext:'5,000원'}]});assert.equal(changed.places['123'].detailsChangedSinceReview,true);assert.equal(checked.places['123'].extra[0].content,'무료');assert.equal(changed.places['123'].photos[0].src,'reviewed.webp');
 await assert.rejects(refreshPlaygroundTour({...options,fetchCommon:async()=>({contentid:'999',addr1:'다른 장소'})}),/장소 식별/);
});
