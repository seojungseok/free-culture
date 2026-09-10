export const NEAR_KINDS = [{value:'all',label:'전체'},{value:'place',label:'나들이'},{value:'event',label:'문화행사'},{value:'ticket',label:'입장권·체험'},{value:'food',label:'맛집'}] as const;
export type NearKind = typeof NEAR_KINDS[number]['value'];
export const NEAR_RADII = [5,10,20,50] as const;
export type NearPoint = {lat:number;lng:number};
export type NearItem = {id:string;title:string;area:string;image:string;url:string;kind:Exclude<NearKind,'all'>;lat:number;lng:number;endDate?:string;published?:boolean;distanceKm?:number};
export function validPoint(p:NearPoint){return Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&p.lat>=-90&&p.lat<=90&&p.lng>=-180&&p.lng<=180;}
export function validPlacePoint(p:NearPoint){return validPoint(p)&&p.lat>=33&&p.lat<=39.5&&p.lng>=124&&p.lng<=132;}
export function straightDistance(a:NearPoint,b:NearPoint){
 if(!validPoint(a)||!validPlacePoint(b))return Infinity;
 const rad=(d:number)=>d*Math.PI/180,dLat=rad(b.lat-a.lat),dLon=rad(b.lng-a.lng);
 const s=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;
 return 6371*2*Math.asin(Math.sqrt(Math.min(1,s)));
}
export function queryNearby(pool:NearItem[],q:{point?:NearPoint;area?:string;kind:NearKind;radius:number;limit:number;offset:number},today:string){
 const matches=pool.filter(p=>p.published!==false&&(p.kind!=='event'||!!p.endDate&&p.endDate.replace(/-/g,'')>=today)&& (q.kind==='all'||p.kind===q.kind))
  .map(p=>({...p,distanceKm:q.point?straightDistance(q.point,p):undefined}))
  .filter(p=>q.point?Number.isFinite(p.distanceKm)&&p.distanceKm!<=q.radius:p.area===q.area)
  .sort((a,b)=>q.point?a.distanceKm!-b.distanceKm!||a.title.localeCompare(b.title,'ko'):a.title.localeCompare(b.title,'ko'));
 const seen=new Set<string>(),unique=matches.filter(p=>{if(seen.has(p.url))return false;seen.add(p.url);return true;});
 return {total:unique.length,items:unique.slice(q.offset,q.offset+q.limit).map(({lat,lng,...p})=>p),hasMore:q.offset+q.limit<unique.length};
}
export const nearDistanceLabel=(km:number)=>km<1?`약 ${Math.round(km*1000)}m`:`약 ${km.toFixed(1)}km`;
