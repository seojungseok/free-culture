import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {ingredientQueries} from './ingredient-completion-plan.mjs';
import {validCandidate} from './complete-ingredient-links.mjs';

export const recipeIngredients={
 'camp-seafood-pot-table':['모둠해물','무','대파','미나리','손질 오만둥이','매운탕 양념','냄비','국자','국그릇','조리용 물'],
 'camp-morning-sandwich':['식빵','슬라이스 햄','체다 슬라이스 치즈','무염버터','마요네즈','토마토','양상추','샌드위치팬','조리 집게','개인 접시'],
 'camp-noodle-lunch':['소면','국물육수 다시팩','달걀','김가루','대파','무','양파','애호박','당근','국간장','소금','냄비','국자','국그릇','조리용 물'],
 'grilled-vegetable-side-dishes':['파프리카','애호박','새송이버섯','양파','토마토','꼬치','바비큐 양념소스','식용유','그리들','조리 집게','개인 접시'],
 'camp-jeyuk-bokkeum':['제육용 돼지고기','양파','대파','식용유','고추장','고춧가루','진간장','설탕','다진마늘','맛술','볶음소스','그리들','조리 집게','개인 접시'],
 'camp-sundae-bokkeum':['찰순대','양배추','양파','당근','대파','깻잎','고추장','고춧가루','진간장','설탕','올리고당','다진마늘','만능양념장','들깨가루','그리들','조리 집게','개인 접시'],
 'camp-dakgalbi':['양념 닭갈비','양배추','고구마','양파','대파','깻잎','밀떡','고추장','그리들','조리 집게','개인 접시'],
 'camp-ojingeo-bokkeum':['손질 오징어','양파','당근','대파','양배추','고추장','고춧가루','진간장','설탕','다진마늘','맛술','오징어볶음 소스','감자전분','식용유','그리들','조리 집게','개인 접시'],
 'camp-kimchi-fried-rice':['즉석밥','배추김치','슬라이스 햄','대파','식용유','고추장','참기름','김가루','통깨','그리들','조리 집게','개인 접시'],
};
const seasoning=new Set(['식용유','국물육수 다시팩','김가루','국간장','소금','무염버터','마요네즈','고추장','고춧가루','진간장','설탕','다진마늘','맛술','볶음소스','올리고당','만능양념장','들깨가루','오징어볶음 소스','감자전분','참기름','통깨','바비큐 양념소스','매운탕 양념']);
const tools=new Set(['냄비','국자','국그릇','조리용 물','샌드위치팬','조리 집게','개인 접시','그리들','꼬치']);
const extraRoles={
 '무':'국물에 넣을 무입니다. 손질해 따로 담아 주세요.',
 '식빵':'샌드위치 겉면이 될 빵입니다. 팬 크기에 맞는 식빵을 고르세요.',
 '소면':'잔치국수용 면입니다. 먹을 인원에 맞춰 필요한 양만 준비하세요.',
 '마요네즈':'샌드위치에 바를 소스입니다. 버터와 겹쳐 많이 바르지 마세요.',
 '토마토':'샌드위치나 채소꼬치에 넣을 채소입니다. 크기를 확인하고 씻어서 준비하세요.',
 '양상추':'샌드위치에 넣을 잎채소입니다. 씻은 뒤 물기를 빼서 따로 담으세요.',
 '양배추':'볶음요리에 넣을 채소입니다. 먹기 좋게 썰어 고기와 분리해 담으세요.',
 '당근':'볶음요리나 고명에 넣습니다. 다른 재료와 비슷한 크기로 손질하세요.',
 '깻잎':'볶음요리 마지막에 넣을 채소입니다. 씻어서 물기를 뺀 뒤 보관하세요.',
 '고구마':'닭갈비에 넣을 재료입니다. 고르게 익도록 비슷한 두께로 썰어 주세요.',
 '고춧가루':'직접 양념할 때 씁니다. 시판 소스를 쓰면 양념을 겹쳐 넣지 마세요.',
 '설탕':'양념의 단맛을 맞출 때 씁니다. 레시피에 적힌 양을 따로 덜어 준비하세요.',
 '맛술':'직접 양념할 때 넣습니다. 사용량과 제품 표시를 확인하세요.',
 '국간장':'국수 육수의 간을 맞출 때 씁니다. 조금씩 더해 간을 맞추세요.',
 '소금':'국물이나 채소의 간을 맞출 때 씁니다. 필요한 양만 덜어 가세요.',
 '참기름':'김치볶음밥 마무리에 넣습니다. 작은 용기에 먹을 만큼만 준비하세요.',
 '통깨':'김치볶음밥을 담은 뒤 뿌릴 고명입니다.',
 '감자전분':'오징어볶음의 농도를 맞출 때 물에 풀어 씁니다.',
 '올리고당':'순대볶음 양념에 넣습니다. 다른 단맛 재료와 합쳐 사용량을 맞추세요.',
 '꼬치':'손질한 채소를 꽂을 때 씁니다. 길이와 재질을 확인하세요.',
 '샌드위치팬':'식빵과 속재료를 함께 굽는 도구입니다. 팬 크기와 사용할 열원을 확인하세요.',
};

export function applyIngredientCatalog(store,candidates,{now=new Date().toISOString(),registered=[]}={}){
 const catalog=new Map(),sources=new Map();
 for(const article of store.articles)for(const item of article.checklist||[]){if(!sources.has(item.label))sources.set(item.label,item);if(item.affiliate?.reviewed===true&&!catalog.has(item.label))catalog.set(item.label,item.affiliate);}
 const originalLabels=new Set(catalog.keys());
 for(const candidate of candidates){
  const query=ingredientQueries.find(q=>q.key===candidate.key);
  if(candidate.reviewed!==true||!query||!validCandidate({productId:candidate.productId,productName:candidate.productName,productUrl:candidate.url,productImage:candidate.image},query)||!candidate.reviewNote||!candidate.localImage)continue;
  const affiliate={url:candidate.url,productName:candidate.productName,checkedAt:candidate.checkedAt,source:'coupang-api',reviewed:true,image:candidate.localImage,optionNote:candidate.optionNote||'요리에 필요한 양과 판매 포장 단위를 구분해 준비하세요. 묶음 수량은 상품명과 판매 페이지에서 확인할 수 있어요.'};
  for(const label of query.labels)if(!originalLabels.has(label))catalog.set(label,affiliate);
 }
 for(const candidate of registered){
  if(!candidate.labels?.length||candidate.reviewed!==true||!candidate.reviewNote||!candidate.localImage||!candidate.reviewedAt)continue;
  const affiliate={url:candidate.url,productName:candidate.productName,checkedAt:candidate.checkedAt,source:'registered-product',sourceUrl:candidate.sourceUrl,reviewedAt:candidate.reviewedAt,reviewed:true,image:candidate.localImage,optionNote:candidate.options+' · 요리에 필요한 양과 포장 단위를 구분해 준비하세요.'};
  for(const label of candidate.labels)catalog.set(label,affiliate);
 }
 let added=0;const changed=new Set();
 for(const article of store.articles){
  for(const item of article.checklist||[]){if(!item.affiliate&&catalog.has(item.label)){item.affiliate=structuredClone(catalog.get(item.label));added++;changed.add(article.slug);}}
  const labels=recipeIngredients[article.slug];
  if(labels){article.shoppingItems=labels.map((label,index)=>({id:'recipe-'+(index+1),label,role:extraRoles[label]||sources.get(label)?.role||'본문에서 설명한 재료입니다. 사용할 양과 보관 방법을 확인하세요.',group:tools.has(label)?'common':seasoning.has(label)?'seasoning':'main',...(catalog.has(label)?{affiliate:structuredClone(catalog.get(label))}:{})}));changed.add(article.slug);}
  if(changed.has(article.slug))article.updatedAt=now;
 }
 const missing=store.articles.flatMap(a=>[...(a.checklist||[]),...(a.shoppingItems||[])].filter(item=>!item.affiliate?.reviewed).map(item=>({slug:a.slug,label:item.label})));
 return {added,changedArticles:changed.size,missing};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const store=JSON.parse(fs.readFileSync('data/weekend-prep.json','utf8')),primary=JSON.parse(fs.readFileSync('data/prep-ingredient-completion-20261111.json','utf8')).candidates;
 const followup=fs.existsSync('data/prep-ingredient-followup-20261111.json')?JSON.parse(fs.readFileSync('data/prep-ingredient-followup-20261111.json','utf8')).candidates:[];
 const final=fs.existsSync('data/prep-ingredient-final-20261111.json')?JSON.parse(fs.readFileSync('data/prep-ingredient-final-20261111.json','utf8')).candidates:[];
 const registered=JSON.parse(fs.readFileSync('data/prep-registered-products-20261111.json','utf8'));
 const result=applyIngredientCatalog(store,[...primary,...followup,...final],{registered});
 if(result.missing.length){console.log(JSON.stringify({ready:false,missing:result.missing.length,labels:[...new Set(result.missing.map(i=>i.label))]}));process.exitCode=1;}
 else {fs.writeFileSync('data/weekend-prep.json',JSON.stringify(store,null,2)+'\n');console.log(JSON.stringify({ready:true,...result}));}
}
