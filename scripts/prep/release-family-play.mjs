import fs from 'node:fs';
import {readStore,saveStore} from './store.mjs';
import {publicationErrors} from './content.mjs';
const s=readStore(),a=s.articles.find(a=>a.slug==='family-park-ring-ball-play'),now=new Date().toISOString();
if(!a||a.status!=='draft')throw Error('초안만 공개 전환할 수 있습니다');
const originalLinks=s.products.filter(p=>a.productIds.includes(p.id)).map(p=>p.affiliateUrl);
const facts={
 '9305516249':{specification:'파란 받침·노란 장대·고리 20개 세트. 판매처 최소 연령 14세 표시. 14세 미만용으로 권하지 않음',options:'블루, 1세트',evidence:'2026-09-13 원본 제휴 링크의 상품번호 9305516249, itemId 27569110845 및 최소 연령 14세 표시 확인. 실제 참고 사진과 기존 합성 장면의 제품 형태를 대조. 연출 인물은 적정 사용 연령을 나타내지 않음.'},
 '9643845674':{specification:'판매처 모델명 PU 소프트 야구공. 적정 연령·충격 안전성은 확인되지 않아 단정하지 않음',options:'화이트, 6개 (실제 API 선택 옵션)',evidence:'2026-09-14 원본 제휴 URL이 상품번호 9643845674 / itemId 28818316563으로 연결됨을 브라우저에서 확인. 필수 표기 모델명 PU 소프트 야구공 확인. API 옵션 및 흰색·빨간 무늬 원본 사진 대조. 안전이라는 상품명은 안전성 검증 결과가 아님.'},
 '8413271811':{specification:'실제 API 상품명에 접시콘 50p + 거치대 + 가방 세트로 안내. 치수·적정 연령·안전성 미확인',options:'혼합색상, 1세트 (실제 API 선택 옵션)',evidence:'2026-09-13 실제 쿠팡 API 응답의 상품 ID·옵션·사진 및 원본 제휴 URL 보존. 원본 사진의 낮은 다색 접시콘·흰 거치대·검은 망 가방을 합성 이미지와 대조. 2026-09-14 제휴 URL은 같은 상품 ID/itemId로 이동했으나 판매처 상세 화면은 403 접근 차단되어 본문에서 상세 규격과 구매 가능 여부를 확정하지 않음.'}
};
for(const p of s.products)if(facts[p.id])Object.assign(p,facts[p.id],{verified:true,checkedAt:now});
const notice='상품 연령 안내: 연결된 장대 고리던지기는 판매처에 14세 이상으로 표시되어 있습니다. 사진 속 어린아이는 AI 연출이며 해당 상품의 사용 대상이 아닙니다. 14세 미만 아이에게는 연령에 맞는 별도 놀이 도구를 선택하세요.';
a.description='공원에서 가족과 번갈아 즐기는 공 굴리기와 고리 던지기. 놀이 구역, 차례 정하기, 도구 선택과 정리 방법을 소개합니다. 연결된 고리 상품은 14세 이상용입니다.';
a.sections[0].text='주말 공원에서는 장난감을 많이 펼치는 것보다 간단한 규칙 하나로 시작해 보세요. 공 굴리기와 고리 던지기를 번갈아 하면 도구를 정리할 시간을 갖고 다음 차례도 기다릴 수 있습니다. 먼저 해당 공원이 공놀이와 도구 설치를 허용하는지 확인하고, 통행로와 다른 사람의 휴식 자리에서 떨어진 평평한 공간을 고릅니다.\n'+notice+' 다른 공과 접시콘도 연령·사용 조건을 확인한 뒤 선택하세요. 이 글은 놀이 아이디어와 도구 선택 기준을 안내하며, 사진 속 인물로 상품의 안전성이나 권장 연령을 판단하지 않습니다.';
a.sections[1].text='장대 고리던지기 고리 20개 세트, 1세트, 블루는 파란 받침과 노란 장대, 여러 색의 고리로 구성된 상품입니다. 판매처의 최소 연령 표시는 14세이며, 이 상품을 사용하는 아래 방법은 그 연령에 맞는 가족 구성원을 위한 예시입니다. 어린아이와 같은 놀이를 하려면 어린아이의 연령에 적합하다고 표시된 다른 제품을 골라 그 제품 설명을 따르세요.\n기록 경쟁보다 한 사람이 던지고 나면 다음 사람이 차례를 이어가는 규칙으로 시작할 수 있습니다. 제품 안내에 맞게 설치하고 던지는 방향 뒤에 사람이 없는지 살핍니다. 거리를 일률적으로 정하지 말고 도구의 사용 조건과 공간에 맞게 조정하세요. 고리를 줍는 동안에는 다른 사람이 던지지 않기로 먼저 약속합니다.';
a.sections[2].text+=' 이 상품의 적정 사용 연령은 확인하지 못했으므로 어린아이용 공이라고 단정하지 않습니다. 구매 전 포장·판매처의 대상 연령과 사용 안내를 확인하고 맞지 않으면 다른 공을 선택하세요.';
a.sections[3].text+=' 실제 조회된 구성은 접시콘 50p와 거치대·가방 1세트입니다. 모두 꺼내기보다 필요한 표식만 사용하세요. 상세 화면은 현재 확인이 제한되어 치수와 적정 연령은 확정하지 않습니다.';
const images=[a.cover,...a.sections.map(s=>s.image).filter(Boolean)];
const positions=[[[15,75],[68,88],[83,83]],[[23,80],[68,77],[85,80]],[[49,78],[66,85],[79,74]]];
images.forEach((im,i)=>{im.reviewed=true;im.productMatchReviewed=true;im.usageNotice=notice;im.tags=a.productIds.map((productId,j)=>({productId,x:positions[i][j][0],y:positions[i][j][1]}));});
a.reviewed=true;a.updatedAt=now;a.publishAt=now;
const errors=publicationErrors(a,s);if(errors.length)throw Error(errors.join(' / '));
if(JSON.stringify(originalLinks)!==JSON.stringify(s.products.filter(p=>a.productIds.includes(p.id)).map(p=>p.affiliateUrl)))throw Error('추적 링크 변경 금지');
a.status='published';saveStore(s,s.version);
fs.writeFileSync('data/weekend-prep-family-release-report.json',JSON.stringify({slug:a.slug,publishedAt:now,userApprovedExistingImagery:true,ageRestrictionRetained:true,images:3,hotspots:9,apiCalls:0,linkVerification:{ring:'previous browser review',ball:'browser verified',cones:'same-ID redirect observed; detail access blocked 403; only API-backed facts used'},publicationErrors:errors},null,2)+'\n');
console.log(JSON.stringify({slug:a.slug,status:a.status,images:images.length,hotspots:9,errors}));
