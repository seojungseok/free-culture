import { isEventPublished } from './event-publication.mjs';

export const NEAR_KINDS = [
  {value:'all', label:'전체'}, {value:'place', label:'나들이'}, {value:'event', label:'문화행사'},
  {value:'festival', label:'축제'}, {value:'food', label:'맛집'}, {value:'camp', label:'캠핑장'},
  {value:'playground', label:'놀이터'}, {value:'pet', label:'반려동물 동반'}, {value:'access', label:'이동·영유아 편의'},
  {value:'rural', label:'농촌·어촌 체험'}, {value:'experience', label:'가족·과학 체험'},
  {value:'class', label:'문화·취미 강좌'}, {value:'date', label:'카페 데이트 코스'},
] as const;
export type NearKind = typeof NEAR_KINDS[number]['value'];
export type NearOrder = 'mixed'|'nearest';
export const NEAR_RADII = [5,10,20,50] as const;
export const NEAR_PAGE_SIZE = 12;
export type NearPoint = {lat:number;lng:number};
export type NearItem = NearPoint & {
  id:string; title:string; area:string; image:string; url:string; kind:Exclude<NearKind,'all'>;
  note?:string; endDate?:string; expiresAt?:string; published?:boolean; distanceKm?:number;
};
export function validPoint(p:NearPoint){return Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&p.lat>=-90&&p.lat<=90&&p.lng>=-180&&p.lng<=180;}
export function validPlacePoint(p:NearPoint){return validPoint(p)&&p.lat>=33&&p.lat<=39.5&&p.lng>=124&&p.lng<=132;}
export function straightDistance(a:NearPoint,b:NearPoint){
  if(!validPoint(a)||!validPlacePoint(b))return Infinity;
  const rad=(d:number)=>d*Math.PI/180,dLat=rad(b.lat-a.lat),dLon=rad(b.lng-a.lng);
  const s=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;
  return 6371*2*Math.asin(Math.sqrt(Math.min(1,s)));
}
const ko = new Intl.Collator('ko');
export function queryNearby(pool:NearItem[],q:{point?:NearPoint;area?:string;kind:NearKind;radius:number;limit:number;offset:number;order?:NearOrder},today:string){
  const matches:NearItem[]=[];
  for(const item of pool){
    if(q.kind!=='all'&&item.kind!==q.kind || item.published===false || !isEventPublished(item))continue;
    if((item.kind==='event'||item.kind==='festival')&&(!item.endDate||item.endDate.replace(/-/g,'')<today))continue;
    if(q.point){
      const distanceKm=straightDistance(q.point,item);
      if(distanceKm<=q.radius)matches.push({...item,distanceKm});
    }else if(item.area===q.area)matches.push(item);
  }
  matches.sort((a,b)=>(q.point?a.distanceKm!-b.distanceKm!:0)||ko.compare(a.title,b.title));
  const seen=new Set<string>();
  const unique=matches.filter(item=>{
    if(seen.has(item.url))return false;
    seen.add(item.url);return true;
  });
  // Choose the nearest representative of each available kind before pagination.
  // The rest keep their distance order. A single-category search is always sorted.
  let ordered=unique;
  if(q.kind==='all'&&q.order==='mixed'){
    const kinds=new Set<NearKind>(),first:NearItem[]=[],rest:NearItem[]=[];
    for(const item of unique){
      if(kinds.has(item.kind))rest.push(item);
      else {kinds.add(item.kind);first.push(item);}
    }
    ordered=first.concat(rest);
  }
  return {total:ordered.length,items:ordered.slice(q.offset,q.offset+q.limit).map(({lat,lng,...item})=>item),hasMore:q.offset+q.limit<ordered.length};
}
export const nearDistanceLabel=(km:number)=>km<1?`약 ${Math.round(km*1000)}m`:`약 ${km.toFixed(1)}km`;
