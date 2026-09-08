'use client';
import {useState} from 'react';
type Result={state:'available';available:number;total:number;checkedAt:string}|{state:'unavailable'};
export default function ParkingAvailability({id}:{id:string}){
 const [result,setResult]=useState<Result|null>(null),[loading,setLoading]=useState(false);
 async function check(){if(loading||result)return;setLoading(true);try{const res=await fetch('/api/parking/realtime?id='+encodeURIComponent(id),{signal:AbortSignal.timeout(9000)});if(!res.ok)throw Error();setResult(await res.json());}catch{setResult({state:'unavailable'});}finally{setLoading(false);}}
 return <div className="mt-2"><button type="button" onClick={check} disabled={loading||!!result} className="min-h-11 rounded-lg border border-slate-200 px-3 text-xs font-bold text-brandblue disabled:text-ink-soft">{loading?'조회 중…':result?'조회 완료':'잔여 주차면 확인'}</button><p role="status" className="mt-1 text-xs leading-5 text-ink-soft">{result?.state==='available'?`잔여 ${result.available} / ${result.total}면 · API 조회 ${new Date(result.checkedAt).toLocaleTimeString('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false})} 기준. 제공기관 갱신 시각은 없으며 도착 시 빈자리를 보장하지 않습니다.`:result?.state==='unavailable'?'현재 확인 가능한 잔여면 정보가 없습니다. 주차장 위치·운영 안내는 그대로 확인할 수 있어요.':''}</p></div>;
}
