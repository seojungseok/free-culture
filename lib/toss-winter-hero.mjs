import {currentProducts} from './sharelink-policy.mjs';
import {homeDealGroup} from '../scripts/sharelink/home-deals.mjs';

// Editorial categories, not a claim about sales ranking.
// Seller-provided images always stay paired with their own product.
const groups=[
 {label:'어묵',match:/어묵|오뎅/,title:'찬 바람 부는 날,\n따뜻한 어묵 한 끼'},
 {label:'찌개·전골',match:/찌개|전골/,title:'보글보글 생각나는\n따뜻한 한 냄비'},
 {label:'만두',match:/만두|만둣국|만두국/,title:'추운 날 생각나는\n따끈한 만두'},
 {label:'호빵',match:/호빵/,title:'겨울 간식의 시간,\n포근한 호빵'},
 {label:'팥앙금',match:/팥앙금|팥소/,title:'겨울 간식 만들 때\n팥앙금 준비하기'},
 {label:'커피',match:/커피(?!.*(?:사탕|캔디|방향제|샴푸))/,title:'잠깐의 쉼에도\n따뜻한 커피 한 잔'},
 {label:'불고기',match:/불고기/,title:'든든하게 채우는\n오늘의 한 끼'},
 {label:'볶음밥',match:/볶음밥/,title:'바쁜 날에도\n든든한 볶음밥'},
 {label:'라면·우동',match:/라면|우동/,title:'쌀쌀한 날에\n따뜻한 한 그릇'},
 {label:'고기',match:/삼겹살|목살|소고기/,title:'주말 식탁에\n맛있는 한 끼'},
 {label:'순대',match:/순대/,title:'따뜻하게 준비하는\n순대 한 접시'},
 {label:'겨울 간식',match:/붕어빵|군고구마|옥수수/,title:'포근한 간식 시간\n함께 즐겨요'}
];
// The main campaign is fixed. Only the separate daily-deal rail changes products.
const fixedMain=[
 [174755365,'부산포차 꼬치어묵, 400g, 3봉'],
 [2584893075,'농심 육개장사발면 86g 18개 + 김치사발면 86g 6개, 1세트'],
 [288570013,'신선하랑 냉동 삼겹살, 1kg, 2개'],
 [773646201,'맛팜 옛고을 찰순대, 400g, 1개 + 푸짐한 내장 모둠, 500g, 1개'],
 [2317495197,'G7 커피 퓨어블랙 라이트, 0.9g, 110개입, 3개']
];

export function winterTossCampaign(product) {
 return groups.find(group=>group.match.test(product?.name||'')) || null;
}

export function selectWinterTossHero(feed, now) {
 const eligible=currentProducts(feed,now).filter(p=>{
  if(!p||p.isSoldOut===true||!Number.isInteger(p.id)||!p.name||!p.image?.startsWith('https://')||!Number.isFinite(p.price)||p.price<0)return false;
  if(/냉장고|김치통|조리기구|에어프라이어|텀블러|반려|강아지|고양이|사료|방향제|디퓨저/.test(p.name))return false;
  if(!homeDealGroup(p.name)&&!(/팥앙금|팥소/.test(p.name)&&!/틀|기계|도구/.test(p.name)))return false;
  try{return new URL(p.links?.home).hostname==='toss.shopping'&&new URL(p.links.home).protocol==='https:';}catch{return false;}
 });
 return fixedMain.map(([id,name])=>eligible.find(p=>p.id===id&&p.name===name)).filter(Boolean);
}
