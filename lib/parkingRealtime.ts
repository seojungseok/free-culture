import 'server-only';
import { unstable_cache } from 'next/cache';
import { parkingSnapshot } from './parking';
import { realtimeValue, type ParkingRow } from './parkingRules';
const inFlight=new Map<number,Promise<{rows:ParkingRow[];checkedAt:string}|null>>();
async function requestPage(page:number){
 if(!Number.isInteger(page)||page<1||page>3||!parkingSnapshot.realtimePages.includes(page))return null;
 const key=process.env.PARKING_API_KEY||process.env.DATA_GO_KR_KEY;if(!key)return null;
 try{const url=new URL('https://apis.data.go.kr/B553881/Parking/PrkRealtimeInfo');url.search=new URLSearchParams({serviceKey:decodeURIComponent(key),pageNo:String(page),numOfRows:'1000',format:'2'}).toString();const res=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(6000)});if(!res.ok)return null;const json=await res.json();if(!['0','00'].includes(String(json.resultCode))||!Array.isArray(json.PrkRealtimeInfo))return null;return {rows:json.PrkRealtimeInfo as ParkingRow[],checkedAt:new Date().toISOString()};}catch{return null;}
}
// Cache both successes and failures across visitors. Only 3 fixed pages are allowed.
// At steady state: 3 pages * 96 windows/day = 288 upstream calls, not calls per visitor.
const cachedPage=unstable_cache(async(page:number)=>{const running=inFlight.get(page);if(running)return running;const task=requestPage(page);inFlight.set(page,task);try{return await task;}finally{inFlight.delete(page);}},['parking-realtime-v1'],{revalidate:900});
export async function getParkingRealtime(id:string){
 const snapshotAge=Date.now()-Date.parse(parkingSnapshot.collectedAt);
 if(!Number.isFinite(snapshotAge)||snapshotAge<0||snapshotAge>30*86400000)return {state:'unavailable' as const};
 const lot=parkingSnapshot.lots.find(p=>p.id===id);if(!lot?.realtimePage)return {state:'unavailable' as const};
 const page=await cachedPage(lot.realtimePage);if(!page)return {state:'unavailable' as const};
 const value=realtimeValue(page.rows,id);const age=Date.now()-Date.parse(page.checkedAt);
 if(!value||!Number.isFinite(age)||age<0||age>15*60*1000||(lot.spaces!==undefined&&lot.spaces!==value.total))return {state:'unavailable' as const};
 return {state:'available' as const,...value,checkedAt:page.checkedAt};
}
