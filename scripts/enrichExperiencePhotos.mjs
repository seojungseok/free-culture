import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {isYouthExperience,youthApplicationSearchUrl} from '../lib/experiences.mjs';
import {createYouthPublicFetch,parseYouthPoster,youthPhotoSearchTerm} from './lib/youthPhotos.mjs';

export async function enrichExperiencePhotos(store,{max=20,fetchPage=createYouthPublicFetch(),now=()=>new Date(),pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
 const today=new Date(now().getTime()+9*3600000).toISOString().slice(0,10);
 const targets=store.records.filter(record=>record.active!==false&&record.end>=today&&isYouthExperience(record))
  .filter(record=>!record.imageAttemptedAt||now().getTime()-Date.parse(record.imageAttemptedAt)>7*86400000)
  .sort((a,b)=>Number(!!a.imageSource)-Number(!!b.imageSource)||a.start.localeCompare(b.start)).slice(0,max);
 let checked=0,found=0,missing=0,failed=0,consecutiveFailures=0;
 for(const record of targets){
  try{
   const at=now().toISOString();let photo=null;
   const terms=[record.title,youthPhotoSearchTerm(record.title)].filter((value,index,all)=>all.indexOf(value)===index);
   for(const term of terms){
    const page=youthApplicationSearchUrl(term),response=await fetchPage(page);
    if(!response.ok||!/(?:text\/html|application\/xhtml\+xml)/i.test(response.headers.get('content-type')||''))throw new Error('Public page unavailable');
    const html=await response.text();if(html.length>2*1024*1024)throw new Error('Public page too large');
    photo=parseYouthPoster(html,record,at,page);if(photo)break;
    await pause(700);
   }
   record.imageAttemptedAt=at;
   if(photo){Object.assign(record,photo);found++;}else missing++;
   checked++;consecutiveFailures=0;
  }catch{failed++;consecutiveFailures++;}
  if(consecutiveFailures>=3)break;
  await pause(700);
 }
 const report={checkedAt:now().toISOString(),checked,found,missing,failed};store.photoRefresh=report;return report;
}
async function main(){
 const file='data/youth-experiences.json',store=JSON.parse(fs.readFileSync(file,'utf8'));
 const max=Math.min(120,Math.max(0,Number(process.env.EXPERIENCE_PHOTO_DAILY||20)));
 const result=await enrichExperiencePhotos(store,{max});
 fs.writeFileSync(file+'.tmp',JSON.stringify(store));fs.renameSync(file+'.tmp',file);
 console.log(JSON.stringify({source:'official-youth-posters',...result}));if(result.failed)process.exitCode=1;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(()=>{console.error('공식 프로그램 사진 확인 실패 — 기존 사진 보존');process.exitCode=1;});
