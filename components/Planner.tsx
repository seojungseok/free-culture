"use client";
import { useState } from "react";
import Link from "next/link";
import { makePlans, type TripOption, type SavedTrip } from "@/lib/planner";
import TripCard from "./TripCard";
export default function Planner({options,initialDate,minDate,maxDate}: {options:TripOption[];initialDate:string;minDate:string;maxDate:string}) {
  const areas=[...new Set(options.map(o=>o.anchor.area))].sort();
  const [area,setArea]=useState(areas.includes("서울")?"서울":areas[0]||"");
  const [date,setDate]=useState(initialDate),[hours,setHours]=useState(4),[kids,setKids]=useState(false),[free,setFree]=useState(false);
  const [results,setResults]=useState<SavedTrip[]|null>(null);
  const [error,setError]=useState("");
  return <><form onSubmit={e=>{e.preventDefault();if(date<minDate||date>maxDate){setError("오늘부터 60일 이내의 날짜를 선택해 주세요.");return;}setError("");setResults(makePlans(options,{area,date,hours,kids,free}));}} className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="text-sm font-bold">지역<select className="mt-2 block min-h-11 w-full rounded-lg border p-2" value={area} onChange={e=>{setArea(e.target.value);setResults(null);}}>{areas.map(a=><option key={a}>{a}</option>)}</select></label>
      <label className="text-sm font-bold">방문 날짜<input required type="date" value={date} min={minDate} max={maxDate} onChange={e=>{setDate(e.target.value);setResults(null);}} className="mt-2 block min-h-11 w-full min-w-0 rounded-lg border p-2"/></label>
      <label className="text-sm font-bold">여유 시간<select value={hours} onChange={e=>{setHours(Number(e.target.value));setResults(null);}} className="mt-2 block min-h-11 w-full rounded-lg border p-2"><option value={2}>2시간 · 1곳부터</option><option value={4}>4시간 · 최대 2곳</option><option value={6}>6시간 · 최대 3곳</option></select></label>
    </div>
    <div className="my-4 flex flex-wrap gap-x-5 gap-y-2">
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={kids} onChange={e=>{setKids(e.target.checked);setResults(null);}}/>아이와 갈 후보만</label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={free} onChange={e=>{setFree(e.target.checked);setResults(null);}}/>무료 입장 확인된 곳만</label>
    </div>
    <p className="mb-4 text-xs leading-6 text-ink-soft">시간은 장소 수를 정하는 기준이며 이동·대기·관람시간을 보장하지 않습니다. 무료 입장에도 체험·주차·식사비는 별도일 수 있습니다. 운영시간과 예약 조건은 상세페이지에서 확인해 주세요.</p>
    <button className="min-h-12 w-full rounded-xl bg-brandblue px-6 py-3 font-bold text-white sm:w-auto">내 조건으로 추천 보기</button>
    <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>
    <p className="mt-3 text-xs leading-6 text-ink-soft">반려동물과 이동 편의 조건은 검증된 상세 정보가 필요합니다. <Link href="/pet-travel" className="underline">반려동물 동반 조건 확인</Link></p>
  </form>
  <section aria-live="polite" className="mt-7">
    {results && <><h2 className="mb-3 text-xl font-bold">{results.length ? "조건에 맞는 방문 후보 "+results.length+"개" : "확인된 데이터에서 조건에 맞는 후보가 없습니다"}</h2><p className="mb-4 text-sm text-ink-soft">{results.length ? "공개 자료의 날짜·위치·조건으로 선정했습니다. 인기도 순위가 아니며 실제 동선과 운영 여부는 출발 전 확인하세요." : "다른 지역이나 날짜를 선택해 보세요. 조건을 임의로 완화하지 않습니다."}</p><div className="grid gap-4 lg:grid-cols-3">{results.map(t=><TripCard key={t.id} trip={t}/>)}</div></>}
  </section><Link href="/saved" className="mt-6 inline-flex min-h-11 items-center font-bold text-brandblue">보관함에서 일정 확인 →</Link></>;
}
