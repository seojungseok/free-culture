import {currentProducts,freshnessMs} from './sharelink-policy.mjs';
import {homeProductAds} from './home-product-ads.mjs';

export function isShoppingArticle(path){
 return /^\/(?:event|festivals|city-tour|playgrounds|accessible-travel|pet-travel|winter-travel|weekend-prep)\/[^/]+\/?$/.test(path)
  || /^\/(?:places\/spot|food\/spot|course\/c|date\/c|kids\/c|classes\/detail|camping\/collections|experiences\/(?:family|youth|science|rural))\/[^/]+\/?$/.test(path)
  || /^\/camping\/\d+\/?$/.test(path);
}

const guideCards=homeProductAds.map(p=>({id:p.id,name:p.name,href:p.reviewedHref,image:'/ads/home-products/'+p.id+'-sm.webp',price:null,endAt:undefined,topic:'food',guide:true}));
const snack=/호떡|호빵|붕어빵|두유|생수|율무차|유자차|생강차|과자|견과|음료/;
const meal=/삼겹살|목살|어묵|순대|호떡|떡볶이|만두|햇반|라면|김밥|볶음밥/;
const warmer=/핫팩|장갑|넥워머|율무차|생강차|유자차/;
function original(link){return typeof link==='string'&&/^https:\/\/toss\.shopping\/_m\/[a-zA-Z0-9_-]+$/.test(link);}
function rank(p,path,title){
 const pair=['삼겹살','목살','순대','어묵','호떡','호빵','붕어빵','떡볶이','만두','라면','마늘','고춧가루','생수','핫팩','커피','유자차'].find(t=>title.includes(t)&&p.name.includes(t));
 if(pair)return 0;
 if(/^\/(?:weekend-prep|camping|food)/.test(path))return meal.test(p.name)?1:snack.test(p.name)?2:3;
 if(path.startsWith('/winter-travel/'))return warmer.test(p.name)?1:snack.test(p.name)?2:3;
 return snack.test(p.name)?1:warmer.test(p.name)?2:3;
}
export function selectArticleProducts(feed,now,path,title=''){
 const checked=Date.parse(feed?.checkedAt);
 const current=now>0&&checked<=now&&now-checked<freshnessMs;
 const candidates=current?currentProducts(feed,now).flatMap(p=>{
  const href=p.links?.[p.topic]||p.links?.home;
  if(!Number.isSafeInteger(p.id)||!p.name||p.isSoldOut||!(p.price>0&&p.price<30000)||!original(href)||!p.image?.startsWith('https://'))return [];
  if(!meal.test(p.name)&&!snack.test(p.name)&&!warmer.test(p.name)&&rank(p,path,title)!==0)return [];
  const discount=p.endAt&&p.discountRate>0&&p.discountRate<=100?p.discountRate:undefined;
  return [{id:p.id,name:p.name,href,image:p.image,price:p.price,endAt:p.endAt,discount,topic:p.topic,guide:false}];
 }):guideCards;
 const sorted=[...new Map(candidates.map(p=>[p.id,p])).values()].sort((a,b)=>rank(a,path,title)-rank(b,path,title)||(a.price??0)-(b.price??0)||a.id-b.id);
 const deal=sorted.find(p=>p.discount&&rank(p,path,title)<=2);
 return deal?[...new Set([sorted[0],deal,...sorted])].slice(0,3):sorted.slice(0,3);
}
