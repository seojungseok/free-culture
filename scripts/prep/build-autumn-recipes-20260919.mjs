import fs from 'node:fs';
import sharp from 'sharp';
import {recipeConfigs} from './autumn-recipes-config.mjs';
import {publicationErrors,validateShape} from './content.mjs';
import {readStore,saveStore} from './store.mjs';
const store=readStore(),version=store.version;
const assets=JSON.parse(fs.readFileSync('data/autumn-recipes-20260919-assets.json','utf8'));
const images=JSON.parse(fs.readFileSync('data/autumn-recipes-20260919-images.json','utf8'));
const reviewFile='data/autumn-recipes-20260919-review.json';
const review=fs.existsSync(reviewFile)?JSON.parse(fs.readFileSync(reviewFile,'utf8')):{images:[],products:[],articles:[]};
const recipes=recipeConfigs();
const publish=process.argv.includes('--publish');
const now=new Date().toISOString();
const labels={
 '7265684367':['생 돼지고기','찌개의 주재료. 양념된 제육과 구분해 보냉 포장'],
 '7692122826':['배추김치','김치찌개 국물과 건더기. 김칫국물은 따로 담기'],
 '7867851377':['두부','모양이 부서지지 않게 따로 담아 조리 후반에 넣기'],
 '6528172171':['대파','고명과 향을 더할 채소. 씻고 물기를 빼서 포장'],
 '7673804291':['다진마늘','향을 더할 양념. 사용할 양만 밀폐해 준비'],
 '9457848435':['양파','건더기 또는 볶음용 채소. 메뉴에 맞춰 크기를 맞추기'],
 '57577364':['국물육수 다시팩','국물 바탕을 낼 재료. 제품 사용 안내에 맞게 우려내기'],
 '7573349147':['재래식 된장','된장찌개 기본 양념. 집에 있으면 필요한 양만 소분'],
 '8443644467':['애호박','전 또는 국물 건더기. 손질 후 물기를 정리해 포장'],
 '8655440206':['새송이버섯','선택 채소. 두꺼운 부분을 비슷한 크기로 나누기'],
 '7290581164':['들깨가루','탕의 농도와 향을 낼 재료. 물기 없는 밀폐 용기에 준비'],
 '6211502021':['모둠버섯','탕의 주재료. 실제 포장의 버섯 구성 확인'],
 '9656363105':['감자','수제비·조림·탕의 건더기. 비슷한 두께로 손질'],
 '1221150659':['생수제비','반죽 대신 쓸 주재료. 포장 조리법과 보관 조건 확인'],
 '1761375156':['생 새우살','구이 주재료. 자숙 여부와 해동 안내 확인'],
 '7847571181':['무염버터','향을 더하는 재료. 큰 묶음 대신 집에 있는 버터 소분 가능'],
 '487322':['식용유','팬에 눌어붙지 않게 소량 사용하는 조리용 기름'],
 '7935223581':['파프리카 (선택)','곁들일 채소. 색상과 실제 구성은 상품 옵션 확인'],
 '8311251159':['손질 고등어','조림 주재료. 소금간과 가시, 해동 안내 확인'],
 '7235302196':['진간장','국물이나 양념의 간을 마지막에 조절하는 재료'],
 '8188252337':['고추장','붉은 양념의 바탕. 맵기와 짠맛을 보며 소량씩 사용'],
 '1628662667':['닭볶음탕용 생닭','탕의 주재료. 다른 식재료와 분리해 보냉 이동'],
 '1883548582':['밀떡','떡볶이 주재료. 불리기와 조리는 실제 포장 안내 우선'],
 '8682238562':['모둠어묵','떡볶이 건더기. 먹기 좋은 크기로 나누어 준비'],
 '8326848865':['달걀','애호박전에 입힐 달걀물. 조리 직전에 깨서 준비'],
 '6269223291':['부침가루','호박에 얇게 입힐 가루. 제품 자체의 간 확인'],
 '1909538':['스위트콘','버터콘치즈 주재료. 캔 국물을 빼서 준비'],
 '6959448489':['슬라이스 체다치즈','옥수수 위에 녹일 치즈. 모차렐라와 식감이 다름'],
 '8243714135':['슬라이스햄 (선택)','잘게 썰어 더할 선택 재료. 포장의 가열 안내 확인'],
 '9487214712':['냄비','재료와 국물이 넘치지 않을 용량, 버너와 호환 여부 확인'],
 '9206620361':['국자','완성 음식을 덜어 먹는 도구. 생재료용 도구와 분리'],
 '9676631018':['국그릇','국물과 건더기를 개인별로 나누어 담는 식기'],
 '9587833030':['팬 또는 그리들','집에 있는 팬으로 대체 가능. 버너 허용 크기 확인'],
 '9707359364':['조리 집게','음식을 뒤집고 덜어낼 도구. 생식품용과 분리'],
 '9127118279':['개인 접시','완성 음식을 나누어 먹는 식기. 내열 조건 확인'],
 '7689270513':['조리용 물','육수나 국물 양 조절용. 마실 물과 별도로 준비']
};
const options={
 '7573349147':'된장 2kg × 1개', '7290581164':'들깨가루 200g × 1개',
 '9656363105':'상품명 기준 중 크기 감자 5kg × 1개', '1221150659':'생수제비 1kg × 5개',
 '1761375156':'상품명에 900g~1000g 및 특대 40~50미 표시. 정확한 중량은 선택 옵션 확인',
 '7847571181':'무염버터 227g × 30개 묶음. 단품 사진과 판매 수량은 다름',
 '7673804291':'다진마늘 1kg × 1개', '8311251159':'고등어 1kg × 1박스. 염장 여부와 토막 수는 판매처 확인',
 '7235302196':'진간장 500ml × 5개', '1628662667':'원본 사진은 1,000g 표시. 현재 선택 중량·수량은 판매처 확인',
 '8188252337':'고추장 2.2kg × 1개', '1883548582':'밀떡 2kg × 1개', '1909538':'스위트콘 340g × 5개'
};
for(const p of assets.products){
 if(store.products.some(x=>x.id===p.id))continue;
 if(!labels[p.id]||!options[p.id])throw Error('Product facts missing: '+p.id);
 store.products.push({...p,source:new URL(p.affiliateUrl).searchParams.has('itemId')?`https://www.coupang.com/vp/products/${p.id}?itemId=${new URL(p.affiliateUrl).searchParams.get('itemId')}&vendorItemId=${new URL(p.affiliateUrl).searchParams.get('vendorItemId')}`:p.source,
  specification:labels[p.id][0],options:options[p.id],verified:review.products.includes(p.id),
  evidence:'2026-09-19 공용 제한기를 경유한 실제 상품 API 응답의 ID·상품명·원본 제휴 URL과 대표 사진을 대조. 브라우저에서 itemId/vendorItemId를 포함한 판매 화면의 상품명·선택 옵션을 추가 확인. 가격·배송·지속적인 재고는 보장하지 않음.'});
}
const productMap=new Map(store.products.map(p=>[p.id,p]));
for(const p of store.products)if(review.products.includes(p.id)&&assets.products.some(x=>x.id===p.id))p.verified=true;
async function photo(recipe,part,ids){
 const record=images.find(x=>x.key===recipe.key&&x.part===part);
 const url=`/prep-images/autumn-20260919-${recipe.key}-${part}.webp`;
 if(record){await sharp(record.source).resize(1200,800,{fit:'cover'}).webp({quality:83}).toFile('public'+url);}
 const overrides={
  'mackerel-potato-braise/cover':[[34,33],[73,32],[14,50],[73,63]],
  'zucchini-pancake/cover':[[25,30],[63,49],[38,55],[80,50]],
  'pork-kimchi-stew/support':[[20,50],[50,67],[80,50]],
  'doenjang-stew/support':[[20,60],[50,50],[80,50]],
  'perilla-mushroom-soup/support':[[20,60],[50,50],[80,50]],
  'potato-sujebi/support':[[20,66],[50,50],[80,50]],
  'zucchini-pancake/support':[[20,50],[50,65],[80,50]],
  'pork-kimchi-stew/serving':[[33,45],[69,81],[83,60]],
  'perilla-mushroom-soup/serving':[[33,45],[62,70],[83,53]],
  'chicken-potato-stew/serving':[[33,45],[61,70],[86,68]]
 };
 const coordinates=overrides[recipe.key+'/'+part]||(part==='cover'?[[25,33],[73,32],[25,64],[73,63]]:part==='support'?[[20,60],[50,50],[80,55]]:recipe.style==='pan'?[[33,45],[65,78],[83,48]]:[[33,45],[60,77],[85,60]]);
 return {url,alt:part==='cover'?`${recipe.dish} 주재료를 펼친 가을 캠핑 장보기 장면`:part==='support'?`${recipe.dish}에 곁들일 채소와 양념 준비`:`${recipe.dish}를 나누어 담는 조리도구 사용 예시`,width:1200,height:800,generated:true,
  reviewed:review.images.includes(recipe.key+'/'+part),productMatchReviewed:review.images.includes(recipe.key+'/'+part),prompt:record?.prompt||'Image pending review',
  referenceProducts:ids.map(id=>({productId:id,imageUrl:productMap.get(id).image})),tags:ids.map((productId,i)=>({productId,x:coordinates[i][0],y:coordinates[i][1]}))};
}
const added=[];
for(const recipe of recipes){
 const spec=assets.recipes.find(r=>r.key===recipe.key);if(!spec)throw Error('Recipe missing: '+recipe.key);
 const tools=recipe.style==='pan'?['9587833030','9707359364','9127118279']:['9487214712','9206620361','9676631018'];
 const ids=[...new Set([...spec.main,...spec.support,...tools,...(recipe.style==='soup'?['7689270513']:[])])];
 const slug=`autumn-camping-${recipe.key}-ingredient-checklist`;
 const before=store.articles.find(a=>a.slug===slug);
 const sections=recipe.sections.map(([heading,text],i)=>({heading:i===0?`${recipe.dish} 재료: ${heading}`:heading,text,productIds:i<2?[...spec.main,...spec.support]:i===2?ids:tools}));
 sections[0].text=`${recipe.dish}의 기본 재료는 ${spec.main.map(id=>labels[id][0]).join('·')}입니다. 체크리스트에서 양념과 집에 있는 조리도구까지 나누어 확인하세요.\n\n${sections[0].text}`;
 for(const section of sections){
  const sentences=section.text.split(/(?<=[.!?])\s+/);section.text=sentences.map((line,i)=>line+(i%2===1?'\n':' ')).join('').trim();
 }
 sections[1].image=await photo(recipe,'support',spec.support);
 sections[3].image=await photo(recipe,'serving',tools);
 sections.push({heading:'장보기 수량과 보냉, 출발 전에 확인',text:'체크리스트의 상품 링크는 재료 선택을 돕기 위한 것으로, 판매 묶음 전체가 한 끼 분량은 아닙니다. 집에 있는 같은 재료와 도구를 우선 사용하고 인원수에 맞게 나누어 챙기세요. 냉장·냉동 식품은 표시된 보관 조건을 지키며 생식품과 익힌 음식을 분리합니다. 가을에도 야외에 오래 펼쳐 두지 말고 손·칼·도마를 깨끗하게 관리하세요. 모든 취사는 캠핑장에서 허용한 장소에서만 하세요.',productIds:[]});
 const article={slug,title:`${recipe.dish} 재료 체크리스트 | 가을 캠핑 준비물`,description:recipe.intro,category:'요리 재료 체크리스트',contentStyle:'shoppable-scene-v2',salesFormat:'food-checklist',coverLabel:`가을 캠핑 ${recipe.dish} 재료`,
  status:'draft',publishAt:before?.publishAt||now,updatedAt:now,reviewed:review.articles.includes(recipe.key),cover:await photo(recipe,'cover',spec.main),sections,productIds:ids,
  checklist:ids.map(id=>({id:'ingredient-'+id,label:labels[id][0],role:labels[id][1],group:tools.includes(id)||id==='7689270513'?'common':spec.main.includes(id)?'main':'seasoning',productId:id})),
  imageConnectionNote:'사진은 실제 재료·상품 사진을 참고한 AI 연출 예시입니다. 포장 글자·재료 수량·완성 모습은 실제 판매 구성이나 조리 결과를 보증하지 않습니다. +는 이 요리에 어울리는 재료·도구로 연결되며 실제 옵션은 판매 페이지에서 확인하세요.',
  internalLinks:[{href:'/camping',label:'요리를 준비해 떠날 캠핑장 찾아보기'},{href:'/season',label:'캠핑 전후 가을 나들이 장소 둘러보기'}]};
 const index=store.articles.findIndex(a=>a.slug===slug);
 if(index>=0)store.articles[index]=article;else store.articles.push(article);
 added.push(article);
}
validateShape(store);
const report=added.map(a=>({slug:a.slug,errors:publicationErrors(a,store)}));
if(publish){
 if(!review.linksCheckedAt)throw Error('Affiliate destination review required');
 for(const a of added)if(report.find(r=>r.slug===a.slug).errors.length===0)a.status='published';
 // A failed article remains a draft and does not bypass its gate or block other ready articles.
}
saveStore(store,version);
console.log(JSON.stringify({published:added.filter(a=>a.status==='published').length,drafts:added.filter(a=>a.status==='draft').length,report},null,2));
