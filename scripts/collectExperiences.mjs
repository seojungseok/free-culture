import fs from 'node:fs';
import {XMLParser} from 'fast-xml-parser';
import {loadSourceEnv} from './lib/sourceEnv.mjs';
import {normalizeRural,normalizeYouth} from '../lib/experiences.mjs';
loadSourceEnv();
const config={rural:{endpoint:'https://api.data.go.kr/openapi/tn_pubr_public_frhl_exprn_vilage_api',normalize:normalizeRural,file:'rural-experiences.json'},youth:{endpoint:'https://apis.data.go.kr/1383000/YouthActivInfoVacationSrvc/getVacationProgrmList',normalize:normalizeYouth,file:'youth-experiences.json'}};
const key=process.env.DATA_GO_KR_KEY,parser=new XMLParser({parseTagValue:false});
if(!key){console.error('공공 API 인증키 없음');process.exit(1);}
const today=new Date(Date.now()+9*3600000).toISOString().slice(0,10);let failures=0;
for(const [name,service]of Object.entries(config)){
 if(process.argv[2]&&process.argv[2]!==name)continue;
 try{
  const prior=fs.existsSync('data/'+service.file)?JSON.parse(fs.readFileSync('data/'+service.file,'utf8')):{records:[]};
  const previous=new Map(prior.records.map(record=>[record.id,record]));
  const records=new Map();let total=0,received=0,calls=0;
  for(let page=1;page<=30;page++){
   const url=new URL(service.endpoint);url.search=new URLSearchParams({serviceKey:decodeURIComponent(key),pageNo:String(page),numOfRows:'1000',...(name==='rural'?{type:'json'}:{})}).toString();
   calls++;let response;try{response=await fetch(url,{signal:AbortSignal.timeout(30000)});}catch{throw new Error('연결 실패');}
   if(!response.ok)throw new Error('HTTP '+response.status);
   const body=await response.text();let data;try{data=body.trimStart().startsWith('<')?parser.parse(body):JSON.parse(body);}catch{throw new Error('응답 형식 오류');}
   const result=data.response||data;
   if(!['00','0000'].includes(String(result.header?.resultCode)))throw new Error('인증 또는 제공 상태 확인 필요');
   const count=Number(result.body?.totalCount);
   if(!Number.isInteger(count)||count<0||count>30000||page>1&&total!==count)throw new Error('목록 완전성 확인 실패');
   total=count;const raw=result.body?.items?.item;const items=Array.isArray(raw)?raw:raw?[raw]:[];
   if(!items.length&&received<total)throw new Error('페이지 누락');
   received+=items.length;
   for(const row of items){const record=service.normalize(row);if(record&&(name!=='youth'||record.end>=today)){
    const old=previous.get(record.id),same=old?.title===record.title&&old?.start===record.start&&old?.end===record.end&&(!old?.listSummary||old.listSummary===record.summary),enriched=old?.detailCheckedAt&&same?Object.fromEntries(['content','activities','address','phone','detailCheckedAt'].map(key=>[key,old[key]])):{};
    records.set(record.id,{...record,...enriched,listSummary:record.summary||'',active:true});
   }}
   if(received>=total)break;
   await new Promise(resolve=>setTimeout(resolve,1000));
  }
  if(received!==total||name==='rural'&&!records.size)throw new Error('목록 완전성 확인 실패');
  const current=records.size;
  // A published detail URL remains available after a programme ends or leaves the feed.
  for(const old of prior.records)if(!records.has(old.id))records.set(old.id,{...old,active:false});
  const at=new Date().toISOString(),snapshot={generatedAt:at,refresh:{checkedAt:at,complete:true,calls,totalRows:received,currentRecords:current},records:[...records.values()]};
  fs.writeFileSync('data/'+service.file+'.tmp',JSON.stringify(snapshot));fs.renameSync('data/'+service.file+'.tmp','data/'+service.file);
  console.log(JSON.stringify({source:name,records:records.size,...snapshot.refresh}));
 }catch(error){failures++;const safe=/^(연결 실패|HTTP \d{3}|응답 형식 오류|인증 또는 제공 상태 확인 필요|목록 완전성 확인 실패|페이지 누락)$/.test(error.message)?error.message:'수집 실패';console.error(name+': '+safe+' — 기존 자료 보존');}
}
if(failures)process.exitCode=1;
