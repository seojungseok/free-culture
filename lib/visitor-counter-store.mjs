import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {visitorDay} from './visitor-count.mjs';

const idPattern=/^[a-zA-Z0-9_-]{16,80}$/;
const hashPattern=/^[a-f0-9]{64}$/;
const journalPattern=/^(\d{8})\.visits$/;
const count=value=>Number.isSafeInteger(value)&&value>=0;
export const validVisitorId=value=>typeof value==='string'&&idPattern.test(value);

// One append-only journal per Korean day. One O_APPEND write + fsync commits
// each visit; replay deduplicates daily hashes across workers and retries.
// No IP, URL, user agent, raw session token, or external write is retained.
/** @param {{directory?:string,baseline?:{version:number,namespace:string,day:string,total:number,today:number},now?:()=>Date}} [options] */
export function createFileVisitorCounter({directory,baseline,now=()=>new Date()}={}){
 const cache=new Map();let recoveryInFlight=null;
 function flushDirectory(){
  if(process.platform==='win32')return;
  const fd=fs.openSync(directory,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 }
 function root(){
  if(!directory)throw Error('Persistent visitor storage is not configured');
  fs.mkdirSync(directory,{recursive:true,mode:0o700});
  const file=path.join(directory,'baseline.json');
  if(!fs.existsSync(file)){
   if(baseline?.version!==1||baseline.namespace!=='weekendpick-kr'||!/^\d{8}$/.test(baseline.day)||!count(baseline.total)||!count(baseline.today)||baseline.today>baseline.total)throw Error('Verified historical visitor baseline is required');
   try{const fd=fs.openSync(file,'wx',0o600);try{fs.writeFileSync(fd,JSON.stringify(baseline)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}flushDirectory();}catch(error){if(error.code!=='EEXIST')throw error;}
  }
  return file;
 }
 function history(){
  const seed=JSON.parse(fs.readFileSync(root(),'utf8'));
  if(seed.version!==1||seed.namespace!=='weekendpick-kr'||!/^\d{8}$/.test(seed.day)||!count(seed.total)||!count(seed.today)||seed.today>seed.total)throw Error('Invalid historical visitor baseline');
  let recovered=false,rows='';
  try{rows=fs.readFileSync(path.join(directory,'legacy-recovery.jsonl'),'utf8');}catch(error){if(error.code!=='ENOENT')throw error;}
  for(const line of rows.slice(0,rows.lastIndexOf('\n')+1).split('\n')){
   if(!line.trim())continue;let row;try{row=JSON.parse(line);}catch{continue;}
   if(row.day!==seed.day)continue;
   if(count(row.total))seed.total=Math.max(seed.total,row.total);
   if(count(row.today))seed.today=Math.max(seed.today,row.today);
   if(row.complete===true)recovered=true;
  }
  if(seed.today>seed.total)throw Error('Historical visitor counts do not reconcile');
  return {...seed,recovered};
 }
 function readDay(day){
  const file=path.join(directory,day+'.visits');let stat;
  try{stat=fs.statSync(file);}catch(error){if(error.code==='ENOENT')return {ids:new Set(),count:0};throw error;}
  const signature=`${stat.size}:${stat.mtimeMs}`,previous=cache.get(day);if(previous?.signature===signature)return previous;
  const content=fs.readFileSync(file,'utf8');
  const ids=new Set(content.slice(0,content.lastIndexOf('\n')+1).split('\n').filter(line=>hashPattern.test(line)));
  const result={signature,ids,count:ids.size};cache.set(day,result);return result;
 }
 function append(file,line){
  const fd=fs.openSync(file,'a',0o600);
  try{const record=Buffer.from('\n'+line+'\n');if(fs.writeSync(fd,record)!==record.length)throw Error('Incomplete visitor record');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}flushDirectory();
 }
 function get(){
  const seed=history(),day=visitorDay(now());if(day<seed.day)throw Error('Server date precedes the visitor baseline');
  let total=seed.total,today=day===seed.day?seed.today:0;
  for(const name of fs.readdirSync(directory)){
   const match=journalPattern.exec(name);if(!match||match[1]<seed.day||match[1]>day)continue;
   const amount=readDay(match[1]).count;total+=amount;if(match[1]===day)today+=amount;
  }
  if(!count(total)||!count(today))throw Error('Visitor count overflow');return {day,total,today};
 }
 function hit(visitId){
  if(!validVisitorId(visitId))throw Error('Invalid visitor id');root();const day=visitorDay(now());
  const id=createHash('sha256').update(day+'\0'+visitId).digest('hex'),recorded=!readDay(day).ids.has(id);
  if(recorded){append(path.join(directory,day+'.visits'),id);cache.delete(day);}return {...get(),recorded};
 }
 // Only bounded GETs of the original keys, outside the visitor response path.
 // Once both keys recover, the existing maximum is retained permanently.
 async function reconcileLegacy({fetcher=fetch}={}){
  if(recoveryInFlight)return recoveryInFlight;
  const seed=history();if(seed.recovered)return false;
  recoveryInFlight=(async()=>{
   const values=await Promise.all(['total','d'+seed.day].map(async key=>{
    try{const response=await fetcher('https://abacus.jsn.cam/get/weekendpick-kr/'+key,{cache:'no-store',redirect:'error',headers:{Accept:'application/json'},signal:AbortSignal.timeout(15000)});if(!response.ok)return null;const data=await response.json();return count(data?.value)?data.value:null;}catch{return null;}
   }));
   if(values.every(value=>value===null))return false;
   const row={day:seed.day,checkedAt:now().toISOString(),...(values[0]!==null?{total:values[0]}:{}),...(values[1]!==null?{today:values[1]}:{}),complete:values.every(value=>value!==null)};
   if(Math.max(seed.today,row.today||0)>Math.max(seed.total,row.total||0))return false;
   append(path.join(directory,'legacy-recovery.jsonl'),JSON.stringify(row));return row.complete;
  })();
  try{return await recoveryInFlight;}finally{recoveryInFlight=null;}
 }
 return {get,hit,reconcileLegacy};
}
