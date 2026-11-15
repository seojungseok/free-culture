import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const read=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const write=async(file,value)=>fs.writeFile(file,JSON.stringify(value,null,2)+'\n');
const plan=await read('data/winter-camping-menu-plan-20261115.json');
plan.menus.find(menu=>menu.key==='gambas').category='기타 요리';
await write('data/winter-camping-menu-plan-20261115.json',plan);
const images=await read('data/winter-camping-images-20261115.json');
const store=await read('data/weekend-prep.json');
const batchSlugs=new Set(plan.menus.map(menu=>menu.slug));
const previous=store.articles.filter(article=>!batchSlugs.has(article.slug));
const catalog=new Map();
for(const article of previous)for(const item of [...(article.checklist||[]),...(article.shoppingItems||[])]){
 if(item.affiliate?.reviewed&&!catalog.has(item.label))catalog.set(item.label,item.affiliate);
}
const checkedAt=new Date().toISOString();
const safetyUrl='https://www.foodsafetykorea.go.kr/portal/board/boardDetail.do?bbs_no=bbs401&menu_no=4419&ntctxt_no=1068744';
const safetySource={title:'식품안전나라 · 육류와 어패류의 충분한 가열',url:safetyUrl,checkedAt};
const stepAlts={
 'mille-feuille-nabe':'배추·깻잎·얇은 소고기를 겹쳐 전골냄비에 세운 모습',
 'mandu-jeongol':'만두 사이로 육수를 끼얹으며 전골을 익히는 장면',
 'dakhanmari':'닭한마리 국물에서 익힌 닭 조각을 국자로 드는 장면',
 'sundubu-jjigae':'붉은 찌개 국물에 순두부를 큰 덩어리로 넣은 모습',
 'gochujang-jjigae':'감자와 돼지고기가 들어간 고추장찌개의 익힘을 확인하는 장면',
 'beef-radish-soup':'맑은 소고기뭇국에서 반투명하게 익은 무를 확인하는 모습',
 'tteok-mandu-soup':'완전히 익힌 떡만둣국을 그릇에 덜어 담는 장면',
 'kimchi-udon':'김치·어묵 국물에서 익은 우동 면을 들어 올린 모습',
 'pork-suyuk':'충분히 삶은 통삼겹살을 먹기 좋게 썬 모습',
 'oyster-radish-soup':'무 육수에서 굴을 속까지 익히는 장면',
 'dongtae-tang':'동태 토막과 무·두부 위로 국물을 끼얹는 장면',
 'gambas':'마늘과 새우를 올리브유에 넣어 가열하는 감바스 조리 장면',
 'beef-sprouts-stir-fry':'우삼겹을 먼저 익힌 팬에 숙주를 나누어 넣어 볶는 모습',
 'steamed-eggs':'약한 불에서 가운데까지 익힌 계란찜을 떠 확인하는 장면',
 'sweet-potato-cheese':'뚜껑을 사용해 익힌 고구마 위의 체다치즈를 녹이는 모습',
};
const proseEdits=new Map([
 ['겹 사이에 얇게 펴 넣을 양념하지 않은 고기입니다. 얼큰한 육수가 든 밀키트와는 구분합니다.','배추 사이에 얇게 펴 넣을 양념하지 않은 고기입니다. 뭉친 부분을 풀어 한 겹씩 사용하세요.'],
 ['국물에 풀어 넣습니다. 통마늘을 쓰는 다른 레시피와 사용량을 구분하세요.','국물에 풀어 넣어 닭과 함께 익힙니다.'],
 ['통으로 넣을 마늘입니다. 다진 마늘 제품과 구분합니다.','껍질을 벗겨 통으로 넣습니다.'],
 ['반으로 가른 고구마 위에 나누어 올립니다. 피자치즈처럼 길게 늘어나는 질감을 약속하지 않습니다.','반으로 가른 고구마 위에 나누어 올립니다. 얇게 잘라 올리면 고르게 녹이기 좋습니다.'],
 ['수육용 앞다리살로 바꿀 수 있지만 지방 비율과 두께가 다르므로 같은 시간에 같은 식감이 된다고 보장할 수 없습니다.','수육용 앞다리살로 바꾸면 지방이 적고 두께가 달라 익는 속도와 식감도 달라집니다.'],
 ['이 구성은 닭과 감자를 먼저 먹는 한 냄비입니다.','닭과 감자를 먼저 건져 먹은 뒤 남은 국물에 칼국수를 더할 수 있습니다.'],
 ['고구마 위를 물에 잠기게 하거나 뜨거운 기름이 많은 팬에 물을 붓는 방식과 구분하세요. 이 구성은 버터를 얇게 바른 팬을 약불로 쓰는 간식입니다.','물은 버터를 얇게 바른 팬의 빈 곳에만 소량 넣습니다. 뜨거운 기름이 많이 고인 팬에 물을 붓지 마세요.'],
 ['생고구마와 이미 익힌 고구마의 보관 방법을 구분합니다. ',''],
]);
const created=[];const report=[];
for(const menu of plan.menus){
 const file='data/winter-camping-drafts-20261115/'+menu.key+'.json';
 let raw=await fs.readFile(file,'utf8');for(const [before,after]of proseEdits)raw=raw.replaceAll(before,after);
 const draft=JSON.parse(raw);await write(file,draft);
 const photos=Object.fromEntries(['cover','prep','step'].map(kind=>{
  const record=images.images.find(image=>image.slug===menu.slug&&image.kind===kind);
  if(!record)throw Error('Missing image '+menu.slug+' '+kind);
  const alt=kind==='cover'?menu.dish+' 완성 · 겨울 캠핑 식탁':kind==='prep'?menu.dish+'에 사용할 재료를 종류별로 나누어 준비한 모습':stepAlts[menu.key];
  return [kind,{url:record.url,alt,width:1200,height:800,generated:true,prompt:record.prompt,reviewed:true}];
 }));
 const shoppingItems=draft.ingredients.map((ingredient,index)=>({
  id:'winter-'+(index+1),label:ingredient.label,quantity:ingredient.quantity,
  role:ingredient.role,group:ingredient.group,required:!ingredient.quantity.includes('선택'),
  ...(catalog.has(ingredient.catalogLabel)?{affiliate:structuredClone(catalog.get(ingredient.catalogLabel))}:{}),
 }));
 const preparation={title:draft.before.title,text:draft.before.text};
 const recipeSteps=[preparation,...draft.steps];
 const sources=[...draft.sources.map(([title,url])=>({title,url,checkedAt})),safetySource];
 if(menu.key==='steamed-eggs')sources.push({title:'FoodSafety.gov · 달걀 요리 중심온도',url:'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures',checkedAt});
 const introText=draft.equipment+'\n'+draft.liquids.join(' · ')+'\n계량은 1큰술 15mL, 1작은술 5mL 기준입니다. 재료의 크기와 양념의 염도에 따라 마지막 간을 조절하세요. 취사는 캠핑장에서 허용한 야외 공간에서 하고, 버너나 화로를 밀폐된 텐트 안에 들이지 않습니다.';
 const article={
  slug:menu.slug,title:menu.title,description:draft.description,category:'캠핑요리 가이드',
  cookingCategory:menu.category,coverLabel:menu.label,dishName:menu.dish,
  status:'published',publishAt:checkedAt,updatedAt:checkedAt,reviewed:true,
  cover:photos.cover,shoppingItems,
  recipe:{servings:draft.servings,ingredients:[...draft.ingredients.map(i=>i.label+' '+i.quantity),...draft.liquids],steps:recipeSteps},
  sections:[
   {heading:draft.servings+' 기준 · 물과 조리 도구',text:introText},
   {heading:draft.before.title,text:draft.before.text,image:photos.prep},
   ...draft.steps.map((step,index)=>({heading:(index+1)+'단계 · '+step.title,text:step.text,...(index===1?{image:photos.step}:{})})),
   {heading:draft.fix.title,text:draft.fix.text},
   {heading:draft.alternative.title,text:draft.alternative.text},
   {heading:draft.storage.title,text:draft.storage.text},
  ],sources,
  internalLinks:[...draft.related.map(slug=>{const target=plan.menus.find(m=>m.slug===slug)||previous.find(a=>a.slug===slug);if(!target)throw Error('Missing related article '+slug);return {href:'/weekend-prep/'+slug,label:target.title};}),{href:'/camping',label:'취사 가능한 캠핑장 찾아보기'}],
 };
 if(article.description.length>80)throw Error('Description over80 '+menu.slug);
 if(shoppingItems.filter(i=>i.affiliate).length<3)throw Error('Too few existing ingredient matches '+menu.slug);
 created.push(article);
 report.push({slug:menu.slug,title:menu.title,subtype:menu.category,linkedIngredients:shoppingItems.filter(i=>i.affiliate).map(i=>i.label),ordinaryIngredients:shoppingItems.filter(i=>!i.affiliate).map(i=>i.label),images:[photos.cover,photos.prep,photos.step].map(i=>i.url),sources:sources.map(s=>s.url)});
}
store.articles=[...created,...previous];
await write('data/weekend-prep.json',store);
const sizes=await read('data/weekend-prep-static-images.json');
for(const record of images.images)sizes[record.url]=[320,640,1200];
await write('data/weekend-prep-static-images.json',sizes);
const beforeHashes=Object.fromEntries(previous.map(a=>[a.slug,crypto.createHash('sha256').update(JSON.stringify(a)).digest('hex')]));
await write('data/winter-camping-publication-review-20261115.json',{version:1,checkedAt,previousCommit:'4478c048533b6278e0b96206806080a296c8ef23',previousArticles:beforeHashes,recipeSlugs:created.map(a=>a.slug),visualReview:{reviewed:true,scenes:45,note:'All 45 distinct scenes inspected in three contact sheets; sundubu ingredient image replaced to show silken soft tofu. Recipe illustrations are not exact commercial product reproductions.'},newProductLookup:{requestsMade:0,status:'Stopped before requests because existing shared lock persisted. No lock was changed. Existing verified original ingredient links reused; unmatched ingredients have no purchase URL.'},articles:report});
console.log(JSON.stringify({created:created.length,total:store.articles.length,images:images.images.length,existingPreserved:previous.length,linked:report.reduce((n,r)=>n+r.linkedIngredients.length,0),ordinary:report.reduce((n,r)=>n+r.ordinaryIngredients.length,0)}));
