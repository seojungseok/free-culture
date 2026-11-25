import {currentProducts} from './sharelink-policy.mjs';

// Keep each creative with its reviewed product link. Only a current match supplies a price.
export const homeProductAds=[
 {id:3483345,unitCount:10.5,unitLabel:'100g',imageCopy:'꿀호떡',reviewedHref:'https://toss.shopping/_m/V5rIUQG8',name:'전통 찹쌀 꿀호떡, 1.05kg, 1개',title:'전통 찹쌀 꿀호떡',label:'전통 찹쌀 꿀호떡',option:'1.05kg · 1개',scene:'노릇하게 구운 호떡을 갈라 속을 보여주는 연출',tone:'ochre'},
 {id:773646201,unitCount:9,unitLabel:'100g',imageCopy:'찰순대',reviewedHref:'https://toss.shopping/_m/pNdSysjd',name:'맛팜 옛고을 찰순대, 400g, 1개 + 푸짐한 내장 모둠, 500g, 1개',title:'옛고을 찰순대 모둠',label:'맛팜 옛고을 찰순대와 내장 모둠',option:'찰순대 400g + 내장 500g',scene:'찰순대와 내장 모둠을 썰어 담은 상차림 연출',tone:'plum'},
 {id:288570013,unitCount:20,unitLabel:'100g',imageCopy:'삼겹살',reviewedHref:'https://toss.shopping/_m/vf2imXi7',name:'신선하랑 냉동 삼겹살, 1kg, 2개',title:'신선하랑 냉동 삼겹살',label:'신선하랑 냉동 삼겹살',option:'1kg × 2개',scene:'불판에 노릇하게 익은 삼겹살을 집게로 드는 연출',tone:'ember'},
 {id:174755365,unitCount:3,unitLabel:'1봉',imageCopy:'꼬치어묵',reviewedHref:'https://toss.shopping/_m/rpFdZSBo',name:'부산포차 꼬치어묵, 400g, 3봉',title:'부산포차 꼬치어묵',label:'부산포차 꼬치어묵',option:'400g × 3봉',scene:'맑은 국물에 꼬치어묵을 담은 조리 예시',tone:'forest'},
 {id:123678795,unitCount:4,unitLabel:'1봉',imageCopy:'국물떡볶이',reviewedHref:'https://toss.shopping/_m/DFUkzlnn',name:'미미네 오리지널 국물떡볶이, 570g, 4봉',title:'미미네 국물떡볶이',label:'미미네 오리지널 국물떡볶이',option:'570g × 4봉',scene:'빨간 국물에 떡을 담은 조리 예시',tone:'pepper'},
];
const currency=new Intl.NumberFormat('ko-KR');
export function unitPriceFor(product){
 if(!Number.isFinite(product.price)||product.price<=0)return '';
 const ad=homeProductAds.find(a=>a.id===product.id&&a.name===product.name);
 let count=ad?.unitCount,label=ad?.unitLabel;
 if(!ad){
  const pack=product.name?.match(/, (\d+(?:\.\d+)?(?:ml|L)), (\d+)(개|병|팩)$/i);
  if(!pack||Number(pack[2])<2)return '';
  count=Number(pack[2]);label=pack[1]+' 1'+pack[3];
 }
 const exact=product.price/count;
 return label+'당 '+(Number.isInteger(exact)?'':'약 ')+currency.format(Math.round(exact))+'원';
}
export function selectHomeProductAds(feed,now){
 const live=new Map(currentProducts(feed,now).map(p=>[p.id,p]));
 return homeProductAds.flatMap(ad=>{
  const p=live.get(ad.id);
  if(!p||p.name!==ad.name||p.isSoldOut===true||!Number.isFinite(p.price)||p.price<=0||!p.image?.startsWith('https://'))return [];
  let url;
  try{url=new URL(p.links?.home);}catch{return [];}
  if(url.protocol!=='https:'||url.hostname!=='toss.shopping'||url.username||url.password)return [];
  return [{...ad,price:p.price,href:p.links.home,image:p.image,endAt:p.endAt}];
 }).sort((a,b)=>a.price-b.price);
}
