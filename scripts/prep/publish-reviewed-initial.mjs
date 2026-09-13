import fs from 'node:fs';
import {readStore,saveStore} from './store.mjs';
import {publicationErrors} from './content.mjs';
// One-time editorial release. Both exact affiliate destinations and cached
// product photos were opened and compared in the browser on 2026-09-13.
// This does not enable daily generation or relax automated link validation.
const store=readStore(),now=new Date().toISOString();
const config=JSON.parse(fs.readFileSync('data/weekend-prep-schedule.json','utf8'));
if(store.articles.some(a=>a.status==='published'))throw Error('Initial release already applied; do not overwrite publication dates');
for(const p of store.products){
 const u=new URL(p.affiliateUrl);
 const water=p.id==='7689270513',wipes=p.id==='305672892';
 if(!water&&!wipes)throw Error('Product not manually reviewed');
 const item=water?'20877904748':'3984481086',vendor=water?'87945140914':'71968792459';
 if(u.searchParams.get('pageKey')!==p.id||u.searchParams.get('itemId')!==item||u.searchParams.get('vendorItemId')!==vendor)throw Error('Reviewed option changed');
 p.source=`https://www.coupang.com/vp/products/${p.id}?itemId=${item}&vendorItemId=${vendor}`;
 p.specification=water?'병당 2L':'캡형, 팩당 100매';
 p.options=water?'2L × 24개 묶음':'100매 × 20개 묶음';
 p.checkedAt=now;p.verified=true;
 p.evidence='2026-09-13 브라우저에서 원본 제휴 URL의 판매처 도착, 상품번호·itemId·vendorItemId, 선택 옵션 및 기존 등록 사진과 판매처 대표 사진의 일치를 직접 확인. 가격·배송·후기·효능은 사용하지 않음.';
}
for(const a of store.articles){
 if(!config.initialTopics.some(t=>t.slug===a.slug))continue;
 if(a.slug==='walking-break-kit')a.sections[1].text='마실 물과 개인 소지품처럼 자주 사용하는 물건을 구분해 넣어 보세요. 물이 새면 곤란한 전자기기와 종이류는 따로 보관해요. 이 글에 연결된 탐사 샘물은 2L 24개 묶음으로, 작은 휴대용 병 상품이 아니에요. 짧은 산책에는 집에 있는 깨끗한 물병을 활용하고 실제 무게와 가방 크기를 확인하세요.';
 if(a.slug==='light-picnic-packing')a.sections[1].text=a.sections[1].text.replace('따로 준비할 생수 후보로는 탐사 샘물이 등록되어 있어요. 묶음 수량과 병 크기는 구매 전에 옵션에서 확인하고, 사진 속 물병과 같은 상품이라고 생각하지 않도록 해요.','별도 생수가 필요하다면 탐사 샘물의 용량과 묶음을 확인하세요. 연결 상품은 2L 24개 묶음이며 사진 속 휴대용 물병과 같은 상품이 아니에요. 나들이에는 필요한 양만 준비해요.');
 const notes=a.productIds.map(id=>id==='7689270513'?'탐사 샘물은 2L 24개 묶음 상품입니다. 전부 가져갈 필요 없이 실제 사용할 물의 양과 이동 방법을 먼저 정하세요.': '탐사 클래식 물티슈 캡형은 100매 20개 묶음 상품입니다. 집에 남은 물품을 먼저 확인하고 필요한 팩만 챙기세요. 사용 대상은 포장 안내를 따르며 손 씻기·음식 세척·소독을 대신하지 않습니다.');
 a.sections.splice(a.sections.length-1,0,{heading:'준비물은 집에 있는 것부터 확인해요',text:notes.join('\n'),productIds:[...a.productIds]});
 if(a.slug==='rainy-day-indoor-play')a.sections.at(-1).heading='놀이 전에 짧게 확인해요';
 a.reviewed=true;a.publishAt=now;a.updatedAt=now;
 const errors=publicationErrors(a,store);
 if(errors.length){console.log('HELD',a.slug,errors);continue;}
 a.status='published';
}
saveStore(store,store.version);
console.log(JSON.stringify({published:store.articles.filter(a=>a.status==='published').length,held:store.articles.filter(a=>a.status!=='published').length,apiCalls:0}));
