import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {load} from 'cheerio';
import {fetchJson,createBudget,arr,sleep,safeApiError,tourArea,detailImageListRaw} from './lib/tourClient.mjs';

// This pipeline writes only overnight evidence and photos. It never changes day trips.
const file='data/winter-overnight-places.json';
const naverFile='data/winter-overnight-naver-research.json';
const read=(file,fallback)=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):fallback;
const norm=s=>String(s||'').replace(/[\s·ㆍ()\[\]]/g,'');
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const secure=s=>String(s||'').replace(/^http:/,'https:');
const now=()=>new Date().toISOString();
const sourceUrl='https://www.data.go.kr/data/15101578/openapi.do';
const licenseUrl='https://www.kogl.or.kr/info/license.do';
const definitions=[
 ['seoul-craft-museum-winter-2days','서울','서울','서울공예박물관|인사동|광장시장','국립중앙박물관|용산가족공원'],
 ['incheon-ganghwa-winter-2days','인천','강화','강화역사박물관|강화고려궁지|강화풍물시장','전등사|동막해변'],
 ['gyeonggi-yeoju-winter-2days','경기','여주','신륵사|여주박물관','목아박물관|명성황후생가'],
 ['gangwon-donghae-winter-2days','강원','동해·삼척','묵호등대|도째비골 스카이밸리|천곡황금박쥐동굴','추암해변|삼척해수욕장'],
 ['gangwon-chuncheon-winter-2days','강원','춘천','국립춘천박물관|춘천명동닭갈비골목|소양강스카이워크','김유정문학촌|애니메이션박물관'],
 ['chungbuk-cheongju-winter-2days','충북','청주','청주고인쇄박물관|문화제조창|수암골','청남대|문의문화재단지'],
 ['chungnam-gongju-winter-2days','충남','공주','공주공산성|공주산성시장','국립공주박물관|공주무령왕릉과왕릉원'],
 ['daejeon-art-history-winter-2days','대전','대전','대전시립미술관|한밭수목원','대전근현대사전시관|대전중앙시장'],
 ['sejong-city-jocheon-winter-2days','세종','세종','대통령기록관|이응다리','베어트리파크|세종전통시장'],
 ['jeonbuk-jeonju-winter-2days','전북','전주','국립무형유산원|전주한옥마을|전주남부시장','경기전|국립전주박물관'],
 ['gwangju-mudeungsan-art-winter-2days','광주','광주','광주시립미술관|국립광주박물관','증심사|의재미술관'],
 ['mokpo-port-museums-winter-2days','전남','목포','해양유물전시관|목포자연사박물관','목포근대역사관 1관|노적봉'],
 ['yeosu-ocean-dolsan-winter-2days','전남','여수','아쿠아플라넷 여수|여수세계박람회 스카이타워','향일암|전라남도 해양수산과학관'],
 ['daegu-suseong-art-winter-2days','대구','대구','국립대구박물관|수성못','대구미술관|김광석다시그리기길'],
 ['gyeongju-bomun-temples-winter-2days','경북','경주','불국사|석굴암','경주동궁원|경주솔거미술관'],
 ['andong-hahoe-dosan-winter-2days','경북','안동','하회마을|하회세계탈박물관','도산서원|유교문화박물관'],
 ['busan-yeongdo-history-winter-2days','부산','부산','국립해양박물관|흰여울문화마을','부산근현대역사관 본관|부산시민공원'],
 ['ulsan-taehwagang-jangsaengpo-winter-2days','울산','울산','태화강국가정원|울산박물관','장생포고래박물관|장생포고래문화마을'],
 ['tongyeong-art-coast-winter-2days','경남','통영','통영옻칠미술관|이순신공원','박경리기념관|달아공원'],
 ['jeju-jungmun-gardens-winter-2days','제주','서귀포','카멜리아힐|여미지식물원','중문대포해안 주상절리대|제주국제평화센터']
];
const aliases={'강화고려궁지':'고려궁지','춘천명동닭갈비골목':'춘천 명동 닭갈비','공주공산성':'공산성','공주산성시장':'공주 산성시장','공주무령왕릉과왕릉원':'무령왕릉','김광석다시그리기길':'김광석','태화강국가정원':'태화강 국가정원','장생포고래박물관':'장생포 고래박물관','장생포고래문화마을':'장생포 고래문화마을','통영옻칠미술관':'통영 옻칠미술관','중문대포해안 주상절리대':'주상절리대'};
Object.assign(aliases,{'여주한글시장':'한글시장','명성황후생가':'명성황후','도째비골 스카이밸리':'도째비골','삼척해수욕장':'삼척해변','문의문화재단지':'문의문화재','공주산성시장':'산성시장','대전중앙시장':'대전 중앙시장','대통령기록관':'대통령','전주남부시장':'전주 남부시장','해양유물전시관':'국립해양','전라남도 해양수산과학관':'해양수산과학관','경주동궁원':'동궁원','경주솔거미술관':'솔거미술관','박경리기념관':'박경리','전주한옥마을':'전주 한옥마을','경기전':'전주 경기전'});
aliases['중문대포해안 주상절리대']='대포';
const fresh=stamp=>Number.isFinite(Date.parse(stamp))&&Date.now()-Date.parse(stamp)<7*86400000;
const data=read(file,{version:1,generatedAt:null,api:{max:200,requests:0,endpoints:{}},plans:[],places:{},searches:[]});
if(!data.plans.length)data.plans=definitions.map(([slug,area,city,d1,d2])=>({slug,area,city,naverQuery:`${city} 겨울 1박2일 ${d1.split('|')[0]} ${d2.split('|')[0]}`,stops:[...d1.split('|').map(query=>({query,day:1})),...d2.split('|').map(query=>({query,day:2}))]}));
const save=()=>{data.generatedAt=now();fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');};
const envFile=process.env.WINTER_ENV_FILE;
if(envFile)for(const line of fs.readFileSync(envFile,'utf8').split(/\r?\n/)){const m=line.match(/^(TOUR_API_KEY|DATA_GO_KR_KEY)=(.*)$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].trim().replace(/^['"]|['"]$/g,'');}
const budget=createBudget(Math.max(1,data.api.max-data.api.requests));
if(data.api.requests>=data.api.max)budget.stopped=true;
async function api(endpoint,fn){const before=budget.used;try{return await fn();}finally{const count=budget.used-before;data.api.requests+=count;data.api.endpoints[endpoint]=(data.api.endpoints[endpoint]||0)+count;save();await sleep(450);}}
function item(p,checkedAt){return {id:String(p.contentid),title:clean(p.title),addr:clean(p.addr1),addr2:clean(p.addr2),area:tourArea(p),mapx:String(p.mapx||''),mapy:String(p.mapy||''),image:secure(p.firstimage),type:String(p.contenttypeid),sourceModifiedAt:String(p.modifiedtime||''),copyrightType:p.cpyrhtDivCd||'',checkedAt,sourceUrl};}
function score(p,stop,plan){if(p.area!==plan.area||!['12','14','28','38'].includes(p.type))return -1000;const title=norm(p.title),q=norm(stop.query),a=norm(aliases[stop.query]||stop.query);return (title===q?100:title.includes(q)?70:title.includes(a)?50:0)+(p.addr.includes(plan.city)?5:0)-(title.includes('길')&&!q.includes('길')?10:0)-Math.abs(title.length-q.length)/10;}

if(process.argv.includes('--search')){
 const cached=read('data/winter-api-place-search.json',{queries:[]}).queries.flatMap(q=>q.results.map(p=>({...p,checkedAt:q.checkedAt,sourceUrl})));
 outer:for(const plan of data.plans)for(const stop of plan.stops){
  if(stop.id&&data.places[stop.id]&&fresh(data.places[stop.id].checkedAt))continue;
  const candidates=cached.filter(p=>p.area===plan.area&&norm(p.title)===norm(stop.query)&&fresh(p.checkedAt)&&p.copyrightType);
  if(candidates.length===1){const p=candidates[0];data.places[p.id]={...p,evidenceOrigin:'existing-api-cache'};stop.id=p.id;stop.matchReviewed=false;save();continue;}
  const keyword=stop.searchQuery||aliases[stop.query]||stop.query;
  let found=data.searches.find(q=>q.keyword===keyword&&q.area===plan.area&&q.status==='ok'&&fresh(q.checkedAt));
  try{
   if(!found){const j=await api('searchKeyword2',()=>fetchJson('searchKeyword2',{keyword,numOfRows:stop.searchRows||30,pageNo:1,arrange:'A'},budget));const checkedAt=now();found={keyword,area:plan.area,checkedAt,status:'ok',results:arr(j.response?.body?.items?.item).map(p=>item(p,checkedAt))};data.searches.push(found);}
   const ranked=found.results.map(p=>({p,score:score(p,stop,plan)})).filter(x=>x.score>20).sort((a,b)=>b.score-a.score);const p=stop.selectedId?found.results.find(p=>p.id===stop.selectedId):ranked[0]?.p;
   if(p){data.places[p.id]={...data.places[p.id],...p,evidenceOrigin:'tour-api-search'};stop.id=p.id;stop.matchReviewed=false;}
   console.log(JSON.stringify({city:plan.city,query:stop.query,id:p?.id,title:p?.title,rights:p?.copyrightType,candidates:ranked.length}));
  }catch(error){stop.error=safeApiError(error);console.log(JSON.stringify({city:plan.city,query:stop.query,error:stop.error}));if(budget.stopped){save();break outer;}}
  save();
 }
}

if(process.argv.includes('--images'))for(const p of Object.values(data.places)){
 if(p.selectedPhoto?.editorialSelection)continue;
 if(p.image&&p.copyrightType==='Type1'){p.selectedPhoto={sourceUrl:p.image,copyrightType:'Type1',checkedAt:p.checkedAt};continue;}
 let existing=p.images;
 if(!existing){const prior=read('data/winter-api-extra.json',{images:{}}).images[p.id];if(prior&&fresh(prior.checkedAt))existing=prior;}
 try{if(!existing)existing={checkedAt:now(),images:await api('detailImage2',()=>detailImageListRaw(p.id,p.type,budget))};p.images=existing;const allowed=existing.images.find(i=>i.cpyrhtDivCd==='Type1'&&i.originimgurl);if(allowed)p.selectedPhoto={sourceUrl:secure(allowed.originimgurl),copyrightType:'Type1',checkedAt:existing.checkedAt,title:allowed.imgname};console.log(JSON.stringify({id:p.id,title:p.title,type1:!!p.selectedPhoto}));}
 catch(error){p.imageError=safeApiError(error);console.log(JSON.stringify({id:p.id,error:p.imageError}));if(budget.stopped)break;}finally{save();}
}

if(process.argv.includes('--extra-images'))for(const plan of data.plans){
 let count=plan.stops.reduce((n,s)=>{const p=data.places[s.id];return n+(p?.selectedPhoto?1:0)+(p?.selectedGallery?.length||0);},0);
 if(count>=3)continue;
 for(const s of plan.stops){const p=data.places[s.id];if(!p?.selectedPhoto)continue;
  try{if(!p.images)p.images={checkedAt:now(),images:await api('detailImage2',()=>detailImageListRaw(p.id,p.type,budget))};
   const used=new Set([p.selectedPhoto.sourceUrl,...(p.selectedGallery||[]).map(i=>i.sourceUrl)]);
   for(const img of p.images.images){const url=secure(img.originimgurl);if(img.cpyrhtDivCd!=='Type1'||!url||used.has(url))continue;(p.selectedGallery||=[]).push({sourceUrl:url,copyrightType:'Type1',checkedAt:p.images.checkedAt,title:img.imgname});used.add(url);count++;if(count>=3)break;}
  }catch(error){console.log(JSON.stringify({id:p.id,error:safeApiError(error)}));if(budget.stopped)break;}finally{save();}
  if(count>=3)break;
 }
}

if(process.argv.includes('--download')){
 fs.mkdirSync('public/winter-photos',{recursive:true});
 for(const p of Object.values(data.places)){
  if(!p.selectedPhoto||p.selectedPhoto.copyrightType!=='Type1')continue;
  const selected=[p.selectedPhoto,...(p.selectedGallery||[])];
  for(let index=0;index<selected.length;index++){
  const selection=selected[index],src=selection.sourceUrl,url=new URL(src);if(selection.copyrightType!=='Type1'||url.protocol!=='https:'||url.hostname!=='tong.visitkorea.or.kr')throw Error('Unsupported image origin');
  const target=`public/winter-photos/overnight-${p.id}${index?'-'+(index+1):''}-20261107.webp`;
  try{
   const previous=index?p.gallery?.[index-1]:p.photo;
   if(!fs.existsSync(target)||previous?.sourceUrl!==src){const r=await fetch(src,{signal:AbortSignal.timeout(25000)});if(!r.ok||!r.headers.get('content-type')?.startsWith('image/'))throw Error('image');const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length>20*1048576)throw Error('image size');await sharp(bytes).rotate().resize({width:1200,height:900,fit:'inside',withoutEnlargement:true}).webp({quality:81}).toFile(target);}
   const meta=await sharp(target).metadata();if(!meta.width||!meta.height||meta.width<300||meta.height<200)throw Error('image dimensions');
   const photo={src:'/'+target.replace(/^public\//,''),sourceUrl:src,placeId:p.id,alt:selection.alt||p.title,caption:selection.caption||`${p.title} · 자료 사진`,credit:'한국관광공사 TourAPI · 공공누리 제1유형',kind:'tour-api',copyrightType:'Type1',licenseUrl,reviewed:previous?.sourceUrl===src&&previous?.reviewed===true,width:meta.width,height:meta.height,checkedAt:selection.checkedAt,downloadedAt:fs.statSync(target).mtime.toISOString(),...(previous?.sourceUrl===src&&previous?.reviewedAt?{reviewedAt:previous.reviewedAt}:{})};
   if(index)(p.gallery||=[])[index-1]=photo;else p.photo=photo;
   console.log(JSON.stringify({id:p.id,index,photo:true,width:meta.width,height:meta.height}));
  }catch{p.downloadError='Image fetch or decode failed';console.log(JSON.stringify({id:p.id,photo:false}));}
  save();await sleep(100);
  }
 }
}

if(process.argv.includes('--naver')){
 const research=read(naverFile,{method:'Naver public web search for discovery; official sources independently verify facts. No Naver API credentials configured.',queries:[]});
 for(const plan of data.plans){if(research.queries.some(q=>q.slug===plan.slug&&q.status===200&&fresh(q.checkedAt)))continue;
  const url='https://search.naver.com/search.naver?query='+encodeURIComponent(plan.naverQuery);let result={slug:plan.slug,area:plan.area,city:plan.city,query:plan.naverQuery,url,checkedAt:now()};
  try{const r=await fetch(url,{signal:AbortSignal.timeout(25000)}),$=load(await r.text());const found=$('a[href]').map((_,node)=>({url:$(node).attr('href'),title:clean($(node).text())})).get().filter(a=>a.title.length>12&&/^https?:/.test(a.url)&&!/(search|nid|help|shopping|cr)\.naver\.com|adcr\.|ader\.naver/.test(a.url));result={...result,status:r.status,pageTitle:clean($('title').text()),results:[...new Map(found.map(a=>[a.url,a])).values()].slice(0,12)};}catch{result.status='unavailable';result.results=[];}
  research.queries=research.queries.filter(q=>q.slug!==plan.slug);research.queries.push(result);research.checkedAt=now();fs.writeFileSync(naverFile,JSON.stringify(research,null,2)+'\n');console.log(JSON.stringify({naver:plan.slug,status:result.status,results:result.results.length}));await sleep(700);
 }
}

if(process.argv.includes('--contact')){
 const photos=Object.values(data.places).flatMap(p=>[p.photo,...(p.gallery||[])].filter(Boolean).map(photo=>({id:p.id,title:p.title,photo}))),dir='.cache/winter-overnight-review';fs.mkdirSync(dir,{recursive:true});
 for(let start=0;start<photos.length;start+=20){const batch=photos.slice(start,start+20),layers=[];for(let i=0;i<batch.length;i++){const p=batch[i],left=i%4*300,top=Math.floor(i/4)*230;layers.push({input:await sharp('public'+p.photo.src).resize(300,195,{fit:'contain',background:'#fff'}).toBuffer(),left,top});layers.push({input:Buffer.from(`<svg width="300" height="35"><rect width="300" height="35" fill="white"/><text x="8" y="24" font-family="Arial" font-size="20">${start+i+1}: ${p.id}</text></svg>`),left,top:top+195});}await sharp({create:{width:1200,height:Math.ceil(batch.length/4)*230,channels:3,background:'#fff'}}).composite(layers).jpeg({quality:88}).toFile(`${dir}/sheet-${start/20}.jpg`);}
 fs.writeFileSync(`${dir}/index.json`,JSON.stringify(photos.map((p,i)=>({number:i+1,id:p.id,title:p.title,src:p.photo.src})),null,2)+'\n');
}
save();
console.log(JSON.stringify({plans:data.plans.length,stops:data.plans.flatMap(p=>p.stops).length,places:Object.keys(data.places).length,apiRequests:data.api.requests,photos:Object.values(data.places).reduce((n,p)=>n+(p.photo?1:0)+(p.gallery?.length||0),0),unmatched:data.plans.flatMap(p=>p.stops.filter(s=>!s.id).map(s=>({city:p.city,query:s.query}))),under3Photos:data.plans.filter(plan=>plan.stops.reduce((n,s)=>{const p=data.places[s.id];return n+(p?.photo?1:0)+(p?.gallery?.length||0);},0)<3).map(p=>p.slug)}));
