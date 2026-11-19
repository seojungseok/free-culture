import {currentProducts} from './sharelink-policy.mjs';

// Identity, copy and photography are reviewed together. Read price, availability
// and the original destination from the current feed whenever the ad is shown.
export const homeProductAds=[
 {id:429518365,name:'쟈니베어 군인핫팩 특대형, 180g, 30개입, 1개',title:'바람 찬 출근길, 주머니에 핫팩',label:'쟈니베어 특대형 핫팩',option:'180g × 30개입',scene:'겨울 외투 주머니에 포장된 핫팩을 넣는 장면',tone:'forest'},
 {id:174755365,name:'부산포차 꼬치어묵, 400g, 3봉',title:'국물부터 떠먹는 꼬치어묵',label:'부산포차 꼬치어묵',option:'400g × 3봉',scene:'스테인리스 냄비에 담긴 꼬치어묵',tone:'ochre'},
 {id:2181746213,name:'해남 베니하루카 꿀밤고구마, 특상, 세척, 3kg, 1박스',title:'반으로 가르면 노릇한 고구마',label:'해남 베니하루카 꿀밤고구마',option:'특상 · 세척 · 3kg 한 상자',scene:'껍질을 벌려 노란 속이 보이는 구운 고구마',tone:'plum'},
 {id:123678795,name:'미미네 오리지널 국물떡볶이, 570g, 4봉',title:'떡과 국물을 한 숟갈에',label:'미미네 오리지널 국물떡볶이',option:'570g × 4봉',scene:'빨간 국물과 떡을 함께 담은 떡볶이',tone:'pepper'},
 {id:2664937033,name:'겨울 방한 기모 마스크 넥워머, 다이아2종, FREE, 2종세트, 1세트',title:'찬바람 부는 날, 목까지 포근하게',label:'겨울 방한 기모 넥워머',option:'다이아 패턴 · 2종 세트',scene:'겨울 벤치에 놓인 브라운과 블랙 기모 넥워머',tone:'ember'},
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
