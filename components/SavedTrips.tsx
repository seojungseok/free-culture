"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import TripStopPhoto from "./TripStopPhoto";
import { SAVED_KEY,parseSaved,type SavedTrip } from "@/lib/planner";
import { todayYmd } from "@/lib/dates";
export default function SavedTrips() {
  const [trips,setTrips]=useState<SavedTrip[]>([]),[loaded,setLoaded]=useState(false),[error,setError]=useState("");
  const [removeId,setRemoveId]=useState<string|null>(null);
  useEffect(()=>{const sync=()=>{try {setTrips(parseSaved(localStorage.getItem(SAVED_KEY)));}catch {setError("브라우저 저장 공간을 사용할 수 없습니다.");}setLoaded(true);};sync();window.addEventListener("storage",sync);return()=>window.removeEventListener("storage",sync);},[]);
  function change(id:string,remove=false) {
    try {
      const current=parseSaved(localStorage.getItem(SAVED_KEY));
      const next=remove ? current.filter(t=>t.id!==id) : [...current.filter(t=>t.id===id),...current.filter(t=>t.id!==id)];
      localStorage.setItem(SAVED_KEY,JSON.stringify(next));setTrips(next);setError("");window.dispatchEvent(new Event("trip-saved"));
    }catch {setError("변경 내용을 저장하지 못했습니다. 저장 공간을 확인해 주세요.");}
  }
  return <><p role="status" className="my-3 text-sm text-red-700">{error}</p>{!loaded ? <p>보관함을 불러오는 중입니다.</p> : !trips.length ? <div className="rounded-2xl border p-6"><p>아직 저장한 장소나 일정이 없습니다.</p><Link href="/plan" className="mt-3 inline-flex min-h-11 items-center font-bold text-brandblue">맞춤 추천으로 시작하기 →</Link></div> :
    <div className="grid gap-4 md:grid-cols-2">{trips.map(t=><article key={t.id} className="rounded-2xl border bg-white p-5"><h2 className="text-lg font-bold">{t.title}</h2>{t.date && <p className="mt-1 text-sm">{t.date}{t.date.replace(/-/g,"")<todayYmd() ? " · 지난 일정" : ""}</p>}
      <ol className="my-4 space-y-3">{t.stops.map((s,i)=><li key={s.href}><Link href={s.href} prefetch={false} className="flex min-w-0 items-start gap-3 rounded-xl font-semibold"><TripStopPhoto src={s.image} title={s.title}/><span className="min-w-0 flex-1 break-words py-1 leading-6">{i+1}. {s.title}</span></Link>{s.end && s.end<todayYmd() && <p className="text-sm text-red-700">저장 당시 일정 기준 종료된 행사입니다.</p>}{s.address && <a className="mt-1 block min-h-8 text-sm text-brandblue" href={"https://map.naver.com/p/search/"+encodeURIComponent(s.address+" "+s.title)} target="_blank" rel="noopener noreferrer">지도에서 위치 확인 ↗</a>}</li>)}</ol>
      <div className="flex flex-wrap gap-3"><button onClick={()=>change(t.id)} className="min-h-11 rounded-lg border px-3 text-sm">맨 위로</button><button onClick={()=>setRemoveId(t.id)} className="min-h-11 rounded-lg border px-3 text-sm">삭제</button></div>
      {removeId===t.id && <div className="mt-3 rounded-lg bg-slate-50 p-3"><p className="text-sm">이 항목을 보관함에서 삭제할까요?</p><div className="mt-2 flex gap-3"><button className="min-h-11 rounded-lg border px-3 text-sm" onClick={()=>{change(t.id,true);setRemoveId(null);}}>삭제 확인</button><button className="min-h-11 rounded-lg border px-3 text-sm" onClick={()=>setRemoveId(null)}>취소</button></div></div>}
    </article>)}</div>}</>;
}
