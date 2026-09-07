"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { makePlans, type TripOption, type SavedTrip } from "@/lib/planner";
import TripCard from "./TripCard";
export default function Planner({options,initialDate,minDate,maxDate}: {options:TripOption[];initialDate:string;minDate:string;maxDate:string}) {
  const areas=[...new Set(options.map(o=>o.anchor.area))].sort();
  const [area,setArea]=useState(areas.includes("서울")?"서울":areas[0]||"");
  const [date,setDate]=useState(initialDate),[hours,setHours]=useState(4),[kids,setKids]=useState(false),[free,setFree]=useState(false);
  const [purpose,setPurpose]=useState('all'),[meal,setMeal]=useState(false),[parking,setParking]=useState('any'),[access,setAccess]=useState('any'),[query,setQuery]=useState('');
  const [results,setResults]=useState<SavedTrip[]|null>(null);
  const [error,setError]=useState("");
  const [ready,setReady]=useState(false);
  useEffect(()=>{setReady(true);},[]);
  // Do not allow native form submission before React attaches the submit handler.
  return <><form inert={!ready} aria-busy={!ready} onSubmit={e=>{e.preventDefault();if(date<minDate||date>maxDate){setError("오늘부터 60일 이내의 날짜를 선택해 주세요.");return;}setError("");setResults(makePlans(options,{area,date,hours,kids,free,purpose,meal,parking,access,query}));}} className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="min-w-0 text-sm font-bold">지역<select aria-label="지역" className="mt-2 block min-h-11 w-full rounded-lg border p-2" value={area} onChange={e=>{setArea(e.target.value);setResults(null);}}>{areas.map(a=><option key={a}>{a}</option>)}</select></label>
      <label className="text-sm font-bold">방문 날짜<input required type="date" value={date} min={minDate} max={maxDate} onChange={e=>{setDate(e.target.value);setResults(null);}} className="mt-2 block min-h-11 w-full min-w-0 rounded-lg border p-2"/></label>
      <label className="min-w-0 text-sm font-bold">일정 규모<select aria-label="일정 규모" value={hours} onChange={e=>{setHours(Number(e.target.value));setResults(null);}} className="mt-2 block min-h-11 w-full rounded-lg border p-2"><option value={0}>시간 미정 · 최대 3곳</option><option value={2}>가볍게 1곳</option><option value={4}>반나절 · 최대 2곳</option><option value={6}>여유 있게 · 최대 3곳</option><option value={8}>하루 나들이 · 최대 4곳</option></select></label>
    </div>
    <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
    <label className="min-w-0 text-sm font-bold">나들이 목적<select aria-label="나들이 목적" value={purpose} onChange={e=>{setPurpose(e.target.value);setResults(null);}} className="mt-2 min-h-11 w-full rounded-lg border p-2"><option value="all">다양하게 함께</option><option value="walk">공원·정원·산책</option><option value="culture">박물관·전시·문화</option><option value="event">날짜 있는 문화행사 중심</option><option value="food">맛집·식사 중심</option></select></label>
    <label className="min-w-0 text-sm font-bold">시·군·구 / 장소 검색<input aria-label="시·군·구 / 장소 검색" type="search" value={query} onChange={e=>{setQuery(e.target.value);setResults(null);}} placeholder="예: 강릉, 양평, 공원" className="mt-2 min-h-11 w-full min-w-0 rounded-lg border p-2"/></label>
    <label className="min-w-0 text-sm font-bold">주차 조건<select aria-label="주차 조건" value={parking} onChange={e=>{setParking(e.target.value);setResults(null);}} className="mt-2 min-h-11 w-full rounded-lg border p-2"><option value="any">주차 조건 없음</option><option value="prefer">주차 가능 안내 있는 곳 우선</option><option value="required">모든 장소 주차 가능 안내 필수</option></select></label>
    <label className="min-w-0 text-sm font-bold">이동 편의 조건<select aria-label="이동 편의 조건" value={access} onChange={e=>{setAccess(e.target.value);setResults(null);}} className="mt-2 min-h-11 w-full rounded-lg border p-2"><option value="any">이동 편의 조건 없음</option><option value="info">장애인 편의시설 안내 있는 곳</option><option value="wheelchair">휠체어 진입 가능 안내 확인된 곳</option></select></label>
    </div>
    <div className="my-4 flex flex-wrap gap-x-5 gap-y-2">
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={kids} onChange={e=>{setKids(e.target.checked);setResults(null);}}/>아이와 갈 후보만</label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={free} onChange={e=>{setFree(e.target.checked);setResults(null);}}/>무료 입장 확인된 곳만</label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={meal} onChange={e=>{setMeal(e.target.checked);setResults(null);}}/>주변 식사 후보 포함</label>
    </div>
    <p className="mb-3 text-xs leading-6 text-ink-soft">일정 규모는 장소 수 기준이며 실제 이동·관람시간을 보장하지 않습니다. 식사 포함 시 최소 2곳을 찾으며, 무료 입장 조건에도 식사·체험·주차비는 별도입니다. 식당이 확인되지 않으면 조건을 임의로 완화하지 않습니다.</p>
    <p className="mb-4 rounded-lg bg-slate-50 p-3 text-xs leading-6 text-ink-soft">주차는 저장된 안내 기준으로, 실시간 빈자리·주차 편리함을 보장하지 않습니다. 이동 편의 자료는 아직 제한적입니다. 휠체어 대여·장애인 할인은 진입 가능으로 간주하지 않으며, 안내가 없는 곳은 해당 필수 조건에서 제외합니다. 최종 이용 가능 여부는 상세 안내와 운영처에 확인하세요.</p>
    <button type="submit" disabled={!ready} className="min-h-12 w-full rounded-xl bg-brandblue px-6 py-3 font-bold text-white disabled:cursor-wait disabled:opacity-60 sm:w-auto">내 조건으로 추천 보기</button>
    <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>
    <p className="mt-3 text-xs leading-6 text-ink-soft">반려동물과 이동 편의 조건은 검증된 상세 정보가 필요합니다. <Link href="/pet-travel" className="underline">반려동물 동반 조건 확인</Link></p>
  </form>
  <section aria-live="polite" className="mt-7">
    {results && <><h2 className="mb-3 text-xl font-bold">{results.length ? "조건에 맞는 방문 후보 "+results.length+"개" : "확인된 데이터에서 조건에 맞는 후보가 없습니다"}</h2><p className="mb-4 text-sm text-ink-soft">{results.length ? "공개 자료의 날짜·위치·조건으로 선정했습니다. 인기도 순위가 아니며 실제 동선과 운영 여부는 출발 전 확인하세요." : "다른 지역이나 날짜를 선택해 보세요. 조건을 임의로 완화하지 않습니다."}</p><div className="grid gap-4 lg:grid-cols-3">{results.map(t=><TripCard key={t.id} trip={t}/>)}</div></>}
  </section><Link href="/saved" className="mt-6 inline-flex min-h-11 items-center font-bold text-brandblue">보관함에서 일정 확인 →</Link></>;
}
