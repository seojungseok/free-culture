import Link from 'next/link';
import Image from 'next/image';
import PrepImage from './PrepImage';
import PrepChecklist from './PrepChecklist';
import type {PrepArticle as Article,PrepProduct} from '@/lib/weekend-prep/types';
import {prepCategoryLabel} from '@/lib/weekend-prep/data';

function dishName(title:string){
 return title.split('|')[0].replace(/^(가을 대표 요리|가을 캠핑|캠핑)\s*/,'').replace(/\s*재료 체크리스트.*$/,'').trim();
}

function quickCookingGuide(name:string){
 const soupLike=/(탕|찌개|전골|라면|수제비|떡볶이)/.test(name);
 return soupLike
  ? `${name}은 국물 재료와 익는 데 시간이 필요한 주재료를 먼저 끓이고, 빨리 익는 채소·두부·면·대파는 마무리에 더해 보세요. 간은 마지막에 확인해 조절하고, 제품별 손질·가열 방법은 포장 안내를 우선으로 확인하세요.`
  : `${name}은 주재료와 채소를 쓰기 좋게 준비한 뒤, 사용하는 팬이나 그릴을 예열해 익는 속도에 맞춰 넣어 보세요. 간과 소스는 마지막에 조절하고, 제품별 손질·가열 방법은 포장 안내를 우선으로 확인하세요.`;
}

type CookingGuideData={title:string;steps:string[];links:Record<string,string>};
const cookingGuides:Record<string,CookingGuideData>={
 'autumn-flower-crab-soup-ingredient-checklist':{title:'간단한 꽃게탕 끓이는 방법',links:{'냉동 꽃게':'9603803528','국물육수 다시팩':'57577364','매운탕 양념':'8574770164'},steps:['냉동 꽃게는 포장 안내에 따라 해동합니다. 손질이 필요한 경우 흐르는 물에 헹군 뒤 아가미와 배딱지를 정리하고, 집게는 조리 가위로 잘라 준비하세요.','냄비에 물과 국물육수 다시팩을 넣어 포장에 안내된 방식으로 국물 바탕을 냅니다. 무를 곁들인다면 먼저 익혀 주세요.','국물이 끓으면 꽃게를 넣고 완전히 익을 때까지 끓입니다. 매운탕 양념은 한 번에 다 넣지 말고 일부부터 풀어 간을 맞춰 보세요.','애호박과 대파를 넣고 한소끔 더 끓인 뒤, 미나리는 불을 끄기 직전에 더합니다. 마지막에 국물 간을 확인해 조절하세요.']},
 'camping-fishcake-soup-ingredient-checklist':{title:'간단한 어묵탕 끓이는 방법',links:{'모둠 어묵':'8682238562','국물육수 다시팩':'57577364','잔치국수 분말':'6168487275','대파':'6528172171'},steps:['모둠 어묵은 포장 안내에 따라 준비하고, 대파는 어슷하게 썹니다.','냄비에 물과 국물육수 다시팩을 넣어 국물 바탕을 낸 뒤 어묵을 넣고 끓입니다.','어묵이 충분히 데워지면 대파를 넣고, 잔치국수 분말은 국물 맛을 보며 조금씩 더하세요.','어묵의 해동·가열과 분말 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'camping-budae-jjigae-ingredient-checklist':{title:'간단한 부대찌개 끓이는 방법',links:{'부대찌개 구성':'7380618503','슬라이스 햄':'8243714135','국물육수 다시팩':'57577364','체다 슬라이스 치즈':'6959448489'},steps:['부대찌개 구성과 슬라이스 햄의 포장 안 재료를 먼저 확인하고, 채소는 먹기 좋게 썹니다.','냄비에 물과 국물육수 다시팩을 넣어 끓인 뒤 햄과 준비한 재료를 넣습니다.','재료가 충분히 데워지면 체다 슬라이스 치즈를 올려 녹이고, 국물 간을 확인해 조절하세요.','구성품·가열 방법과 치즈 사용 여부는 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'camping-beef-mushroom-hotpot-ingredient-checklist':{title:'간단한 소고기 버섯전골 끓이는 방법',links:{'소고기 샤브샤브 구성':'7679993842','전골용 모둠버섯':'6211502021','국물육수 다시팩':'57577364','대파':'6528172171'},steps:['소고기 샤브샤브 구성과 전골용 모둠버섯의 포장 상태를 확인하고, 채소는 먹기 좋게 준비합니다.','냄비에 물과 국물육수 다시팩을 넣어 국물 바탕을 낸 뒤 버섯과 채소를 먼저 넣습니다.','국물이 끓으면 소고기를 한 점씩 넣고, 대파는 마무리에 더해 주세요.','고기의 보관·가열과 육수 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'camping-seafood-hotpot-ingredient-checklist':{title:'간단한 해물탕 끓이는 방법',links:{'모둠해물탕':'7853820445','손질 오만둥이':'8630066299','국물육수 다시팩':'57577364','매운탕 양념':'8574770164'},steps:['모둠해물탕과 손질 오만둥이는 포장 안내에 따라 해동·준비하고, 채소는 씻어 둡니다.','냄비에 물과 국물육수 다시팩을 넣어 끓인 뒤 해물과 채소를 넣습니다.','국물이 끓으면 매운탕 양념을 일부부터 풀어 간을 확인하고, 미나리는 마지막에 더하세요.','해물의 해동·가열과 양념 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'camping-seafood-ramen-ingredients':{title:'간단한 해물라면 끓이는 방법',links:{'봉지라면':'7958974','모둠해물':'9322705755','대파':'6528172171'},steps:['모둠해물은 포장 안내에 따라 준비하고, 대파는 송송 썹니다.','냄비에 물을 끓인 뒤 봉지라면의 면과 스프를 넣습니다.','면이 풀리기 시작하면 모둠해물을 넣고, 대파는 마무리에 더해 주세요.','해물의 해동·가열과 라면의 물 양은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'camping-mussel-soup-ingredients':{title:'간단한 홍합탕 끓이는 방법',links:{'손질 홍합살':'7430379988','육수 다시팩':'57577364','양파':'9457848435','대파':'6528172171'},steps:['손질 홍합살은 포장 안내에 따라 준비하고, 양파와 대파는 먹기 좋게 썹니다.','냄비에 물과 육수 다시팩을 넣어 국물 바탕을 낸 뒤 양파를 먼저 넣습니다.','국물이 끓으면 홍합살을 넣고 충분히 데운 뒤 대파를 더하세요.','홍합살의 해동·가열과 육수 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'camping-kimchi-fried-rice-ingredients':{title:'간단한 김치볶음밥 만드는 방법',links:{'배추김치':'7692122826','즉석밥':'7488621084','달걀':'8326848865','김가루':'9468295724'},steps:['배추김치와 대파는 잘게 썰고, 즉석밥은 포장 안내에 따라 준비합니다.','팬에 식용유를 두르고 김치와 대파를 먼저 볶아 수분을 정리합니다.','밥을 넣어 고루 볶고, 달걀은 따로 익혀 곁들이거나 함께 섞어 주세요.','마지막에 김가루를 더해 마무리하고, 즉석밥과 달걀의 가열 안내는 포장을 우선으로 확인하세요.']},
 'camping-squid-stir-fry-ingredients':{title:'간단한 오징어볶음 만드는 방법',links:{'손질 오징어':'9169365991','오징어볶음 소스':'9262718994','양파':'9457848435','대파':'6528172171'},steps:['손질 오징어는 포장 안내에 따라 준비하고, 양파와 대파는 먹기 좋게 썹니다.','팬을 예열해 양파를 먼저 볶고 손질 오징어를 넣어 익힙니다.','오징어볶음 소스는 한 번에 많이 넣지 말고 조금씩 넣어 고루 볶으세요.','오징어의 해동·가열과 소스 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'camping-chicken-skewer-ingredients':{title:'간단한 닭꼬치구이 만드는 방법',links:{'닭꼬치·염통 모둠꼬치':'9627651159','바비큐 양념소스':'7614412503','새송이버섯':'8655440206','파프리카':'7935223581'},steps:['닭꼬치·염통 모둠꼬치는 포장 안내에 따라 해동하고, 새송이버섯과 파프리카는 먹기 좋게 썹니다.','예열한 그리들에 꼬치와 채소를 올려 뒤집어 가며 익힙니다.','닭꼬치가 충분히 익은 뒤 바비큐 양념소스를 발라 한 번 더 구워 주세요.','꼬치의 해동·가열과 소스 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'camping-kimchi-pancake-ingredients':{title:'간단한 김치전 만드는 방법',links:{'배추김치':'7692122826','부침가루':'6269223291','대파':'6528172171','식용유':'487322'},steps:['배추김치와 대파는 잘게 썰고, 부침가루는 포장 안내에 따라 반죽합니다.','팬을 예열해 식용유를 두르고 반죽을 얇게 펼칩니다.','가장자리가 익으면 뒤집어 두 면을 고르게 익혀 주세요.','부침가루의 물 비율과 가열 방법은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'camping-pork-belly-bbq-ingredients':{title:'간단한 삼겹살 바비큐 굽는 방법',links:{'구이용 삼겹살':'9668476214','새송이버섯':'8655440206','파프리카':'7935223581','배추김치':'7692122826'},steps:['구이용 삼겹살은 포장 안내에 따라 준비하고, 새송이버섯과 파프리카는 먹기 좋게 손질합니다.','예열한 그리들에 삼겹살을 올려 뒤집어 가며 충분히 익힙니다.','기름이 너무 많으면 정리한 뒤 채소와 배추김치를 곁들여 구워 주세요.','고기의 보관·가열 방법은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'camping-tofu-kimchi-ingredients':{title:'간단한 두부김치 만드는 방법',links:{'부침용 두부':'7867851377','배추김치':'7692122826','양파':'9457848435','대파':'6528172171'},steps:['배추김치·양파·대파는 먹기 좋게 썰고, 부침용 두부는 포장 상태를 확인합니다.','팬에 식용유를 두르고 양파와 김치를 먼저 볶습니다.','두부는 포장 안내에 따라 데우거나 굽고, 볶은 김치를 곁들여 담아 주세요.','두부의 보관·가열과 김치 조리 방법은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-camping-pork-kimchi-stew-ingredient-checklist':{title:'간단한 돼지고기 김치찌개 끓이는 방법',links:{'생 돼지고기':'7265684367','배추김치':'7692122826','두부':'7867851377','국물육수 다시팩':'57577364'},steps:['생 돼지고기와 배추김치는 포장 상태를 확인하고, 두부와 채소는 먹기 좋게 준비합니다.','냄비에 돼지고기와 김치를 먼저 볶은 뒤 물과 국물육수 다시팩을 넣습니다.','국물이 끓으면 채소를 넣고, 두부는 모양이 부서지지 않게 마무리에 더해 주세요.','고기의 가열·보관과 육수 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-camping-doenjang-stew-ingredient-checklist':{title:'간단한 된장찌개 끓이는 방법',links:{'재래식 된장':'7573349147','두부':'7867851377','애호박':'8443644467','국물육수 다시팩':'57577364'},steps:['애호박·양파·버섯과 두부를 먹기 좋게 준비합니다.','냄비에 물과 국물육수 다시팩을 넣어 끓인 뒤 재래식 된장을 조금씩 풀어 주세요.','채소를 먼저 넣고 익힌 다음 두부를 더해 한소끔 끓입니다.','된장과 육수의 사용량, 두부의 보관·가열은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-camping-perilla-mushroom-soup-ingredient-checklist':{title:'간단한 들깨버섯탕 끓이는 방법',links:{'들깨가루':'7290581164','모둠버섯':'6211502021','두부':'7867851377','국물육수 다시팩':'57577364'},steps:['모둠버섯과 채소는 먹기 좋게 준비하고, 두부는 마지막에 넣기 좋게 썹니다.','냄비에 물과 국물육수 다시팩을 넣어 끓인 뒤 버섯과 채소를 넣습니다.','들깨가루는 국물에 조금씩 풀어 넣고, 두부를 더해 한소끔 끓여 주세요.','들깨가루·육수의 사용량과 두부 보관은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-camping-potato-sujebi-ingredient-checklist':{title:'간단한 감자수제비 끓이는 방법',links:{'감자':'9656363105','생수제비':'1221150659','국물육수 다시팩':'57577364','대파':'6528172171'},steps:['감자·애호박·양파는 먹기 좋게 썰고, 생수제비는 포장 상태를 확인합니다.','냄비에 물과 국물육수 다시팩, 감자를 넣어 먼저 끓입니다.','감자가 익기 시작하면 생수제비를 하나씩 넣고, 애호박과 대파를 마무리에 더하세요.','생수제비의 가열과 육수 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-camping-shrimp-butter-grill-ingredient-checklist':{title:'간단한 새우버터구이 만드는 방법',links:{'생 새우살':'1761375156','무염버터':'7847571181','다진마늘':'7673804291','양파':'9457848435'},steps:['생 새우살은 포장 안내에 따라 준비하고, 양파와 버섯은 먹기 좋게 썹니다.','예열한 팬에 식용유를 두르고 양파·버섯을 먼저 익힙니다.','새우살을 넣어 충분히 익힌 뒤 무염버터와 다진마늘을 더해 향을 냅니다.','새우의 해동·가열과 버터 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-camping-mackerel-potato-braise-ingredient-checklist':{title:'간단한 고등어감자조림 만드는 방법',links:{'손질 고등어':'8311251159','감자':'9656363105','진간장':'7235302196','고추장':'8188252337'},steps:['손질 고등어는 포장 안내에 따라 준비하고, 감자와 양파는 비슷한 크기로 썹니다.','냄비 바닥에 감자와 양파를 깔고 물, 진간장, 고추장을 넣어 먼저 끓입니다.','감자가 익기 시작하면 고등어를 올리고, 살이 부서지지 않게 뒤집는 횟수를 줄여 조립니다.','고등어의 해동·가열과 양념 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-camping-chicken-potato-stew-ingredient-checklist':{title:'간단한 닭볶음탕 끓이는 방법',links:{'닭볶음탕용 생닭':'1628662667','감자':'9656363105','고추장':'8188252337','진간장':'7235302196'},steps:['닭볶음탕용 생닭은 포장 안내에 따라 준비하고, 감자와 양파는 먹기 좋게 썹니다.','냄비에 닭·감자·양파와 물을 넣고 고추장·진간장을 조금씩 풀어 끓입니다.','닭과 감자가 충분히 익으면 대파를 더하고, 마지막에 국물 간을 확인하세요.','생닭의 보관·가열과 양념 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-camping-tteokbokki-ingredient-checklist':{title:'간단한 떡볶이 만드는 방법',links:{'밀떡':'1883548582','모둠어묵':'8682238562','고추장':'8188252337','국물육수 다시팩':'57577364'},steps:['밀떡과 모둠어묵은 포장 상태를 확인하고, 양파와 대파는 먹기 좋게 썹니다.','냄비에 물과 국물육수 다시팩을 넣고, 고추장은 조금씩 풀어 양념 국물을 만듭니다.','국물이 끓으면 밀떡과 어묵을 넣고 바닥에 눌지 않게 저어가며 익힙니다.','떡·어묵의 가열과 양념·육수 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-camping-zucchini-pancake-ingredient-checklist':{title:'간단한 애호박전 만드는 방법',links:{'애호박':'8443644467','달걀':'8326848865','부침가루':'6269223291','식용유':'487322'},steps:['애호박은 비슷한 두께로 썰고, 달걀과 부침가루는 포장 상태를 확인합니다.','애호박에 부침가루를 얇게 묻히고 달걀물을 입힙니다.','예열한 팬에 식용유를 두른 뒤 두 면을 노릇하게 익혀 주세요.','달걀 보관과 부침가루 사용 방법은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-camping-corn-cheese-ingredient-checklist':{title:'간단한 버터콘치즈 만드는 방법',links:{'스위트콘':'1909538','슬라이스 체다치즈':'6959448489','무염버터':'7847571181','양파':'9457848435'},steps:['스위트콘은 물기를 빼고, 양파와 선택 재료는 잘게 썹니다.','예열한 팬에 무염버터를 녹이고 양파와 스위트콘을 먼저 익힙니다.','불을 낮춘 뒤 슬라이스 체다치즈를 올려 녹이고, 바닥이 눋지 않게 살펴보세요.','옥수수·치즈의 보관·가열과 버터 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']}
};

function CookingGuide({article,products}:{article:Article;products:PrepProduct[]}){
 const guide=cookingGuides[article.slug];
 if(!guide)return <section className="prep-cooking-intro" aria-label="간단한 요리 방법"><h2>간단한 {dishName(article.title)} 만드는 방법</h2><p>{quickCookingGuide(dishName(article.title))}</p></section>;
 const productMap=new Map(products.map(p=>[p.id,p]));
 const terms=Object.keys(guide.links).sort((a,b)=>b.length-a.length);
 const pattern=new RegExp(`(${terms.map(term=>term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})`,'g');
 const linkText=(text:string)=>text.split(pattern).map((part,index)=>{const p=productMap.get(guide.links[part]);return p?<a key={`${part}-${index}`} href={p.affiliateUrl} target="_blank" rel="sponsored noopener">{part}</a>:part;});
 return <section className="prep-cooking-intro" aria-label={guide.title}><h2>{guide.title}</h2><ol className="prep-cooking-steps">{guide.steps.map((step,index)=><li key={index}>{linkText(step)}</li>)}</ol><p className="prep-cooking-note">해동·손질·가열과 양념 사용량은 구매한 제품의 실제 포장 안내를 우선으로 확인하세요.</p></section>;
}

export default function PrepArticle({article:a,products,preview=false}:{article:Article;products:PrepProduct[];preview?:boolean}){
 const chosen=products.filter(p=>a.productIds.includes(p.id));
 const linked=new Set<string>();
 const carded=new Set<string>();
 const actionLabel=a.salesFormat==='food-recipe'?'쿠팡에서 재료 확인하기':a.salesFormat==='camping-gear'?'쿠팡에서 캠핑용품 확인하기':'쿠팡에서 제품 확인하기';
 return <article className="prep-article">
  <nav aria-label="현재 위치"><Link href="/">홈</Link> / <Link href="/weekend-prep">준비 가이드</Link> / {prepCategoryLabel(a.category,a)}</nav>
  {preview&&<p className="prep-notice">검토용 초안 · 아직 공개되지 않은 글입니다.</p>}
  <p className="prep-disclosure">이 글에는 제휴 링크가 포함되어 있습니다. 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있습니다.</p>
  <p className="prep-eyebrow">{prepCategoryLabel(a.category,a)}</p><h1>{a.title}</h1><p className="prep-lead">{a.description}</p>
  <PrepImage photo={a.cover} products={chosen} priority />
  {a.salesFormat==='food-checklist'&&<CookingGuide article={a} products={chosen}/>}
  {a.salesFormat==='food-checklist'&&a.checklist&&<PrepChecklist slug={a.slug} items={a.checklist} products={chosen} dishName={dishName(a.title)}/>}
  {a.sections.map((s,i)=>{
   const sectionProducts=s.productIds.map(id=>chosen.find(p=>p.id===id)).filter((p):p is PrepProduct=>!!p&&!a.quietProductIds?.includes(p.id)&&!carded.has(p.id));
   sectionProducts.forEach(p=>carded.add(p.id));
   return <section key={i}><h2>{s.heading}</h2>{s.text.split('\n').filter(Boolean).map((raw,j)=>{
   const isPoint=raw.startsWith('• ');const line=isPoint?raw.slice(2):raw;const parts:React.ReactNode[]=[line];
   for(const id of s.productIds){const p=chosen.find(p=>p.id===id);if(!p||linked.has(id))continue;for(let k=0;k<parts.length;k++){const part=parts[k];if(typeof part!=='string'||!part.includes(p.name))continue;const pos=part.indexOf(p.name);parts.splice(k,1,part.slice(0,pos),<a key={id} href={p.affiliateUrl} target="_blank" rel="sponsored noopener">{p.name}</a>,part.slice(pos+p.name.length));linked.add(id);break;}}
   return <p className={isPoint?'prep-point':undefined} key={j}>{parts}</p>;
  })}{a.salesFormat!=='food-checklist'&&sectionProducts.length>0&&<div className="prep-buy-grid">{sectionProducts.map(p=><a className="prep-buy-card" key={p.id} href={p.affiliateUrl} target="_blank" rel="sponsored noopener"><Image src={p.image} alt="" width={74} height={74} unoptimized/><span><strong>{p.name}</strong><small>{actionLabel} →</small></span></a>)}</div>}{s.image&&<PrepImage photo={s.image} products={chosen}/>}</section>})}
  <section className="prep-image-links"><h2>사진 속 +로 상품 확인하기</h2><p>사진에 표시된 +를 누르면 해당 재료나 제품의 쿠팡 페이지가 열립니다.</p></section>
  {!!a.internalLinks.length&&<nav aria-label="함께 읽기"><h2>함께 보면 좋은 곳</h2>{a.internalLinks.map(l=><p key={l.href}><Link href={l.href}>{l.label} →</Link></p>)}</nav>}
  <p className="prep-ai-note">{a.imageConnectionNote || '이 글의 이미지는 AI를 활용해 제작했습니다.'}</p>
 </article>;
}
