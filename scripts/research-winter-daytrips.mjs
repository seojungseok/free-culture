import fs from 'node:fs';
const plans = [
 ['서울','서울','덕수궁','서울시립미술관','정동길'],['부산','부산','동백섬','해운대해수욕장','해운대시장'],
 ['대구','대구','청라언덕','계산예가','서문시장'],['인천','인천','차이나타운','짜장면박물관','개항장'],
 ['광주','광주','양림동','펭귄마을','국립아시아문화전당'],['대전','대전','유성온천','유림공원','국립중앙과학관'],
 ['울산','울산','대왕암공원','일산해수욕장','슬도'],['세종','세종','국립세종수목원','세종호수공원','조세박물관'],
 ['경기','수원','수원화성','화성박물관','공방거리'],['경기','파주','오두산','장단콩웰빙마루','헤이리'],
 ['강원','강릉','오죽헌','경포해변','안목해변'],['강원','속초','속초시립박물관','속초관광수산시장','영금정'],
 ['충북','제천','의림지','의림지역사박물관','제천중앙시장'],['충남','서천','국립생태원','국립해양생물자원관','장항송림'],
 ['전북','군산','군산근대역사박물관','군산근대미술관','경암동'],['전남','순천','순천만습지','순천만국가정원','아랫장'],
 ['전남','여수','오동도','해양공원','이순신광장'],['경북','경주','국립경주박물관','대릉원','월정교'],
 ['경남','통영','통영중앙','동피랑','통제영'],['제주','서귀포','천지연폭포','이중섭','매일올레시장']
];
const clean = s => s.replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|amp|quot|lt|gt);/g,' ').replace(/\s+/g,' ').trim();
const allPlaces = JSON.parse(fs.readFileSync('data/places.json')).spots;
const details = JSON.parse(fs.readFileSync('data/place-details.json')).details;
const candidates = plans.map(([area,city,...names])=>({area,city,stops:names.map(name=>({query:name,matches:allPlaces.filter(p=>p.area===area&&p.title.replace(/\s/g,'').includes(name.replace(/\s/g,''))).map(p=>({...p,detail:details[p.id]}))}))}));
fs.writeFileSync('data/winter-place-candidates.json',JSON.stringify(candidates,null,2)+'\n');
if(process.argv.includes('--naver')){
 const results=[];
 for(const [area,city] of plans){
  const query=`${city} 겨울 당일치기 여행 코스`;
  const url='https://search.naver.com/search.naver?query='+encodeURIComponent(query);
  try{
   const r=await fetch(url,{signal:AbortSignal.timeout(30000)}), html=await r.text();
   const links=[...html.matchAll(/<a\b[^>]*href=["'](https?:[^"']+)["'][^>]*>([\s\S]*?)<\/a>/g)].map(m=>({url:m[1].replace(/&amp;/g,'&'),title:clean(m[2])})).filter(a=>a.title.length>15&&!/search\.naver\.com|nid\.naver\.com|help\.naver\.com|adcr\.|ader\.naver|shopping\.naver|cr\.naver/.test(a.url));
   const unique=[...new Map(links.map(a=>[a.url,a])).values()].slice(0,12);
   results.push({area,city,query,url,checkedAt:new Date().toISOString(),status:r.status,pageTitle:clean(html.match(/<title>([\s\S]*?)<\/title>/)?.[1]||''),results:unique});
   console.log(JSON.stringify({city,status:r.status,results:unique.length}));
  }catch{results.push({area,city,query,url,checkedAt:new Date().toISOString(),status:'unavailable'});}
  fs.writeFileSync('data/winter-naver-research.json',JSON.stringify({checkedAt:new Date().toISOString(),method:'Naver public web search; discovery only, facts verified against official tourism sources',queries:results},null,2)+'\n');
  await new Promise(r=>setTimeout(r,700));
 }
}
console.log(JSON.stringify(candidates.map(c=>({city:c.city,stops:c.stops.map(s=>({q:s.query,m:s.matches.map(p=>({id:p.id,title:p.title,image:!!p.image,images:p.detail?.images?.length||0}))}))})),null,2));
