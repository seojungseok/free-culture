import {currentProducts} from './sharelink-policy.mjs';

// Keep each creative with its reviewed product link. Only a current match supplies a price.
export const homeProductAds=[
 {id:3483345,unitCount:10.5,unitLabel:'100g',imageCopy:'노릇노릇',reviewedHref:'https://toss.shopping/_m/V5rIUQG8',name:'전통 찹쌀 꿀호떡, 1.05kg, 1개',title:'노릇하게 구운 찹쌀 꿀호떡',label:'전통 찹쌀 꿀호떡',option:'1.05kg · 1개',scene:'노릇하게 구운 호떡을 갈라 속을 보여주는 연출',tone:'ochre'},
 {id:773646201,unitCount:9,unitLabel:'100g',imageCopy:'따끈한 한 접시',reviewedHref:'https://toss.shopping/_m/pNdSysjd',name:'맛팜 옛고을 찰순대, 400g, 1개 + 푸짐한 내장 모둠, 500g, 1개',title:'따끈한 찰순대 한 접시',label:'맛팜 옛고을 찰순대와 내장 모둠',option:'찰순대 400g + 내장 500g',scene:'찰순대와 내장 모둠을 썰어 담은 상차림 연출',tone:'plum'},
 {id:288570013,unitCount:20,unitLabel:'100g',imageCopy:'지글지글',reviewedHref:'https://toss.shopping/_m/vf2imXi7',name:'신선하랑 냉동 삼겹살, 1kg, 2개',title:'불판 위에서 지글지글, 삼겹살',label:'신선하랑 냉동 삼겹살',option:'1kg × 2개',scene:'불판에 노릇하게 익은 삼겹살을 집게로 드는 연출',tone:'ember'},
 {id:2702896485,unitCount:12,unitLabel:'1개',imageCopy:'포근한 한입',reviewedHref:'https://toss.shopping/_m/zlZwRaT6',name:'삼립 단팥호빵, 개별포장, 12입, 1박스',title:'반을 가르면 따끈한 단팥호빵',label:'삼립 단팥호빵',option:'개별포장 · 12입 한 상자',scene:'찜기 위의 흰 호빵과 단팥소를 보여주는 연출',tone:'forest'},
 {id:524308317,unitCount:21,unitLabel:'100g',imageCopy:'꼬리부터 한입',reviewedHref:'https://toss.shopping/_m/Bgyvetk8',name:'이브로 용궁에서 온 팥 붕어빵, 1050g, 2개',title:'꼬리부터 한입, 팥 붕어빵',label:'이브로 용궁에서 온 팥 붕어빵',option:'1,050g × 2개',scene:'구운 붕어빵 껍질과 팥소를 가까이 보여주는 연출',tone:'pepper'},
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
