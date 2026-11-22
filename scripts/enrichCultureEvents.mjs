import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCache,writeCache,createBudget,sleep,QuotaError,safeApiError } from './lib/tourClient.mjs';
import { loadSourceEnv } from './lib/sourceEnv.mjs';
import { cultureDetail,publicSourceUrl,eventVenueUrl,extractEventSource,fetchSourcePage,SOURCE_PARSER_VERSION } from './lib/cultureSource.mjs';
export async function enrichCultureEvents({events,store,max=200,pageMax=80,workers=2,detailFetcher=cultureDetail,pageFetcher=fetchSourcePage,now=()=>new Date(),pause=sleep,onProgress=()=>{}}) {
  store.events ||= {};
  const budget=createBudget(max);let checked=0,descriptions=0,links=0,failures=0,deferred=0,pages=0,pageDetails=0,index=0,stopped=false;
  const eligible=events.filter(event=>(!event.contents?.trim()||!event.venueUrl||!event.address||!event.phone)&&(!store.events[event.id]?.providerCheckedAt||now().getTime()-Date.parse(store.events[event.id].providerCheckedAt)>7*86400000));
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
        const venueUrl=eventVenueUrl(event.place,item,event);
        if(venueUrl)event.venueUrl=venueUrl;
        else delete event.venueUrl;
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
  const today=new Date(now().getTime()+9*3600000).toISOString().slice(0,10).replace(/-/g,'');
  const pageTargets=events.filter(event=>{
    const prior=store.events[event.id]||{};
    if(event.endDate<today||!publicSourceUrl(event.officialUrl))return false;
    const age=now().getTime()-Date.parse(prior.pageCheckedAt||0);
    if(prior.pageResult==='source-http-429'&&age<86400000)return false;
    return !prior.pageCheckedAt||age>7*86400000||prior.parserVersion!==SOURCE_PARSER_VERSION;
  }).sort((a,b)=>{
    const missing=e=>Number(Boolean(store.events[e.id]?.sourceDetail));
    return missing(a)-missing(b)||Number(b.featured)-Number(a.featured)||
      Math.max(0,Number(a.startDate)-Number(today))-Math.max(0,Number(b.startDate)-Number(today));
  }).slice(0,pageMax);
  index=0;
  const hostNext=new Map();
  let sourceRequests=0,portalDetails=0;
  async function readSource(url,event) {
    const host=new URL(url).host;
    const start=Math.max(Date.now(),hostNext.get(host)||0);hostNext.set(host,start+700);
    if(start>Date.now())await pause(start-Date.now());
    sourceRequests++;
    try {
      const response=await pageFetcher(url);
      return extractEventSource(response.html,event,response.url);
    } catch(error) {
      return {status:String(error.message||'').match(/^(source-[a-z-]+(?:-\d{3})?|unsafe-source)$/)?.[0]||'source-unavailable',url,facts:[]};
    }
  }
  const signature=detail=>JSON.stringify({facts:detail?.facts?.map(({label,value,sourceUrl})=>({label,value,sourceUrl})),programme:detail?.programme,excerpt:detail?.excerpt});
  await Promise.all(Array.from({length:Math.max(1,Math.min(4,workers))},async()=>{
    while(index<pageTargets.length){
      const event=pageTargets[index++],url=publicSourceUrl(event.officialUrl);
      const previous=store.events[event.id]||{};
      const result=await readSource(url,event);
      const verified=result.status==='verified'?[result]:[];
      // The provider's public, per-ID detail is a second official source, not a
      // search result. Identity and registered dates must pass the same parser.
      let portal;
      if(/^\d+$/.test(event.id)&&!new URL(url).hostname.endsWith('culture.go.kr')&&
        (new Set(result.facts.map(f=>f.value)).size<4||!result.facts.some(f=>/소요|러닝/.test(f.label))||!result.facts.some(f=>/시간/.test(f.label)&&/\d:\d/.test(f.value)))) {
        const portalUrl=`https://www.culture.go.kr/portal/cltInfo/oneCltInfo/oneCltInfoView.do?menuNo=200010&pblprfrSn=${event.id}`;
        portal=await readSource(portalUrl,event);
        if(portal.status==='verified'){verified.push(portal);portalDetails++;}
      }
      const checkedAt=now().toISOString();
      const record={...previous,pageUrl:url,pageCheckedAt:checkedAt,pageResult:result.status,parserVersion:SOURCE_PARSER_VERSION,
        ...(portal?{portalResult:portal.status,portalCheckedAt:checkedAt}:{})};
      if(verified.length) {
        const facts=[];
        for(const source of verified)for(const fact of source.facts) {
          const label=fact.label==='공연시간'?'행사시간':fact.label;
          if(!facts.some(row=>row.label===label))facts.push({...fact,label,sourceUrl:source.url});
        }
        const detail={...verified[0],facts,
          programme:verified.find(source=>source.programme?.length)?.programme,
          excerpt:verified.find(source=>source.excerpt)?.excerpt||'',
          sources:verified.map(source=>({url:source.url,title:source.title,checkedAt})),
          eventTitle:event.title,eventStartDate:event.startDate,eventEndDate:event.endDate,checkedAt};
        detail.contentUpdatedAt=signature(previous.sourceDetail)===signature(detail)?previous.sourceDetail?.contentUpdatedAt||previous.sourceDetail?.checkedAt:checkedAt;
        record.sourceDetail=detail;pageDetails++;
      } else if(result.status==='schedule-conflict'||result.status==='identity-unconfirmed') {
        // A different event or edition must never retain old participation facts.
        record.sourceDetail=undefined;
      }
      store.events[event.id]=record;
      pages++;if(pages%25===0)onProgress({pages,pageDetails,sourceRequests,portalDetails});
    }
  }));
  return {targets:targets.length,checked,descriptions,links,failures,deferred,requests:budget.used,pages,pageDetails,sourceRequests,portalDetails,exitCode:failures?1:deferred?75:0};
}
async function main(){
  loadSourceEnv();
  const data=readCache('events.json',{events:[]}),store=readCache('event-source-details.json',{events:{}});
  const max=Math.min(1200,Math.max(0,Number(process.env.CULTURE_DETAIL_DAILY??200))),pageMax=Math.min(1200,Math.max(0,Number(process.env.CULTURE_SOURCE_PAGES??80)));
  const result=await enrichCultureEvents({events:data.events,store,max,pageMax,workers:Number(process.env.CULTURE_SOURCE_WORKERS||2),onProgress:r=>console.log(JSON.stringify(r))});
  if(result.checked){writeCache('events.json',data);}
  if(result.checked||result.pages)writeCache('event-source-details.json',store);
  console.log(JSON.stringify(result));process.exitCode=result.exitCode;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(safeApiError(error));process.exitCode=1;});
