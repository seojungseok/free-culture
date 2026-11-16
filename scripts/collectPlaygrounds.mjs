import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadSourceEnv} from './lib/sourceEnv.mjs';
import {normalizePlayground,PLAYGROUND_PLACES,PLAYGROUND_SOURCE,isPlaygroundCandidate} from '../lib/playgrounds.mjs';
export async function collectPlaygrounds({key,fetchImpl=fetch,pause=ms=>new Promise(resolve=>setTimeout(resolve,ms)),now=new Date(),pageSize=500,maxCalls=160,places=Object.keys(PLAYGROUND_PLACES)}={}){
 if(!key)throw Error('놀이터 API 인증키 없음');
 if(!places.length||places.some(code=>!Object.hasOwn(PLAYGROUND_PLACES,code))||!Number.isInteger(pageSize)||pageSize<1||pageSize>1000)throw Error('놀이터 API 수집 설정 오류');
 let decoded;try{decoded=decodeURIComponent(key).replace(/^(['"])(.*)\1$/,'$2');}catch{throw Error('놀이터 API 인증키 형식 오류');}
 const at=now.toISOString(),records=new Map(),groups=[];let calls=0;
 for(const placeCode of places){
  let total=null,received=0;const seen=new Set();
  for(let page=1;;page++){
   if(calls>=maxCalls)throw Error('놀이터 API 수집 예산 초과');
   const url=new URL('https://apis.data.go.kr/1741000/pfc3/getPfctInfo3');url.search=new URLSearchParams({serviceKey:decoded,pageIndex:String(page),recordCountPerPage:String(pageSize),instlPlaceCd:placeCode}).toString();
   let response;try{calls++;response=await fetchImpl(url,{signal:AbortSignal.timeout(30000)});}catch{throw Error('놀이터 API 연결 실패');}
   if(!response.ok)throw Error('놀이터 API HTTP '+response.status);
   let json;try{json=await response.json();}catch{throw Error('놀이터 API 응답 형식 오류');}
   const data=json.response||json,body=data.body;
   if(!['00','0000'].includes(String(data.header?.resultCode)))throw Error('놀이터 API 활용승인 또는 제공 상태 확인 필요');
   const count=Number(body?.totalCnt),items=body?.items;
   if(!Number.isSafeInteger(count)||count<0||count>80000||!Array.isArray(items)||Number(body.pageIndex)!==page||Number(body.recordCountPerPage)!==pageSize)throw Error('놀이터 API 페이지 정보 확인 실패');
   if(total===null)total=count;else if(total!==count)throw Error('놀이터 API 수집 중 전체 건수 변경');
   if(items.length!==Math.min(pageSize,total-received))throw Error('놀이터 API 페이지 누락');
   for(const row of items){
    if(row.instlPlaceCd!==placeCode||seen.has(String(row.pfctSn)))throw Error('놀이터 API 분류 또는 중복 확인 실패');
    seen.add(String(row.pfctSn));const item=normalizePlayground(row,at);
    if(!item)throw Error('놀이터 API 필수 시설정보 누락');
    records.set(item.id,item);
   }
   received+=items.length;if(received===total)break;
   await pause(700);
  }
  groups.push({placeCode,place:PLAYGROUND_PLACES[placeCode],total,received,complete:true});
  if(placeCode!==places.at(-1))await pause(700);
 }
 const items=[...records.values()];
 if(!items.length)throw Error('놀이터 API 전체 목록 비어 있음');
 return {generatedAt:at,source:PLAYGROUND_SOURCE,refresh:{checkedAt:at,complete:true,calls,totalRows:items.length,candidates:items.filter(isPlaygroundCandidate).length,groups},records:items};
}
export function savePlaygroundSnapshot(result,{file='data/playgrounds.json'}={}){
 const old=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{records:[]},ids=new Set(result.records.map(row=>row.id));
 if(result.refresh?.complete!==true||!result.records.length||!result.refresh.groups?.every(g=>g.complete&&g.total===g.received))throw Error('놀이터 API 불완전 수집 저장 중단');
 for(const group of result.refresh.groups){const previous=old.refresh?.groups?.find(g=>g.placeCode===group.placeCode);if(previous?.total>0&&group.total<previous.total*.8)throw Error('놀이터 API 시설 수 급감 — 원자료 확인 필요');}
 result.records.push(...old.records.filter(row=>!ids.has(row.id)).map(row=>({...row,active:false,listed:false})));
 fs.mkdirSync(path.dirname(file),{recursive:true});const temporary=file+'.tmp';fs.writeFileSync(temporary,JSON.stringify(result));fs.renameSync(temporary,file);return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 loadSourceEnv();
 try{const result=savePlaygroundSnapshot(await collectPlaygrounds({key:process.env.DATA_GO_KR_KEY}));console.log(JSON.stringify({source:'playgrounds',...result.refresh}));}
 catch(error){console.error(/^놀이터 API /.test(error.message)?error.message+' — 기존 자료 보존':'놀이터 API 수집 실패 — 기존 자료 보존');process.exitCode=1;}
}
