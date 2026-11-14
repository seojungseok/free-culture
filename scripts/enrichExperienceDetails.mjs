import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {XMLParser} from 'fast-xml-parser';
import {loadSourceEnv} from './lib/sourceEnv.mjs';
import {mergeYouthDetail} from '../lib/experiences.mjs';
export async function enrichYouthDetails(store,{max=40,fetchDetail,now=()=>new Date(),pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))}){
 const today=new Date(now().getTime()+9*3600000).toISOString().slice(0,10);
 const targets=store.records.filter(record=>record.active!==false&&record.end>=today&&(!record.detailCheckedAt||now().getTime()-Date.parse(record.detailCheckedAt)>7*86400000))
  .sort((a,b)=>Number(!/체험|만들기|캠프|과학|문화|탐방/.test(a.title))-Number(!/체험|만들기|캠프|과학|문화|탐방/.test(b.title))||String(a.detailCheckedAt||'').localeCompare(b.detailCheckedAt||'')).slice(0,max);
 let checked=0,failures=0;
 for(const record of targets){
  try{const updated=mergeYouthDetail(record,await fetchDetail(record.id),now().toISOString());Object.assign(record,updated);checked++;}
  catch{failures++;}
  if(failures>=3)break;
  await pause(350);
 }
 store.detailRefresh={checkedAt:now().toISOString(),checked,failures,complete:failures===0,pending:Math.max(0,store.records.filter(record=>record.active!==false&&record.end>=today&&!record.detailCheckedAt).length)};
 return store.detailRefresh;
}
async function main(){
 loadSourceEnv();if(!process.env.DATA_GO_KR_KEY)throw new Error('API key missing');
 const file='data/youth-experiences.json',store=JSON.parse(fs.readFileSync(file,'utf8')),parser=new XMLParser({parseTagValue:false});
 const max=Math.min(150,Math.max(0,Number(process.env.EXPERIENCE_DETAIL_DAILY||40)));
 const result=await enrichYouthDetails(store,{max,fetchDetail:async id=>{
  const url=new URL('https://apis.data.go.kr/1383000/YouthActivInfoVacationSrvc/getVacationProgrmInfo');
  url.search=new URLSearchParams({serviceKey:decodeURIComponent(process.env.DATA_GO_KR_KEY),key1:id,pageNo:'1',numOfRows:'10'}).toString();
  let response;try{response=await fetch(url,{signal:AbortSignal.timeout(20000)});}catch{throw new Error('API connection failed');}
  if(!response.ok)throw new Error('API unavailable');
  const result=parser.parse(await response.text()).response;
  if(!['00','0000'].includes(String(result?.header?.resultCode)))throw new Error('API result invalid');
  const raw=result.body?.items?.item;return Array.isArray(raw)?raw[0]:raw;
 }});
 fs.writeFileSync(file+'.tmp',JSON.stringify(store));fs.renameSync(file+'.tmp',file);
 console.log(JSON.stringify({source:'youth-detail',...result}));if(result.failures)process.exitCode=1;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(()=>{console.error('청소년 상세자료 확인 실패 — 기존 본문 보존');process.exitCode=1;});
