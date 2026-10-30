'use client';
import {useMemo} from 'react';
import Link from 'next/link';
import {useRouter,useSearchParams} from 'next/navigation';
import {Container} from './Band';
import {FilterRow} from './FilterChips';
import SeasonPlaceCard from './SeasonPlaceCard';
import type {WinterCourse} from '@/lib/winterCourses';
import {winterCourseImage} from '@/lib/winterCourseImage.mjs';

type Filters={q?:string;area?:string;duration?:string};
export type WinterCoursePreview=Pick<WinterCourse,'id'|'slug'|'title'|'area'|'duration'|'intro'|'image'> & {stops:{name:string}[]};
const CAP=120;
function matching(courses:WinterCoursePreview[],filters:Filters){const term=filters.q?.trim().toLowerCase();return courses.filter(course=>(!term||[course.title,course.area,...course.stops.map(stop=>stop.name)].join(' ').toLowerCase().includes(term))&&(!filters.area||course.area===filters.area)&&(!filters.duration||course.duration===filters.duration));}

export default function WinterCourseBrowser({courses}:{courses:WinterCoursePreview[]}){
 const router=useRouter(),params=useSearchParams();
 const filters:Filters={q:params.get('q')||undefined,area:params.get('area')||undefined,duration:params.get('duration')||undefined};
 const areas=useMemo(()=>[...new Set(courses.map(course=>course.area))].sort((a,b)=>a.localeCompare(b,'ko')),[courses]);
 const list=matching(courses,filters),heading=[filters.area,filters.duration==='당일'?'당일치기':filters.duration==='1박2일'?'1박 2일':null,'겨울 여행지'].filter(Boolean).join(' ');
 const go=(patch:Filters)=>{const query=new URLSearchParams();for(const [key,value] of Object.entries({...filters,...patch}))if(value)query.set(key,value);router.replace('/winter-travel'+(query.size?'?'+query:''),{scroll:false});};
 const reset=()=>router.replace('/winter-travel',{scroll:false});
 return <div className="bg-panel">
  <Container className="space-y-2.5 py-4">
   <FilterRow label="일정"><Chip label="전체" count={matching(courses,{...filters,duration:undefined}).length} active={!filters.duration} onClick={()=>go({duration:undefined})}/>{[['당일','당일치기'],['1박2일','1박 2일']].map(([value,label])=><Chip key={value} label={label} count={matching(courses,{...filters,duration:value}).length} active={filters.duration===value} onClick={()=>go({duration:filters.duration===value?undefined:value})}/>)}</FilterRow>
   <FilterRow label="지역"><Chip label="전국" count={matching(courses,{...filters,area:undefined}).length} active={!filters.area} onClick={()=>go({area:undefined})}/>{areas.map(area=><Chip key={area} label={area} count={matching(courses,{...filters,area}).length} active={filters.area===area} onClick={()=>go({area:filters.area===area?undefined:area})}/>)}</FilterRow>
   {(filters.area||filters.duration||filters.q)&&<div className="flex flex-wrap items-center gap-2 pt-0.5 text-[12.5px]"><span className="font-bold text-ink-faint">선택:</span><span className="font-semibold text-freedark">{heading}{filters.q?' · '+filters.q:''}</span><button onClick={reset} className="min-h-9 font-semibold text-ink-faint underline hover:text-ink">초기화</button></div>}
  </Container>
  <Container className="pb-12 pt-2">
   <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-baseline gap-2"><h2 id="winter-list-title" className="text-[20px] font-extrabold tracking-tight text-ink sm:text-[22px]">{heading}</h2><span role="status" aria-live="polite" className="text-[14px] font-bold text-free">{list.length.toLocaleString()}개 코스</span></div><form key={filters.q||''} role="search" className="flex w-full gap-2 sm:w-auto" onSubmit={e=>{e.preventDefault();const value=new FormData(e.currentTarget).get('q');go({q:typeof value==='string'?value.trim()||undefined:undefined});}}><input type="search" name="q" defaultValue={filters.q||''} aria-label="겨울 여행지 검색" placeholder="지역·장소 검색" className="h-11 min-w-0 flex-1 rounded-full border border-line bg-white px-4 text-sm outline-none focus:border-free sm:w-52"/><button className="min-h-11 shrink-0 rounded-full bg-free px-4 text-sm font-bold text-white">검색</button></form></div>
   {list.length?<div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" aria-labelledby="winter-list-title">{list.slice(0,CAP).map(course=>{const photo=winterCourseImage(course);return <SeasonPlaceCard key={course.id} href={`/winter-travel/${course.slug}`} title={course.title} image={photo?.src} imageAlt={photo?.alt} badge={course.duration==='당일'?'당일치기':'1박 2일'} trailingBadge={photo?.kind==='ai'?'AI 연출':undefined} meta={`${course.area} · ${course.stops.length}곳 방문`} description={course.intro} twoLineTitle/>;})}</div>:<div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center text-ink-soft"><p>{courses.length?'조건에 맞는 겨울 여행코스가 없습니다.':'검토를 마친 겨울 여행코스를 준비하고 있습니다.'}</p>{courses.length?<button onClick={reset} className="mt-2 min-h-11 font-bold text-free underline">전체 겨울 여행지 보기 →</button>:<Link href="/course" className="mt-2 inline-flex min-h-11 items-center font-bold text-free underline">기존 여행코스 둘러보기 →</Link>}</div>}
   {list.length>CAP&&<p className="mt-8 text-center text-[13px] text-ink-faint">상위 {CAP}개 표시 · 지역·일정으로 좁혀보세요</p>}
  </Container>
 </div>;
}
function Chip({label,count,active,onClick}:{label:string;count:number;active:boolean;onClick:()=>void}){return <button type="button" onClick={onClick} aria-pressed={active} className={`flex min-h-[36px] shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3.5 text-[13px] font-bold transition ${active?'bg-free text-white shadow-sm':'border border-line bg-white text-ink-soft hover:border-free/40 hover:text-free'}`}>{label}<span className={`text-[11px] tabular-nums ${active?'text-white/80':'text-ink-dim'}`}>{count}</span></button>;}
