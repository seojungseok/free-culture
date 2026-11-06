import {normalizeAffiliateEvent} from './affiliate-events.mjs';

const KST_OFFSET=9*60*60*1000;
const dateOnly=/^\d{4}-\d{2}-\d{2}$/;
function validDate(value){
 const ms=Date.parse(value+'T00:00:00.000Z');
 return Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,10)===value;
}
function timestamp(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)||!validDate(value.slice(0,10)))return NaN;
 return Date.parse(value);
}
function boundary(value,end){
 if(value===undefined)return end?Infinity:-Infinity;
 if(dateOnly.test(value)){
  if(!validDate(value))throw Error('Invalid date');
  return Date.parse(value+'T00:00:00.000Z')-KST_OFFSET+(end?86400000:0);
 }
 const ms=timestamp(value);if(!Number.isFinite(ms))throw Error('Invalid timestamp');return ms;
}
const emptyCounts=()=>({impressions:0,clicks:0,saveActions:0});
function metrics(counts){return {...counts,clickToImpressionEventRatioPct:counts.impressions?Number((counts.clicks/counts.impressions*100).toFixed(4)):null};}

/** Aggregates only the existing non-identifying event contract; raw rows are never retained. */
export function createAffiliateEventReport({from,to}={}){
 const start=boundary(from,false),end=boundary(to,true);
 if(start>=end)throw Error('The period end must follow its start');
 const quality={inspectedLines:0,blankLines:0,invalidJsonLines:0,invalidEventLines:0,invalidTimestampLines:0,excludedByPeriod:0,acceptedEvents:0};
 const groups=new Map(),totals=emptyCounts();
 function consume(line){
  quality.inspectedLines++;
  if(!line.trim()){quality.blankLines++;return;}
  let raw;try{raw=JSON.parse(line);}catch{quality.invalidJsonLines++;return;}
  const event=normalizeAffiliateEvent(raw);
  if(!event){quality.invalidEventLines++;return;}
  const at=timestamp(raw.at);
  if(!Number.isFinite(at)){quality.invalidTimestampLines++;return;}
  if(at<start||at>=end){quality.excludedByPeriod++;return;}
  const date=new Date(at+KST_OFFSET).toISOString().slice(0,10);
  const dimensions={date,provider:event.provider,placement:event.placement,page:event.page,...(event.productId!==undefined?{productId:event.productId}:{})};
  const key=JSON.stringify(dimensions);
  if(!groups.has(key))groups.set(key,{...dimensions,...emptyCounts()});
  const field={affiliate_impression:'impressions',affiliate_click:'clicks',affiliate_save:'saveActions'}[event.event];
  groups.get(key)[field]++;totals[field]++;quality.acceptedEvents++;
 }
 function finish(){
  const rows=[...groups.values()].sort((a,b)=>JSON.stringify([a.date,a.provider,a.placement,a.page,a.productId||0]).localeCompare(JSON.stringify([b.date,b.provider,b.placement,b.page,b.productId||0]))).map(row=>({...row,clickToImpressionEventRatioPct:metrics(row).clickToImpressionEventRatioPct}));
  return {version:1,timeZone:'Asia/Seoul',period:{fromInclusive:Number.isFinite(start)?new Date(start).toISOString():null,toExclusive:Number.isFinite(end)?new Date(end).toISOString():null},metricLabel:'클릭/노출 이벤트 비율',purchaseCollected:false,notes:[
   '실제 기록된 이벤트 수이며 방문자 수·사용자 전환율·구매·수수료·정산액이 아닙니다.',
   '노출 0건의 비율은 null입니다. 반복 클릭 때문에 비율이 100%를 넘을 수 있습니다.',
   '노출은 컴포넌트별 관찰 기준을 따릅니다. 배너와 카드의 노출 기준이 다르면 직접 우열을 비교하지 마세요.',
   'saveActions는 저장·해제 동작 수입니다. 최종 저장 수가 아닙니다.',
   '사용자 식별자·이벤트 ID가 없어 고유 사용자나 중복 이벤트를 추정하지 않습니다.',
   '광고 위치·노출 기준·계측 수정 전후와 테스트 트래픽 포함 여부를 구분해 해석하세요.',
  ],quality:{...quality},totals:metrics(totals),rows};
 }
 return {consume,finish};
}
