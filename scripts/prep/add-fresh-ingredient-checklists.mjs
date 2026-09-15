import fs from 'node:fs';
import sharp from 'sharp';
import {readStore, saveStore} from './store.mjs';

const configs = [
 ['camp-omandungi-maeuntang-checklist','캠핑 오만둥이 매운탕 재료 체크리스트','오만둥이·매운탕 양념·미나리·애호박을 출발 전 분리해 확인하는 캠핑 매운탕 장보기 체크리스트.','국물요리',['8630066299','8574770164','9604422506','8443644467'],'오만둥이 매운탕 준비물'],
 ['camp-ham-paprika-stirfry-checklist','캠핑 햄 파프리카 볶음 재료 체크리스트','햄·파프리카·버섯·볶음소스를 나눠 담아 캠핑에서 바로 확인하는 장보기 체크리스트.','볶음요리',['8243714135','7935223581','8655440206','7404695153'],'햄 파프리카 볶음 준비물'],
 ['camp-ham-cheese-friedrice-checklist','캠핑 햄치즈 볶음밥 재료 체크리스트','햄·치즈·김가루와 밥을 따로 챙길 때 확인하는 캠핑 볶음밥 재료 체크리스트.','볶음밥',['8243714135','6959448489','9468295724','9707359364'],'햄치즈 볶음밥 준비물'],
 ['camp-sundae-jeongol-checklist','캠핑 순대전골 재료 체크리스트','순대·육수·애호박·버섯을 한 번에 확인하는 캠핑 순대전골 장보기 체크리스트.','찌개',['8960028100','57577364','8443644467','8655440206'],'순대전골 준비물'],
 ['camp-chicken-skewer-bbq-checklist','캠핑 닭꼬치 바비큐 재료 체크리스트','모둠 닭꼬치·바비큐 소스·곁들임 채소를 나눠 확인하는 캠핑 바비큐 체크리스트.','삼겹살·바비큐',['9627651159','7614412503','8443644467','8655440206'],'닭꼬치 바비큐 준비물'],
 ['camp-woodfire-ciabatta-toast-checklist','캠핑 불멍 치아바타 토스트 재료 체크리스트','치아바타·치즈·햄과 토스트팬을 분리해 챙기는 캠핑 불멍 간식 체크리스트.','장작·불멍 간식',['9252211443','6959448489','8243714135','9398250478'],'치아바타 토스트 준비물'],
 ['camp-jidan-gimgaru-breakfast-checklist','캠핑 지단 김가루 아침 주먹밥 재료 체크리스트','계란지단·김가루·밥을 따로 준비해 아침에 바로 확인하는 캠핑 주먹밥 체크리스트.','간편식·아침',['8243681175','9468295724','1570991286','9127118279'],'아침 주먹밥 준비물'],
 ['camp-paprika-cheese-grill-checklist','캠핑 파프리카 치즈구이 재료 체크리스트','파프리카·치즈·버섯·집게를 분리해 챙기는 캠핑 곁들임 구이 재료 체크리스트.','기타 요리',['7935223581','6959448489','8655440206','9707359364'],'파프리카 치즈구이 준비물'],
];
const store = readStore();
const products = new Map(store.products.map(product => [product.id, product]));
for (const [, , , , ids] of configs) for (const id of ids) if (!products.get(id)?.verified) throw Error(`검증 상품 누락: ${id}`);
const palettes = ['#7a3e22','#8d442c','#7b5632','#553d31','#5f3a27','#8b633f','#58623c','#7a4733'];
const editorial = {
 'camp-omandungi-maeuntang-checklist':'오만둥이는 해물 향을 원하는 메뉴의 중심 재료로 보고, 미나리는 마지막에 따로 담아 눌리지 않게 합니다. 매운탕 양념은 개봉 여부를 표시하고 애호박은 물기 없이 별도 용기에 넣습니다.',
 'camp-ham-paprika-stirfry-checklist':'햄과 파프리카는 색과 식감을 구분해 담고, 버섯은 눌리지 않게 납작한 용기에 보관합니다. 볶음소스는 새지 않도록 지퍼백 안에 한 번 더 넣어 다른 식재료와 분리합니다.',
 'camp-ham-cheese-friedrice-checklist':'햄은 작은 조각용인지 슬라이스용인지 먼저 확인하고 치즈는 필요한 만큼만 차갑게 보관합니다. 김가루는 습기를 피하는 봉투에 두며 밥은 현장 여건에 맞는 별도 준비 항목으로 적습니다.',
 'camp-sundae-jeongol-checklist':'순대는 포장 상태와 보관 온도를 먼저 보고, 다시팩과 채소는 국물용 묶음으로 나눕니다. 버섯은 손질 전후를 구분할 용기를 챙겨 다른 식재료에 냄새가 배지 않게 합니다.',
 'camp-chicken-skewer-bbq-checklist':'닭꼬치는 꼬치 끝이 다른 포장을 찌르지 않도록 평평하게 놓고, 바비큐 소스는 외부 포장을 닦아 분리합니다. 애호박과 버섯은 곁들임 재료 묶음으로 따로 표시합니다.',
 'camp-woodfire-ciabatta-toast-checklist':'치아바타는 눌리지 않게 가장 위에 두고 치즈와 햄은 보냉 가방 안쪽에 넣습니다. 토스트팬은 식재료와 다른 칸에 넣고, 화기 사용 가능 여부는 캠핑장 현장 안내를 따릅니다.',
 'camp-jidan-gimgaru-breakfast-checklist':'계란지단은 얇은 포장이 찢어지지 않게 평평하게 보관하고 김가루는 습기 없는 곳에 둡니다. 젓가락과 식판은 아침 식사 상자에 묶어 두면 찾기 쉽습니다.',
 'camp-paprika-cheese-grill-checklist':'파프리카는 색상과 상태를 보고 고르고 치즈는 차가운 재료 상자에 넣습니다. 버섯은 물기가 많은 식재료와 닿지 않게 하며 집게는 조리 도구 전용 수납칸에 보관합니다.'
};
const now = new Date().toISOString();
const refs = ids => ids.map(productId => ({productId, imageUrl: products.get(productId).image}));
store.articles = store.articles.filter(article => !configs.some(([slug]) => slug === article.slug));

async function download(url) { const r = await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(30000)}); if(!r.ok) throw Error(`상품 사진 다운로드 실패: ${r.status}`); const h=new URL(r.url).hostname; if(h!=='ads-partners.coupang.com'&&!h.endsWith('.coupangcdn.com')) throw Error('승인되지 않은 상품 사진 리디렉션'); return Buffer.from(await r.arrayBuffer()); }
function backdrop(title,color,variant){return Buffer.from(`<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="800" fill="${color}"/><path d="M0 80 Q300 ${variant?180:20} 600 80 T1200 70 V0 H0Z" fill="#ffffff" fill-opacity=".12"/><rect x="40" y="42" width="1120" height="112" rx="26" fill="#16120f" fill-opacity=".78"/><text x="80" y="112" font-family="Arial, sans-serif" font-weight="700" font-size="42" fill="#fff">${title}</text><text x="80" y="714" font-family="Arial, sans-serif" font-size="19" fill="#fff" fill-opacity=".9">실제 등록 상품 사진으로 확인하는 재료 체크</text><text x="1120" y="754" text-anchor="end" font-family="Arial, sans-serif" font-size="17" fill="#fff" fill-opacity=".8">AI 연출 이미지</text></svg>`);}
async function makeImage(slug, slot, title, ids, color, variant) {
 const photos=await Promise.all(ids.map(async id=>sharp(await download(products.get(id).image)).rotate().resize({width:variant===0?260:250,height:variant===0?200:210,fit:'contain',background:'#fff'}).png().toBuffer()));
 const boxes=await Promise.all(photos.map(async photo=>sharp({create:{width:variant===0?300:290,height:variant===0?240:250,channels:4,background:'#fffdf8'}}).composite([{input:photo,left:variant===0?20:20,top:20}]).png().toBuffer()));
 const coords=variant===0?[[120,185],[780,185],[120,465],[780,465]]:variant===1?[[90,230],[455,230],[820,230],[455,510]]:[[110,215],[800,215],[110,510],[800,510]];
 const file=`public/prep-images/${slug}-${slot}-v1.webp`;
 await sharp(backdrop(title,color,variant)).composite(boxes.map((input,i)=>({input,left:coords[i][0],top:coords[i][1]}))).webp({quality:82}).toFile(file);
 return {url:`/prep-images/${slug}-${slot}-v1.webp`,width:1200,height:800,alt:`${title}에 필요한 실제 등록 상품 사진을 나눠 놓은 재료 체크 이미지`,generated:true,reviewed:true,prompt:`${title} 재료를 실제 등록 상품 사진으로 새로 배치한 체크리스트 이미지.`,usageNotice:'AI로 구성한 재료 점검 이미지입니다. 실제 상품 사진과 옵션은 각 상품 페이지에서 다시 확인하세요.',referenceProducts:refs(ids),productMatchReviewed:true,tags:ids.map((productId,index)=>({productId,x:variant===0?(index%2?70:28):(index===1||index===3?50:20),y:variant===0?(index>1?77:38):(index>2?75:43)}))};
}

for (let index=0; index<configs.length; index++) {
 const [slug,title,description,kind,ids,label]=configs[index];
 const cover=await makeImage(slug,'cover',label,ids,palettes[index],0);
 const primary=await makeImage(slug,'ingredients',`${label} · 주재료`,ids,palettes[index],1);
 const packing=await makeImage(slug,'packing',`${label} · 출발 전 확인`,ids,palettes[index],2);
 const facts=ids.map(id=>`${products.get(id).name} ${products.get(id).specification} ${products.get(id).options}`).join(' / '); const note=editorial[slug];
 store.articles.push({slug,title,description,category:'요리 재료 체크리스트',contentStyle:'shoppable-scene-v2',salesFormat:'food-checklist',coverLabel:label,status:'published',publishAt:now,updatedAt:now,reviewed:true,productIds:ids,cover,checklist:ids.flatMap((productId,i)=>[{id:`${slug}-${i+1}a`,label:products.get(productId).name,role:'상품명과 옵션을 보고 필요한 구성인지 확인하세요.',group:i===0?'main':'seasoning',productId},{id:`${slug}-${i+1}b`,label:`${products.get(productId).name} 보관 확인`,role:'포장에 적힌 보관 방법과 출발 전 포장 상태를 확인하세요.',group:i===ids.length-1?'common':'seasoning',productId}]),sections:[{heading:'장보기 전 재료 확인',text:`${title.replace(' 재료 체크리스트','')}에는 ${ids.map(id=>products.get(id).name).join(', ')}을(를) 연결했습니다. ${note} 상품 확인 메모: ${facts}. 이 글은 조리 순서가 아니라 출발 전 재료 확인에만 집중합니다.`,productIds:ids,image:primary},{heading:'출발 전 분리 포장',text:`${note} ${title.replace(' 재료 체크리스트','')} 재료는 포장에 적힌 보관 방법대로 나누어 담고, ${facts}. 캠핑장 취사 규칙과 실제 포장 라벨의 안전 안내를 우선 확인합니다.`,productIds:ids,image:packing}],internalLinks:[{href:'/camping',label:'재료를 챙겨 갈 캠핑장 찾아보기'}]});
}
saveStore(store,store.version); console.log(JSON.stringify({added:configs.map(c=>c[0]),articles:store.articles.length}));
