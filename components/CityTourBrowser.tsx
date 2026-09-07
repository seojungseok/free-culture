'use client';
import {useState} from 'react';
import Link from 'next/link';
type Card={id:string;title:string;description:string;area:string;city:string;route:string;operating:string;image:string;imageTitle:string;date:string};
export default function CityTourBrowser({items}:{items:Card[]}){
 const [area,setArea]=useState(''),[query,setQuery]=useState(''),[limit,setLimit]=useState(20);
 const filtered=items.filter(a=>(!area||a.area===area)&&[a.title,a.area,a.city,a.route,a.description].join(' ').includes(query.trim()));
 return <><div className="mb-5 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[180px_1fr]">
 <label className="text-sm font-bold">지역<select value={area} onChange={e=>{setArea(e.target.value);setLimit(20);}} className="mt-2 min-h-11 w-full rounded-xl border bg-white px-3"><option value="">전체 지역</option>{[...new Set(items.map(a=>a.area))].sort().map(a=><option key={a}>{a}</option>)}</select></label>
 <label className="text-sm font-bold">코스 검색<input type="search" value={query} onChange={e=>{setQuery(e.target.value);setLimit(20);}} placeholder="지역·코스·경유지 검색" className="mt-2 min-h-11 w-full min-w-0 rounded-xl border bg-white px-3 font-normal"/></label>
 </div><p role="status" className="mb-4 text-sm text-ink-soft">작성된 코스 {filtered.length}개</p>
 <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.slice(0,limit).map(a=><article key={a.id} className="overflow-hidden rounded-2xl border border-line bg-white">
 <Link href={'/city-tour/'+a.id} prefetch={false} className="block h-full focus-visible:outline focus-visible:outline-brandblue">
 {a.image?<img src={a.image} alt={a.imageTitle+' — 코스 경유지'} loading="lazy" className="aspect-[16/9] w-full object-cover"/>:<div className="flex aspect-[16/9] items-center justify-center bg-blue-50 text-3xl font-black text-brandblue">{a.area} 시티투어</div>}
 <div className="p-5"><p className="text-xs font-bold text-brandblue">{a.area} · {a.city==='없음'?'시티투어':a.city}</p><h2 className="mt-2 break-keep text-lg font-extrabold">{a.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-6 text-ink-soft">{a.description}</p><p className="mt-3 line-clamp-2 text-xs leading-5">원본 운영 조건: {a.operating||'공식 문의 필요'}</p><p className="mt-4 text-xs text-ink-faint">원본 기준 {a.date} · 운행 여부 확인 필요</p></div>
 </Link></article>)}</div>{!filtered.length&&<p className="py-10 text-center">아직 작성된 코스가 없습니다. 다른 지역이나 검색어를 선택해 주세요.</p>}
 {filtered.length>limit&&<button onClick={()=>setLimit(n=>n+20)} className="mx-auto mt-7 block min-h-11 rounded-xl border px-6 font-bold">코스 더 보기</button>}</>;
}
