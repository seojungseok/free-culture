import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {loadSourceEnv} from './lib/sourceEnv.mjs';
import {detailIntroRaw,createBudget,sleep,safeApiError,QuotaError} from './lib/tourClient.mjs';
export async function refreshPlaygroundTour({input,fetchIntro=detailIntroRaw,pause=sleep,now=new Date()}={}){
 const result=structuredClone(input),budget=createBudget(15),at=now.toISOString();
 for(const [id,place] of Object.entries(result.places)){
  const raw=await fetchIntro(id,place.contentType||12,budget);if(!raw||String(raw.contentid)!==id||!(raw.usetime||raw.usetimeculture))throw Error('관광 API 필수정보 미확인');
  const intro={...raw,usetime:raw.usetime||raw.usetimeculture,parking:raw.parking||raw.parkingculture||raw.parkingfee||'',restdate:raw.restdate||raw.restdateculture||'',infocenter:raw.infocenter||raw.infocenterculture||''};
  place.reviewedIntro ||= place.intro;
  place.introChangedSinceReview=['usetime','parking','restdate','infocenter'].some(key=>String(intro[key]||'')!==String(place.reviewedIntro[key]||''));
  place.intro=intro;place.checkedAt=at;await pause(400);
 }
 result.checkedAt=at;return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 loadSourceEnv();const file='data/playground-tour.json';
 try{const data=await refreshPlaygroundTour({input:JSON.parse(fs.readFileSync(file,'utf8'))});fs.writeFileSync(file+'.tmp',JSON.stringify(data,null,2));fs.renameSync(file+'.tmp',file);console.log(JSON.stringify({source:'playground-tour',checkedAt:data.checkedAt,places:Object.keys(data.places).length,reviewRequired:Object.values(data.places).filter(p=>p.introChangedSinceReview).length}));}catch(e){console.error(safeApiError(e)+' — 기존 놀이공원 방문정보 유지');process.exitCode=e instanceof QuotaError&&e.reason==='provider'?75:1;}
}
