import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadSourceEnv} from './lib/sourceEnv.mjs';
import {normalizeLearningClass} from '../lib/learning.mjs';
const endpoint='https://api.data.go.kr/openapi/tn_pubr_public_lftm_lrn_lctre_api';
export async function collectLearning({key,fetchImpl=fetch,pause=ms=>new Promise(resolve=>setTimeout(resolve,ms)),now=new Date(),maxPages=100}={}){
 if(!key)throw new Error('공공 API 인증키 없음');
 const today=new Date(now.getTime()+9*3600000).toISOString().slice(0,10),courses=new Map();
 const rows=1000;let total=0,received=0,calls=0;
 for(let page=1;page<=maxPages;page++){
  const url=new URL(endpoint);url.search=new URLSearchParams({serviceKey:decodeURIComponent(key),type:'json',pageNo:String(page),numOfRows:String(rows)}).toString();
  let response;try{calls++;response=await fetchImpl(url,{signal:AbortSignal.timeout(30000)});}catch{throw new Error('평생학습 API 연결 실패');}
  if(!response.ok)throw new Error('평생학습 API HTTP '+response.status);
  let json;try{json=await response.json();}catch{throw new Error('평생학습 API 응답 형식 오류');}
  const data=json.response||json;
  if(String(data.header?.resultCode)!=='00')throw new Error('평생학습 API 승인 또는 제공 상태 확인 필요');
  const count=Number(data.body?.totalCount);
  if(!Number.isInteger(count)||count<=0||count>maxPages*rows)throw new Error('평생학습 API 전체 건수 확인 필요');
  if(page===1)total=count;else if(count!==total)throw new Error('평생학습 API 수집 중 목록 변경 — 기존 자료 보존');
  const items=data.body?.items?.item;
  if(!Array.isArray(items)||!items.length)throw new Error('평생학습 API 페이지 누락');
  received+=items.length;
  for(const row of items){const course=normalizeLearningClass(row);if(course&&course.end>=today&&course.referenceDate<=today)courses.set(course.id,course);}
  if(received>=total)break;
  if(page===maxPages)throw new Error('평생학습 API 수집 예산 초과');
  await pause(1000);
 }
 if(received!==total||!courses.size)throw new Error('평생학습 API 완전성 확인 실패');
 const at=now.toISOString();
 return {generatedAt:at,refresh:{checkedAt:at,complete:true,calls,totalRows:received},source:'전국평생학습강좌표준데이터 · 지방자치단체·교육청',sourceUrl:'https://www.data.go.kr/data/15013110/standard.do',courses:[...courses.values()].sort((a,b)=>b.referenceDate.localeCompare(a.referenceDate)||a.title.localeCompare(b.title,'ko'))};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 loadSourceEnv();
 try{
  const result=await collectLearning({key:process.env.DATA_GO_KR_KEY});
  const old=fs.existsSync('data/learning-classes.json')?JSON.parse(fs.readFileSync('data/learning-classes.json','utf8')):{courses:[]},ids=new Set(result.courses.map(course=>course.id));
  result.archivedCourses=[...new Map([...(old.archivedCourses||[]),...old.courses].filter(course=>!ids.has(course.id)).map(course=>[course.id,course])).values()];
  fs.writeFileSync('data/learning-classes.json.tmp',JSON.stringify(result));
  fs.renameSync('data/learning-classes.json.tmp','data/learning-classes.json');
  console.log(JSON.stringify({courses:result.courses.length,...result.refresh}));
 }catch(error){console.error(error.message.startsWith('평생학습')||error.message==='공공 API 인증키 없음'?error.message:'평생학습 수집 실패 — 기존 자료 보존');process.exitCode=1;}
}
