'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import type {WinterCourse} from '@/lib/winterCourses';
import {winterCourseImage} from '@/lib/winterCourseImage.mjs';

type Filters={q?:string;area?:string;duration?:'daytrip'|'overnight'};
export type WinterCoursePreview=Pick<WinterCourse,'id'|'slug'|'title'|'area'|'city'|'duration'|'durationLabel'|'intro'|'image'> & {stops:{name:string;day:number}[]};
const areaOrder=['서울','인천','경기','강원','대전','세종','충북','충남','전북','광주','전남','대구','경북','부산','울산','경남','제주'];
function matching(courses:WinterCoursePreview[],filters:Filters){
 const term=filters.q?.replace(/\s+/g,'').toLowerCase();
 return courses.filter(course=>(!term||[course.title,course.area,course.city,...course.stops.map(stop=>stop.name)].join('').replace(/\s+/g,'').toLowerCase().includes(term))&&(!filters.area||(filters.area==='수도권'?['서울','인천','경기'].includes(course.area):course.area===filters.area))&&(!filters.duration||course.duration===(filters.duration==='overnight'?'1박2일':'당일')));
}

export default function WinterCourseBrowser({courses}:{courses:WinterCoursePreview[]}){
 const router=useRouter();
 const [filters,setFilters]=useState<Filters>({});
 useEffect(()=>{const sync=()=>{const params=new URLSearchParams(window.location.search),duration=params.get('duration');setFilters({q:params.get('q')||undefined,area:params.get('area')||undefined,duration:duration==='daytrip'||duration==='overnight'?duration:undefined});};sync();window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);},[]);
 const areas=useMemo(()=>[...new Set(courses.map(course=>course.area))].sort((a,b)=>areaOrder.indexOf(a)-areaOrder.indexOf(b)),[courses]);
 const list=matching(courses,filters);
 const go=(patch:Filters)=>{const next={...filters,...patch},query=new URLSearchParams();setFilters(next);for(const [key,value] of Object.entries(next))if(value)query.set(key,value);router.replace('/winter-travel'+(query.size?'?'+query:''),{scroll:false});};
 const reset=()=>{setFilters({});router.replace('/winter-travel',{scroll:false});};
 return <section className="bg-[#f7f9fc]" aria-labelledby="winter-list-title">
  <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
   <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="겨울 여행 일정">
    <Chip label="전체 일정" count={matching(courses,{q:filters.q,area:filters.area}).length} active={!filters.duration} onClick={()=>go({duration:undefined})}/>
    <Chip label="당일치기" count={matching(courses,{q:filters.q,area:filters.area,duration:'daytrip'}).length} active={filters.duration==='daytrip'} onClick={()=>go({duration:'daytrip'})}/>
    <Chip label="1박 2일" count={matching(courses,{q:filters.q,area:filters.area,duration:'overnight'}).length} active={filters.duration==='overnight'} onClick={()=>go({duration:'overnight'})}/>
   </div>
   <div className="flex flex-wrap gap-2" role="group" aria-label="겨울 여행 지역">
    <Chip label="전국" count={matching(courses,{q:filters.q,duration:filters.duration}).length} active={!filters.area} onClick={()=>go({area:undefined})}/>
    <Chip label="수도권" count={matching(courses,{q:filters.q,area:'수도권',duration:filters.duration}).length} active={filters.area==='수도권'} onClick={()=>go({area:filters.area==='수도권'?undefined:'수도권'})}/>
    {areas.map(area=><Chip key={area} label={area} count={matching(courses,{q:filters.q,area,duration:filters.duration}).length} active={filters.area===area} onClick={()=>go({area:filters.area===area?undefined:area})}/>)}
   </div>
   <div className="mb-5 mt-6 flex flex-wrap items-center justify-between gap-3">
    <div className="flex flex-wrap items-baseline gap-2"><h2 id="winter-list-title" className="text-xl font-extrabold tracking-tight text-ink">{filters.area||'전국'} {filters.duration==='overnight'?'1박 2일':filters.duration==='daytrip'?'당일치기':'겨울여행'}</h2><span role="status" aria-live="polite" className="text-sm font-bold text-brandblue">{list.length}개 코스</span></div>
    <form key={filters.q||''} role="search" className="flex w-full gap-2 sm:w-auto" onSubmit={e=>{e.preventDefault();const value=new FormData(e.currentTarget).get('q');go({q:typeof value==='string'?value.trim()||undefined:undefined});}}>
     <input type="search" name="q" defaultValue={filters.q||''} aria-label="겨울 여행지 검색" placeholder="지역·여행지 검색" className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-brandblue focus:ring-2 focus:ring-blue-100 sm:w-56"/>
     <button type="submit" className="min-h-11 shrink-0 rounded-xl bg-[#102344] px-4 text-sm font-bold text-white">검색</button>
    </form>
   </div>
   {filters.q&&<p className="mb-4 break-words text-sm text-ink-soft">검색어: {filters.q} <button type="button" onClick={()=>go({q:undefined})} className="ml-2 min-h-11 font-bold text-brandblue underline">검색 해제</button></p>}
   {list.length?<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 min-[1440px]:grid-cols-4" data-winter-cards>
    {list.map(course=>{const photo=winterCourseImage(course);return <article key={course.id} className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
     <Link href={'/winter-travel/'+course.slug} prefetch={false} className="group flex h-full flex-col rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">{photo&&<img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover"/>}<span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#102344]">{[...new Set([course.area,course.city].filter(Boolean))].join(' · ')}</span></div>
      <div className="flex flex-1 flex-col p-4 sm:p-5"><p className="mb-2 text-xs font-bold text-brandblue">{course.duration==='1박2일'?'1박 2일':'당일치기'}</p><h3 className="break-keep text-lg font-extrabold leading-7 tracking-tight text-ink group-hover:text-brandblue">{course.title}</h3><div className="mt-3 space-y-1 break-keep text-[13px] font-semibold leading-6 text-brandblue">{(course.duration==='1박2일'?[1,2]:[1]).map(day=><p key={day}>{course.duration==='1박2일'&&<span className="mr-1 text-ink-soft">{day}일차</span>}{course.stops.filter(stop=>stop.day===day).map(stop=>stop.name).join(' → ')}</p>)}</div><p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-soft">{course.intro}</p><div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4 text-xs font-semibold text-ink-soft"><span>{course.duration==='1박2일'?'1박 2일 · '+course.stops.length+'곳':course.durationLabel||'당일치기'}</span><span className="font-bold text-brandblue">코스 보기 →</span></div></div>
     </Link>
    </article>;})}
   </div>:<div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-14 text-center text-ink-soft"><p>조건에 맞는 코스가 없습니다.</p><button type="button" onClick={reset} className="mt-3 min-h-11 font-bold text-brandblue underline">전체 코스 보기</button></div>}
  </div>
 </section>;
}
function Chip({label,count,active,onClick}:{label:string;count:number;active:boolean;onClick:()=>void}){
 return <button type="button" onClick={onClick} aria-pressed={active} className={'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-bold '+(active?'border-[#102344] bg-[#102344] text-white':'border-slate-200 bg-white text-ink-soft hover:border-slate-400')}>{label}<span className={'text-xs tabular-nums '+(active?'text-white/80':'text-ink-faint')}>{count}</span></button>;
}
