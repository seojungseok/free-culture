import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {fetchJson,createBudget,arr,sleep,safeApiError,detailImageListRaw} from './lib/tourClient.mjs';
const envFile=process.env.WINTER_ENV_FILE;
if(envFile)for(const line of fs.readFileSync(envFile,'utf8').split(/\r?\n/)){const m=line.match(/^(TOUR_API_KEY|DATA_GO_KR_KEY)=(.*)$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].trim().replace(/^['"]|['"]$/g,'');}
const source=JSON.parse(fs.readFileSync('data/winter-api-place-search.json'));
const extraFile='data/winter-api-extra.json';
const extra=fs.existsSync(extraFile)?JSON.parse(fs.readFileSync(extraFile)):{queries:[],images:{}};
const budget=createBudget(75);
const extras=['해운대시장','오두산','경포','의림지 역사박물관','제천 중앙시장'];
if(process.argv.includes('--fetch'))for(const keyword of extras){
 if(extra.queries.some(x=>x.keyword===keyword))continue;
 try{const j=await fetchJson('searchKeyword2',{keyword,numOfRows:30,pageNo:1},budget);extra.queries.push({keyword,checkedAt:new Date().toISOString(),results:arr(j.response.body.items?.item)});console.log(keyword,extra.queries.at(-1).results.map(x=>({id:x.contentid,title:x.title})));}catch(e){console.log(safeApiError(e));}
 fs.writeFileSync(extraFile,JSON.stringify(extra,null,2)+'\n');await sleep(350);
}
const selections=[
 ['서울','126509','130071','2778454'],['부산','987810','126081','995455'],['대구','2611140','2366217','132532'],['인천','264512','1931699','947611'],
 ['광주','127078','2603494','2009775'],['대전','2760707','2674960','129785'],['울산','127515','126091','1395618'],['세종','2675068','1946955','130952'],
 ['수원','125555','1921150','2667588'],['파주','125583','2911414','128168'],['강릉','129784','128758','127722'],['속초','130895','1260275','125779'],
 ['제천','127804','2638587','132120'],['서천','1922640','2014616','1937012'],['군산','1684836','2468978','2605528'],['순천','126730','1919548','2044930'],
 ['여수','128025','3351475','2612869'],['경주','129778','1492402','2603509'],['통영','584712','753306','231923'],['서귀포','126438','1620936','1013258']
];
const map=new Map(source.queries.flatMap(q=>q.results).map(x=>[x.id,x]));
for(const q of extra.queries)for(const p of q.results)map.set(String(p.contentid),{id:String(p.contentid),title:p.title,addr:p.addr1,mapx:p.mapx,mapy:p.mapy,image:String(p.firstimage||'').replace(/^http:/,'https:'),type:p.contenttypeid,sourceModifiedAt:p.modifiedtime});
if(process.argv.includes('--fetch'))for(const [city,...ids]of selections)for(const id of ids){
 if(!map.has(id)||extra.images[id])continue;
 try{const images=await detailImageListRaw(id,undefined,budget);extra.images[id]={checkedAt:new Date().toISOString(),images};console.log(city,id,'photos',images.length);}catch(e){console.log(city,id,safeApiError(e));if(budget.stopped)break;}
 fs.writeFileSync(extraFile,JSON.stringify(extra,null,2)+'\n');await sleep(250);
}
const plans=selections.map(([city,...ids])=>({city,stops:ids.map(id=>{const p=map.get(id);if(!p)return {id,missing:true};return {...p,checkedAt:source.checkedAt,images:extra.images[id]?.images||[],imageCheckedAt:extra.images[id]?.checkedAt};})}));
fs.writeFileSync('data/winter-daytrip-places.json',JSON.stringify(plans,null,2)+'\n');
console.log('Requests',budget.used,'Missing',plans.flatMap(p=>p.stops.filter(s=>s.missing).map(s=>({city:p.city,id:s.id}))));
if(process.argv.includes('--download')){
 fs.mkdirSync('public/winter-photos',{recursive:true});
 const gallery=JSON.parse(fs.readFileSync('data/photo-gallery.json'));
 const galleryIds={'264512':'984770','753306':'3048421'};
 for(const plan of plans)for(const stop of plan.stops){
  if(stop.missing)continue;
  const galleryPhoto=gallery.photos.find(p=>p.id===galleryIds[stop.id]);
  const src=stop.image||stop.images[0]?.originimgurl?.replace(/^http:/,'https:')||galleryPhoto?.image;
  if(!src){console.log('NO IMAGE',plan.city,stop.title);continue;}
  const file=`public/winter-photos/${stop.id}-20261106.webp`;
  try{
   if(!fs.existsSync(file)){const r=await fetch(src,{signal:AbortSignal.timeout(25000)});if(!r.ok||!r.headers.get('content-type')?.startsWith('image/'))throw Error('image response');await sharp(Buffer.from(await r.arrayBuffer())).rotate().resize({width:1200,height:900,fit:'inside',withoutEnlargement:true}).webp({quality:81}).toFile(file);}
   const m=await sharp(file).metadata();stop.photo={src:'/'+file.replace(/^public\//,''),sourceUrl:src,placeId:stop.id,alt:stop.title,caption:`${stop.title} · 자료 사진`,credit:galleryPhoto?`한국관광공사 관광사진갤러리${galleryPhoto.photographer?' · '+galleryPhoto.photographer:''}`:'한국관광공사 TourAPI',kind:'tour-api',reviewed:false,width:m.width,height:m.height,checkedAt:new Date().toISOString(),...(galleryPhoto?{galleryId:galleryPhoto.id,sourceCheckedAt:gallery.generatedAt}:{})};
   console.log(plan.city,stop.title,`${m.width}x${m.height}`);
  }catch{console.log('IMAGE FAILED',plan.city,stop.title);}
 }
 fs.writeFileSync('data/winter-daytrip-places.json',JSON.stringify(plans,null,2)+'\n');
}
