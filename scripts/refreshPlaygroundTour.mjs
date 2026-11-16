import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {loadSourceEnv} from './lib/sourceEnv.mjs';
import {detailIntroRaw,detailInfoRaw,fetchJson,cleanText,extractUrl,createBudget,sleep,safeApiError,QuotaError} from './lib/tourClient.mjs';
export function playgroundCommon(raw){
 const number=(value,min,max)=>{const n=Number(value);return n>=min&&n<=max?n:null;};
 return {title:cleanText(raw.title),address:cleanText([raw.addr1,raw.addr2].filter(Boolean).join(' ')),postalCode:cleanText(raw.zipcode),homepage:extractUrl(raw.homepage),telephone:cleanText(raw.tel),latitude:number(raw.mapy,32,40),longitude:number(raw.mapx,123,133),sourceModifiedAt:cleanText(raw.modifiedtime),overview:cleanText(raw.overview)};
}
export async function refreshPlaygroundTour({input,fetchIntro=detailIntroRaw,fetchCommon,fetchInfo,pause=sleep,now=new Date(),detailsOnly=false,initializeReviewed=false}={}){
 const result=structuredClone(input),budget=createBudget(72),at=now.toISOString();
 for(const [id,place] of Object.entries(result.places)){
  if(!detailsOnly){
   const raw=await fetchIntro(id,place.contentType||12,budget);if(!raw||String(raw.contentid)!==id||!(raw.usetime||raw.usetimeculture))throw Error('관광 API 필수정보 미확인');
   const intro={...raw,usetime:raw.usetime||raw.usetimeculture,parking:raw.parking||raw.parkingculture||raw.parkingfee||'',restdate:raw.restdate||raw.restdateculture||'',infocenter:raw.infocenter||raw.infocenterculture||''};
   place.reviewedIntro ||= place.intro;
   place.introChangedSinceReview=['usetime','parking','parkingfee','restdate','infocenter','usefee'].some(key=>String(intro[key]||'')!==String(place.reviewedIntro[key]||''));
   place.intro=intro;place.checkedAt=at;await pause(400);
  }
  if(fetchCommon&&fetchInfo){
   const raw=await fetchCommon(id,budget);if(!raw||String(raw.contentid)!==id||!raw.addr1)throw Error('관광 API 주소·장소 식별 미확인');
   const common=playgroundCommon(raw);await pause(400);
   const extra=(await fetchInfo(id,place.contentType||12,budget)).map(p=>({name:cleanText(p.infoname),content:cleanText(p.infotext)})).filter(p=>p.name&&p.content);
   const reviewed={address:common.address,extra};
   if(initializeReviewed)place.reviewedDetails=reviewed;
   place.detailsChangedSinceReview=!place.reviewedDetails||JSON.stringify(reviewed)!==JSON.stringify(place.reviewedDetails);
   place.common=common;place.extra=extra;place.detailsCheckedAt=at;await pause(400);
  }
 }
 if(!detailsOnly)result.checkedAt=at;
 if(fetchCommon&&fetchInfo)result.detailsCheckedAt=at;
 return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 loadSourceEnv();const file='data/playground-tour.json';
 try{const data=await refreshPlaygroundTour({input:JSON.parse(fs.readFileSync(file,'utf8')),fetchCommon:async(id,budget)=>{const j=await fetchJson('detailCommon2',{contentId:id},budget);const row=j?.response?.body?.items?.item;return Array.isArray(row)?row[0]:row;},fetchInfo:detailInfoRaw,detailsOnly:process.argv.includes('--details-only'),initializeReviewed:process.argv.includes('--initialize-reviewed')});fs.writeFileSync(file+'.tmp',JSON.stringify(data,null,2));fs.renameSync(file+'.tmp',file);console.log(JSON.stringify({source:'playground-tour',checkedAt:data.checkedAt,detailsCheckedAt:data.detailsCheckedAt,places:Object.keys(data.places).length,extraFields:Object.values(data.places).reduce((sum,p)=>sum+(p.extra?.length||0),0),reviewRequired:Object.values(data.places).filter(p=>p.introChangedSinceReview||p.detailsChangedSinceReview).length}));}catch(e){console.error(safeApiError(e)+' — 기존 놀이터 방문정보 유지');process.exitCode=e instanceof QuotaError&&e.reason==='provider'?75:1;}
}
