import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCache,writeCache,createBudget,sleep,QuotaError,safeApiError } from './lib/tourClient.mjs';
import { loadSourceEnv } from './lib/sourceEnv.mjs';
import { cultureDetail,publicSourceUrl,extractEventSource,fetchSourcePage,SOURCE_PARSER_VERSION } from './lib/cultureSource.mjs';
export async function enrichCultureEvents({events,store,max=200,pageMax=80,workers=2,detailFetcher=cultureDetail,pageFetcher=fetchSourcePage,now=()=>new Date(),pause=sleep,onProgress=()=>{}}) {
  store.events ||= {};
  const budget=createBudget(max);let checked=0,descriptions=0,links=0,failures=0,deferred=0,pages=0,pageDetails=0,index=0,stopped=false;
  const eligible=events.filter(event=>!event.contents?.trim()&&(!store.events[event.id]?.providerCheckedAt||now().getTime()-Date.parse(store.events[event.id].providerCheckedAt)>7*86400000));
  const targets=eligible.sort((a,b)=>String(store.events[a.id]?.providerCheckedAt||'').localeCompare(String(store.events[b.id]?.providerCheckedAt||''))).slice(0,max);
  await Promise.all(Array.from({length:Math.max(1,Math.min(4,workers))},async()=>{
    while(index<targets.length&&!stopped) {
      const event=targets[index++];
      try {
        const item=await detailFetcher(event.id,budget);
        const checkedAt=now().toISOString();
        const prior=store.events[event.id]||{};
        const contents=String(item.contents1||'').trim();
        if(contents&&!event.contents?.trim()) {event.contents=contents;descriptions++;}
        const url=publicSourceUrl(item.url);
        if(url&&url!==event.officialUrl){event.officialUrl=url;links++;}
        if(item.phone&&!event.phone)event.phone=String(item.phone);
        if(item.placeAddr&&!event.address)event.address=String(item.placeAddr);
        store.events[event.id]={...prior,...(url&&url!==prior.officialUrl?{pageCheckedAt:undefined}:{}),providerCheckedAt:checkedAt,officialUrl:url||publicSourceUrl(event.officialUrl)};
        checked++;
      }catch(error){if(error instanceof QuotaError&&error.reason==='provider'){deferred++;stopped=true;}else{failures++;} }
      if((checked+failures)%50===0) onProgress({checked,descriptions,links,failures,deferred});
      await pause(220);
    }
  }));
  const pageTargets=events.filter(e=>!e.contents?.trim()&&publicSourceUrl(e.officialUrl)&&(!store.events[e.id]?.pageCheckedAt||now().getTime()-Date.parse(store.events[e.id].pageCheckedAt)>7*86400000||store.events[e.id]?.sourceDetail?.status==='verified'&&store.events[e.id]?.parserVersion!==SOURCE_PARSER_VERSION||store.events[e.id]?.pageResult==='identity-unconfirmed'&&!store.events[e.id]?.pageUrl)).sort((a,b)=>String(store.events[a.id]?.pageCheckedAt||'').localeCompare(String(store.events[b.id]?.pageCheckedAt||''))).slice(0,pageMax);
  index=0;
  const hostNext=new Map();
  await Promise.all(Array.from({length:Math.max(1,Math.min(4,workers))},async()=>{
    while(index<pageTargets.length){
      const event=pageTargets[index++],url=publicSourceUrl(event.officialUrl),host=new URL(url).host;
      const start=Math.max(Date.now(),hostNext.get(host)||0);hostNext.set(host,start+650);if(start>Date.now())await pause(start-Date.now());
      const previous=store.events[event.id]||{};
      try{
        const response=await pageFetcher(url);
        const result=extractEventSource(response.html,event,response.url);
        store.events[event.id]={...previous,pageUrl:url,pageCheckedAt:now().toISOString(),pageResult:result.status,parserVersion:SOURCE_PARSER_VERSION,...(result.status==='verified'?{sourceDetail:{...result,eventTitle:event.title,eventStartDate:event.startDate,eventEndDate:event.endDate,checkedAt:now().toISOString()}}:result.status==='schedule-conflict'||result.status==='identity-unconfirmed'?{sourceDetail:undefined}:{})};
        if(result.status==='verified')pageDetails++;
      }catch(error){const status=String(error.message||'').match(/^(source-[a-z-]+(?:-\d{3})?|unsafe-source)$/)?.[0]||'source-unavailable';store.events[event.id]={...previous,pageCheckedAt:now().toISOString(),pageResult:status};}
      pages++;if(pages%25===0)onProgress({pages,pageDetails});
    }
  }));
  return {targets:targets.length,checked,descriptions,links,failures,deferred,requests:budget.used,pages,pageDetails,exitCode:failures?1:deferred?75:0};
}
async function main(){
  loadSourceEnv();
  const data=readCache('events.json',{events:[]}),store=readCache('event-source-details.json',{events:{}});
  const max=Math.min(1200,Math.max(0,Number(process.env.CULTURE_DETAIL_DAILY||200))),pageMax=Math.min(1200,Math.max(0,Number(process.env.CULTURE_SOURCE_PAGES??80)));
  const result=await enrichCultureEvents({events:data.events,store,max,pageMax,workers:Number(process.env.CULTURE_SOURCE_WORKERS||2),onProgress:r=>console.log(JSON.stringify(r))});
  if(result.checked){writeCache('events.json',data);}
  if(result.checked||result.pages)writeCache('event-source-details.json',store);
  console.log(JSON.stringify(result));process.exitCode=result.exitCode;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(safeApiError(error));process.exitCode=1;});
