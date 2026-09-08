import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd());
const ts=require('typescript');const rules={exports:{}};new Function('exports','module',ts.transpileModule(fs.readFileSync('lib/parkingRules.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(rules.exports,rules);
const key=process.env.PARKING_API_KEY||process.env.DATA_GO_KR_KEY;
if(!key)throw new Error('Parking API key not configured');
// Bounded partial index, never pretend this is nationwide complete coverage.
fs.mkdirSync('.cache/parking',{recursive:true});
const pages=80, realtimePageCount=3, size=10, calls={PrkSttusInfo:0,PrkOprInfo:0,PrkRealtimeInfo:0};
async function page(endpoint,pageNo){const cacheFile='.cache/parking/'+endpoint+'-'+size+'-'+pageNo+'.json';if(endpoint!=='PrkRealtimeInfo'&&fs.existsSync(cacheFile)){try{const saved=JSON.parse(fs.readFileSync(cacheFile,'utf8'));if(Date.now()-Date.parse(saved.at)<7*86400000)return {...saved.value,at:saved.at};}catch{}}calls[endpoint]++;const url=new URL('https://apis.data.go.kr/B553881/Parking/'+endpoint);url.search=new URLSearchParams({serviceKey:decodeURIComponent(key),pageNo:String(pageNo),numOfRows:String(endpoint==='PrkRealtimeInfo'?1000:size),format:'2'}).toString();try{const res=await fetch(url,{headers:{Connection:'close'},signal:AbortSignal.timeout(10000)});if(!res.ok)throw Error('HTTP '+res.status);const json=await res.json();if(!['0','00'].includes(String(json.resultCode))||!Array.isArray(json[endpoint]))throw Error('Provider response rejected');const value={rows:json[endpoint],total:Number(json.totalCount),at:new Date().toISOString()};if(endpoint!=='PrkRealtimeInfo')fs.writeFileSync(cacheFile,JSON.stringify({at:new Date().toISOString(),value}));return value;}catch(error){console.error(endpoint+' page '+pageNo+': '+(error.name==='TimeoutError'?'timeout':'request failed'));return null;}}
const facilities=[],operations=[],realtimePages=[],totals={},collectionTimes=[];let failed=false;
for(let batch=0;batch<pages;batch+=4)await Promise.all(Array.from({length:Math.min(4,pages-batch)},async(_,offset)=>{const p=1+(batch+offset)*5;const f=await page('PrkSttusInfo',p)||await page('PrkSttusInfo',p);const o=await page('PrkOprInfo',p)||await page('PrkOprInfo',p);if(!f||!o){failed=true;return;}collectionTimes.push(f.at,o.at);facilities.push(...f.rows);operations.push(...o.rows);totals.facilities=f.total;totals.operations=o.total;console.log('static page '+p+' collected');}));
for(let p=1;p<=realtimePageCount;p++){const r=await page('PrkRealtimeInfo',p);if(r){realtimePages.push({page:p,rows:r.rows});totals.realtime=r.total;}}
if(facilities.length<100)throw Error('Incomplete static refresh: existing snapshot preserved');
const {lots,quality}=rules.exports.mergeParking(facilities,operations,realtimePages);
if(lots.length<100)throw Error('Too few validated parking facilities: existing snapshot preserved');
const previous=JSON.parse(fs.readFileSync('data/parking.json','utf8'));if(lots.length<previous.lots.length*0.8)throw Error('Coverage dropped: previous snapshot preserved');
const result={version:1,incompleteRefresh:failed,generatedAt:new Date().toISOString(),collectedAt:new Date(Math.min(...collectionTimes.map(t=>Date.parse(t)))).toISOString(),partial:true,pageSize:size,staticPageNumbers:Array.from({length:pages},(_,i)=>1+i*5),staticPages:pages,realtimePages:realtimePages.map(p=>p.page),providerTotals:totals,calls,quality,lots:lots.sort((a,b)=>a.id.localeCompare(b.id))};
// Generated public data is a mechanical collector output; never contains request URLs or secrets.
fs.writeFileSync('data/parking.json',JSON.stringify(result)+'\n');
console.log(JSON.stringify({calls,quality,areas:[...new Set(lots.map(p=>p.area))],partial:true}));
