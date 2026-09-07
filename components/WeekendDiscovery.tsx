"use client";
import {useState} from 'react';
import Link from 'next/link';
import TripCard from './TripCard';
import {weekendCandidates,type WeekendCandidate} from '@/lib/weekendDiscovery';
import {formatKoreanDate,ymdToDash} from '@/lib/dates';
export default function WeekendDiscovery({items,start,end,seasonLabel}:{items:WeekendCandidate[];start:string;end:string;seasonLabel:string}){
 const [area,setArea]=useState(''),[date,setDate]=useState(start),[purpose,setPurpose]=useState('all'),[free,setFree]=useState(false),[kids,setKids]=useState(false),[query,setQuery]=useState(''),[limit,setLimit]=useState(6);
 const areas=[...new Set(items.map(s=>s.area))].sort(),results=weekendCandidates(items,{area,date,purpose,free,kids,query});
 const reset=()=>setLimit(6),field='mt-2 block min-h-11 w-full min-w-0 rounded-xl border bg-white px-3 text-sm';
 return <><section aria-label="주말 나들이 필터" className="rounded-2xl border bg-slate-50 p-4 sm:p-6">
 <h2 className="text-lg font-bold">어느 지역으로 가세요?</h2><p className="mt-2 text-sm leading-6 text-ink-soft">지역부터 선택하면 행사와 나들이 장소를 함께 비교할 수 있어요.</p>
 <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-3">
 <label className="min-w-0 text-sm font-bold">지역<select aria-label="지역" className={field} value={area} onChange={e=>{setArea(e.target.value);reset();}}><option value="">지역 선택</option>{areas.map(a=><option key={a}>{a}</option>)}</select></label>
 <label className="min-w-0 text-sm font-bold">방문일<select aria-label="방문일" className={field} value={date} onChange={e=>{setDate(e.target.value);reset();}}>{[...new Set([start,end])].map(d=><option key={d} value={d}>{formatKoreanDate(d)}</option>)}</select></label>
 <label className="min-w-0 text-sm font-bold">어떤 나들이<select aria-label="어떤 나들이" className={field} value={purpose} onChange={e=>{setPurpose(e.target.value);reset();}}><option value="all">행사 + 나들이 함께</option><option value="event">행사·전시·공연</option><option value="nature">자연·산책</option><option value="season">{seasonLabel} 테마 나들이</option></select></label>
 </div><label className="mt-4 block text-sm font-bold">시·군·구 또는 장소<input type="search" value={query} onChange={e=>{setQuery(e.target.value);reset();}} className={field} placeholder="예: 수원, 양평, 수목원"/></label>
 <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1"><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={free} onChange={e=>{setFree(e.target.checked);reset();}}/>무료 입장 확인된 곳만</label><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={kids} onChange={e=>{setKids(e.target.checked);reset();}}/>아이와 갈 후보만</label></div></section>
 <section aria-live="polite" className="mt-7">{!area?<div className="rounded-xl border border-dashed p-6 text-center text-sm leading-7">위에서 갈 지역을 선택해 주세요.<br/>선택한 지역의 주말 방문 후보를 보여드릴게요.</div>:<><h2 className="text-xl font-bold">{area} · {formatKoreanDate(date)} 방문 후보</h2><p role="status" className="my-3 text-sm text-ink-soft">조건에 맞는 {results.length}곳 · 행사 {results.filter(s=>s.kind==='event').length}곳 / 나들이 {results.filter(s=>s.kind!=='event').length}곳</p>
 <p className="mb-4 text-xs leading-6 text-ink-soft">행사는 등록 기간이 방문일을 포함하는지 확인했습니다. 나들이는 계절 키워드·장소 정보로 고른 후보이며 당일 개방·날씨·개화·단풍 상태를 확인한 결과는 아닙니다. 요금·휴무·예약은 상세페이지에서 확인하세요.</p>
 {!results.length?<p className="rounded-xl bg-slate-50 p-5 text-sm">현재 자료에서 조건에 맞는 곳이 없습니다. 다른 지역·목적을 선택하거나 무료·아이 동반 조건을 해제해 주세요.</p>:<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{results.slice(0,limit).map(s=><div key={s.id} className="min-w-0"><p className="mb-2 text-xs font-bold text-brandblue">{s.kind==='event'?(s.end===date?'선택한 날 종료 예정 · 등록 기간 기준':'선택한 주말 날짜에 포함된 행사'):s.seasonal?seasonLabel+' 키워드와 일치하는 장소':s.nature?'자연·산책 유형의 나들이 후보':'지역 관광정보에서 고른 나들이 후보'}</p><TripCard trip={{id:'weekend:'+date+':'+s.id,title:s.title,date:ymdToDash(date),stops:[s]}}/></div>)}</div>}
 {results.length>limit&&<button onClick={()=>setLimit(n=>n+6)} className="mx-auto mt-6 block min-h-11 rounded-xl border px-6 font-bold">후보 6곳 더 보기</button>}</>}</section>
 <div className="mt-8 flex flex-wrap gap-4 text-sm font-bold text-brandblue"><Link href="/plan" className="inline-flex min-h-11 items-center">주변 장소까지 묶어 일정 만들기 →</Link><Link href="/saved" className="inline-flex min-h-11 items-center">보관함 보기 →</Link></div></>;
}
