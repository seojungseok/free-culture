// One-time editorial grouping from the supplied list and cached product addresses.
// This never approves copy, image rights or publication.
import fs from 'node:fs';
const file='data/waug/catalog.json';const db=JSON.parse(fs.readFileSync(file,'utf8'));
const previous=fs.existsSync('data/waug/places.json')?JSON.parse(fs.readFileSync('data/waug/places.json','utf8')).places:[];
const groups=[
  ['seoulland','서울랜드',['zL05y2Xy','Q2smxc67','ItVb8utR','MYBgKK7a']],
  ['nature-scape-dongtan','네이처스케이프 플러스 동탄',['0htJw3od','wevX1T04']],
  ['pororo-dasan','뽀로로테마파크 다산',['QPwUnmmM','h4gdvnhg']],
  ['paju-gondola','파주 임진각 평화곤돌라',['1pX5q6lb','ZXzqLZwA']],
  ['herb-island','포천 허브아일랜드',['99PBHMQK','guSwDhHr']],
  ['seohaerang','서해랑 제부도 해상케이블카',['qqMMc271','zY8A9h0l']],
  ['hwaseong-tourpass','화성투어패스',['M9H7pJzT','FAMBB0LO']],
  ['shinbuk-spa','신북온천',['MpwrqK7X','coKARBau']],
  ['gimpo-monsterium','김포 몬스터리움과 테마파크 패키지',['8YvEYsQG','QlTVQvXT']],
];
const aliases={'경기도':'경기','경기':'경기','강원':'강원','강원특별자치도':'강원','강원도':'강원','인천':'인천','인천광역시':'인천','울산':'울산','울산광역시':'울산'};
for(const p of db.products){
  if(p.duplicateOf)continue;
  const r=JSON.parse(fs.readFileSync(`.cache/waug/research/${p.id}.json`,'utf8'));
  const group=groups.find(g=>g[2].includes(p.id));p.placeId=group?.[0]||`place-${p.productId}`;
  const source=r.usage||'';
  const raw=source.match(/주소\s*[:：]?\s*([\s\S]*?)(?:Google|운영\s*시간)/)?.[1]?.trim()||'';
  const address=raw.match(/(?:대한민국\s*)?(경기도|경기|강원특별자치도|강원도|강원|인천광역시|인천|울산광역시|울산)\s+.+/)?.[0]||null;
  p.address=address;p.area=address?aliases[address.replace(/^대한민국\s*/,'').split(/\s/)[0]]||null:null;
  p.branch=p.actualName.match(/(?:동탄|하남|파주|일산|다산|미사|오산중앙|배곧|고양|안성)점/)?.[0]||null;
  p.saleEvidence=r.text.slice(p.actualName.length,p.actualName.length+70);
  p.saleStatus=/판매 준비 중|커밍순|출시 예정/.test(p.saleEvidence)?'coming_soon':/사용가능/.test(p.saleEvidence)?'listed':'pending';
  if(p.saleStatus==='coming_soon'){p.eligibility='excluded';p.exclusionReason='상품 상단 판매 준비 중 표시 확인';}
  if(['a1npVRlZ','3ITSj4AU','rSGdfJXv','tL8qi56O','vM2xPeg7','DMB5JEsR','WEKUE1Co'].includes(p.id)){p.eligibility='excluded';p.exclusionReason='실외 워터파크 또는 실외 물놀이 상품 제외';}
  if(p.id==='9eBGFj06'){p.waterReviewRequired=false;p.categoryNote='실제 상품은 스포츠 게임·VR 체험 공간. 물놀이 상품이 아님.';}
  if(p.id==='srPdUMCN')p.categoryNote='상품은 실내 워터파크로 소개. 현재 옵션과 공식 시설 확인 후 유지 가능.';
  if(['3c63svkN','Le5jgijZ'].includes(p.id))p.holdReason='심리상담·공간대여 상품의 입장권·체험 적합성 검토 필요';
  if(['M9H7pJzT','QY22twvG','FAMBB0LO'].includes(p.id))p.holdReason='시간권 상품명과 본문 이용시간 대조, 포함 시설 확인 필요';
  if(p.id==='kw7mruAC')p.holdReason='숲 체험 상품 유지 후보. 물놀이장 포함 여부를 선택 옵션별로 확인 필요';
}
const places=[];
for(const p of db.products.filter(p=>!p.duplicateOf)){
  let place=places.find(x=>x.id===p.placeId);
  if(!place){place={id:p.placeId,name:groups.find(g=>g[0]===p.placeId)?.[1]||p.suppliedName,area:p.area,address:p.address,productIds:[],articleSlug:null,status:'research_pending',thumbnail:{status:'rights_pending',url:null,alt:null,inputHash:null,error:null},photoCandidates:[]};places.push(place);}
  place.productIds.push(p.id);
  const r=JSON.parse(fs.readFileSync(`.cache/waug/research/${p.id}.json`,'utf8'));
  for(const im of r.imageCandidates||[])if(!place.photoCandidates.some(x=>x.url===im.url))place.photoCandidates.push({...im,sourceUrl:p.detailUrl,usage:'body_only_pending_place_check',editAllowed:false,rightsUrl:'https://waug-marketing-partners.notion.site/3281e6250bde8076a215df32362aac57'});
}
fs.writeFileSync(file,JSON.stringify(db,null,2)+'\n');
for(const place of places){const old=previous.find(p=>p.id===place.id);if(old){place.articleSlug=old.articleSlug;place.status=old.status;place.thumbnail=old.thumbnail;}}
fs.writeFileSync('data/waug/places.json',JSON.stringify({version:1,places},null,2)+'\n');
console.log({products:db.products.length,placeGroups:places.length,consolidated:88-places.length,excluded:db.products.filter(p=>p.eligibility==='excluded').length});
