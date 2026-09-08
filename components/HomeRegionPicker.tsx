'use client';
import Link from 'next/link';
import {useState} from 'react';
const capital=['서울','경기','인천'];
const aliases:Record<string,string>={서울:'서울특별시',경기:'경기도',인천:'인천광역시',부산:'부산광역시',대구:'대구광역시',대전:'대전광역시',광주:'광주광역시',울산:'울산광역시',세종:'세종특별자치시',강원:'강원도 강원특별자치도',충북:'충청북도',충남:'충청남도',전북:'전라북도 전북특별자치도',전남:'전라남도',경북:'경상북도',경남:'경상남도',제주:'제주도 제주특별자치도'};
export default function HomeRegionPicker({regions}:{regions:{name:string;href:string}[]}){
 const [query,setQuery]=useState(''),[expanded,setExpanded]=useState(false);
 const term=query.trim().replace(/\s/g,'');
 const matches=regions.filter(r=>!term?capital.includes(r.name):(r.name+' '+(aliases[r.name]||'')).includes(term)).sort((a,b)=>!term?capital.indexOf(a.name)-capital.indexOf(b.name):Number(b.name===term)-Number(a.name===term)||Number(b.name.startsWith(term))-Number(a.name.startsWith(term)));
 const others=regions.filter(r=>!matches.some(m=>m.name===r.name));
 const grid=(items:typeof regions)=><div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{items.map(({name,href})=><Link key={name} href={href} prefetch={false} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#f5f7fa] px-3 py-3 text-center text-[13px] font-bold text-ink-soft transition hover:bg-[#eaf2ff] hover:text-brandblue">{name}</Link>)}</div>;
 return <section aria-labelledby="home-region-title" className="mx-auto w-full max-w-[1120px] px-5 pt-10 sm:px-6 sm:pt-14 lg:px-8">
 <h2 id="home-region-title" className="text-[20px] font-black tracking-tight text-ink sm:text-[24px]">지역별로 찾아보기</h2>
 <p className="mt-1 text-[13px] text-ink-soft">서울·경기·인천부터, 다른 지역은 검색하거나 더보기로 찾아보세요.</p>
 <div className="relative mb-4 mt-4 max-w-md"><label htmlFor="home-region-search" className="sr-only">지역 이름 검색</label><input id="home-region-search" type="search" value={query} onChange={e=>{setQuery(e.target.value);setExpanded(false);}} placeholder="지역 입력 · 예: 서울, 부산, 제주" className="min-h-11 w-full rounded-xl border border-slate-200 px-4 pr-16 text-base outline-none focus:ring-2 focus:ring-brandblue/30"/>{query&&<button type="button" onClick={()=>{setQuery('');setExpanded(false);}} className="absolute right-1 top-0 min-h-11 px-3 text-xs font-bold" aria-label="지역 검색 지우기">초기화</button>}</div>
 {term&&<p role="status" className="mb-3 text-xs text-ink-soft">{matches.length?`일치하는 지역 ${matches.length}개를 먼저 보여드려요.`:'일치하는 지역이 없습니다. 이름을 다시 입력하거나 전체 지역을 펼쳐보세요.'}</p>}
 <div data-region-primary>{grid(matches)}</div>
 <div id="home-other-regions" hidden={!expanded} className="mt-2">{grid(others)}</div>
 {others.length>0&&<button type="button" aria-expanded={expanded} aria-controls="home-other-regions" onClick={()=>setExpanded(v=>!v)} className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-brandblue">{expanded?'다른 지역 접기':`다른 지역 더보기 (${others.length})`}</button>}
 </section>;
}
