import fs from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {createYouthPublicFetch} from './lib/youthPhotos.mjs';
const fetchYouthImage=createYouthPublicFetch();
const read=(file,fallback)=>fs.existsSync('data/'+file)?JSON.parse(fs.readFileSync('data/'+file,'utf8')):fallback;
const allowed=new Set(['tong.visitkorea.or.kr','www.seantour.kr','www.youth.go.kr','youth.go.kr']);
export function publicExperienceImage(value){try{const url=new URL(String(value).replace(/^http:/,'https:'));return url.protocol==='https:'&&!url.username&&!url.password&&allowed.has(url.hostname)&&!url.searchParams.has('serviceKey')?url.href:'';}catch{return '';}}
const records=[...read('rural-experiences.json',{records:[]}).records,...read('youth-experiences.json',{records:[]}).records,...Object.values(read('experience-venues.json',{venues:{}}).venues),...Object.values(read('accessible-travel.json',{places:{}}).places).map(place=>({imageSource:place.image}))];
const sources=[...new Set(records.map(record=>publicExperienceImage(record.imageSource)).filter(Boolean))];
const registry=read('experience-media.json',{images:{}}),max=Math.min(160,Math.max(0,Number(process.env.EXPERIENCE_IMAGE_DAILY||30)));
const adjustments=read('experience-image-adjustments.json',{});
fs.mkdirSync('public/experience-images',{recursive:true});let fetched=0,failed=0;
for(const source of sources){
 const prior=registry.images[source];if(prior?.src&&fs.existsSync('public'+prior.src))continue;
 if(prior?.failedAt&&Date.now()-Date.parse(prior.failedAt)<7*86400000)continue;
 if(fetched+failed>=max)break;
 try{
  let url=source,response;
  for(let redirect=0;redirect<4;redirect++){
   response=/^(www\.)?youth\.go\.kr$/.test(new URL(url).hostname)?await fetchYouthImage(url):await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(15000)});
   if(response.status>=300&&response.status<400){url=publicExperienceImage(new URL(response.headers.get('location'),url).href);if(!url)throw new Error('Image redirect not allowed');continue;}break;
  }
  if(!response?.ok||!/^image\//.test(response.headers.get('content-type')||''))throw new Error('Image unavailable');
  const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>12*1024*1024)throw new Error('Image too large');
  const name=createHash('sha256').update(source).digest('hex').slice(0,20)+'.webp',src='/experience-images/'+name;
  const correction=adjustments[source],rotation=correction?.sha256===createHash('sha256').update(bytes).digest('hex')&&[90,180,270].includes(correction.rotation)?correction.rotation:undefined;
  const result=await sharp(bytes,{limitInputPixels:40e6}).rotate(rotation).resize({width:900,height:900,fit:'inside',withoutEnlargement:true}).webp({quality:78}).toBuffer({resolveWithObject:true});
  if(result.info.width<80||result.info.height<80)throw new Error('Image dimensions too small');
  fs.writeFileSync('public'+src,result.data);registry.images[source]={src,width:result.info.width,height:result.info.height,source,checkedAt:new Date().toISOString(),bytes:result.data.length};fetched++;
 }catch{failed++;registry.images[source]={...(prior||{}),failedAt:new Date().toISOString()};}
 await new Promise(resolve=>setTimeout(resolve,180));
}
registry.generatedAt=new Date().toISOString();fs.writeFileSync('data/experience-media.json.tmp',JSON.stringify(registry));fs.renameSync('data/experience-media.json.tmp','data/experience-media.json');
console.log(JSON.stringify({sourcePhotos:sources.length,fetched,failed,cached:Object.values(registry.images).filter(image=>image.src).length}));
