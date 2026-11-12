import {currentProducts} from './sharelink-policy.mjs';
import {homeDealGroup} from '../scripts/sharelink/home-deals.mjs';
import {selectWinterTossHero} from './toss-winter-hero.mjs';

export const topDealGroups=[
 {id:'all',label:'골고루'},
 {id:'snack',label:'간식·음료'},
 {id:'meal',label:'식사·조리'}
];

const nonFood=/보냉백|보냉가방|피크닉매트|돗자리|휴대용수저|용기|보관함|수납|조리도구|조리기구|냄비|프라이팬|냉장고|에어프라이어|커피잔|커피머신|전기포트|라면포트|멀티포트|텀블러|찜기|과일칼|커터|깎이|착즙기|믹서기|붕어빵.*(?:틀|기계|앙금|반죽|믹스)/;
const fruit=/키위|사과|감귤|오렌지|바나나|딸기|샤인머스캣/;
const wholeFruit=/(?:키위|사과|감귤|오렌지|바나나|딸기|샤인머스캣)(?:,|\s*\d|\s*(?:점보|특대|대과|소과|중과))/;
const drinks=/생수|샘물|워터|두유|우유|탄산|콜라|주스|쥬스|커피|에너지드링크|타트체리/;
const sweets=/과자|견과|식빵|버터바|낭시에/;

function family(product) {
 const name=product.name||'';
 // Meal names can contain meat or kimchi, so classify the dish first.
 if(/볶음밥|즉석밥|햇반|라면|우동|사발면|컵면|누룽지/.test(name))return 'rice';
 if(/국밥|찌개|전골|시래기국|스프(?:\s|,|$)|어묵|오뎅/.test(name))return 'soup';
 if(/삼겹살|목살|소고기|토시살|안창살|꼬들살|불고기|닭갈비|닭꼬치/.test(name))return 'meat';
 if(/순대|핫바|핫도그|만두|소시지|붕어빵|호빵|군고구마|떡볶이|김치|명란젓|전복장|다슬기|김자반|김구이|감태/.test(name))return 'side';
 if(drinks.test(name))return 'drink';
 if(wholeFruit.test(name)||sweets.test(name))return 'snack';
 return 'side';
}

export function topDealGroup(product) {
 return ['drink','snack'].includes(family(product))?'snack':'meal';
}

export function topDealPreparation(product) {
 const name=product.name||'';
 if(/냉동/.test(name))return '냉동 · 보관 방법 확인';
 if(/냉장/.test(name))return '냉장 · 보관 방법 확인';
 if(fruit.test(name)&&!drinks.test(name))return '손질·보관 방법 확인';
 if(/커피|라면|사발면|컵면|스프|누룽지/.test(name))return '물·조리 방법 확인';
 return topDealGroup(product)==='snack'?'보관 방법 확인':'보관·조리 방법 확인';
}

export function topDealOption(product) {
 const name=typeof product.name==='string'?product.name.trim():'';
 const option=typeof product.option==='string'?product.option.trim():'';
 if(option&&option!==name)return option;
 // Preserve the seller's literal option text instead of inventing servings.
 return name.includes(',')?name.slice(name.indexOf(',')+1).trim():option;
}

function balancedProducts(products) {
 const families=['drink','snack','rice','soup','meat','side'];
 const buckets=families.map(key=>products.filter(p=>family(p)===key).sort((a,b)=>a.price-b.price||a.id-b.id));
 const result=[];
 for(let index=0;buckets.some(bucket=>bucket[index]);index++){
  for(const bucket of buckets)if(bucket[index])result.push(bucket[index]);
 }
 return result;
}

function isOriginalTossLink(link) {
 try { const url=new URL(link);return url.protocol==='https:'&&url.hostname==='toss.shopping'; }
 catch { return false; }
}
// Only provider-confirmed, unexpired daily deals belong in the global strip.
export function selectTopDeals(feed, now, {isHome=false}={}) {
 const heroIds=isHome?new Set(selectWinterTossHero(feed,now).map(p=>p.id)):new Set();
 const products=currentProducts(feed, now).filter(p =>
  p&&Number.isInteger(p.id)&&p.isSoldOut!==true&&!heroIds.has(p.id)&&
  Number.isFinite(Date.parse(p.endAt)) && Date.parse(p.endAt) > now &&
  Number.isFinite(p.discountRate) && p.discountRate > 0 && p.discountRate <= 100 &&
  typeof p.name==='string'&&(homeDealGroup(p.name)||wholeFruit.test(p.name))&&!nonFood.test(p.name)&&
  isOriginalTossLink(p.links?.home) &&
  typeof p.image === 'string' && p.image.startsWith('https://') &&
  Number.isFinite(p.price) && p.price >= 0
 );
 return balancedProducts([...new Map(products.map(p=>[p.id,p])).values()]);
}
