import {currentProducts} from './sharelink-policy.mjs';

// Identity, copy and photography are reviewed together. Read price, availability
// and the original destination from the current feed whenever the ad is shown.
export const homeProductAds=[
 {id:174755365,name:'부산포차 꼬치어묵, 400g, 3봉',title:'국물부터 떠먹는 꼬치어묵',label:'부산포차 꼬치어묵',option:'400g × 3봉',scene:'스테인리스 냄비에 담긴 꼬치어묵',tone:'ochre'},
 {id:1190159839,name:'버팔로 로다 캠핑체어, 아이보리, 2개',title:'둘이 앉을 캠핑 의자',label:'버팔로 로다 캠핑체어',option:'아이보리 · 2개',scene:'강가에 나란히 펼친 아이보리 캠핑 의자',tone:'forest'},
 {id:1179530071,name:'순살 양념 목살구이, 600g, 3개',title:'불판에 올릴 양념 목살',label:'순살 양념 목살구이',option:'600g × 3개',scene:'불판 위에서 익어가는 양념 목살',tone:'ember'},
 {id:2181746213,name:'해남 베니하루카 꿀밤고구마, 특상, 세척, 3kg, 1박스',title:'반으로 가르면 노릇한 고구마',label:'해남 베니하루카 꿀밤고구마',option:'특상 · 세척 · 3kg 한 상자',scene:'껍질을 벌려 노란 속이 보이는 구운 고구마',tone:'plum'},
 {id:123678795,name:'미미네 오리지널 국물떡볶이, 570g, 4봉',title:'떡과 국물을 한 숟갈에',label:'미미네 오리지널 국물떡볶이',option:'570g × 4봉',scene:'빨간 국물과 떡을 함께 담은 떡볶이',tone:'pepper'},
];
export function selectHomeProductAds(feed,now){
 const live=new Map(currentProducts(feed,now).map(p=>[p.id,p]));
 return homeProductAds.flatMap(ad=>{
  const p=live.get(ad.id);
  if(!p||p.name!==ad.name||p.isSoldOut===true||!Number.isFinite(p.price)||p.price<=0||!p.image?.startsWith('https://'))return [];
  let url;
  try{url=new URL(p.links?.home);}catch{return [];}
  if(url.protocol!=='https:'||url.hostname!=='toss.shopping'||url.username||url.password)return [];
  return [{...ad,price:p.price,href:p.links.home,image:p.image,endAt:p.endAt}];
 });
}
