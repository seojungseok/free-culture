'use client';
import {useState} from 'react';
import DiscoveryCard,{discoveryGrid} from './DiscoveryCard';
type Card={id:string;title:string;description:string;area:string;city:string;route:string;operating:string;image:string;imageTitle:string;date:string};
export default function CityTourBrowser({items}:{items:Card[]}){
 const [area,setArea]=useState(''),[query,setQuery]=useState(''),[limit,setLimit]=useState(20);
 const filtered=items.filter(a=>(!area||a.area===area)&&[a.title,a.area,a.city,a.route,a.description].join(' ').includes(query.trim()));
 return <><div className="mb-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-3 rounded-xl border border-line bg-white p-3">
 <label className="min-w-0 text-xs font-bold">지역<select value={area} onChange={e=>{setArea(e.target.value);setLimit(20);}} className="mt-1 h-10 w-full min-w-0 rounded-lg border bg-white px-2 text-sm"><option value="">전체 지역</option>{[...new Set(items.map(a=>a.area))].sort().map(a=><option key={a}>{a}</option>)}</select></label>
 <label className="min-w-0 text-xs font-bold">코스 검색<input type="search" value={query} onChange={e=>{setQuery(e.target.value);setLimit(20);}} placeholder="지역·경유지 검색" className="mt-1 h-10 w-full min-w-0 rounded-lg border bg-white px-2 text-sm font-normal"/></label>
 </div><div className="mb-3 flex items-center justify-between text-xs"><p role="status" className="text-ink-soft">{area||'전체 지역'} · 코스 {filtered.length}개</p><button className="min-h-9 px-2 font-bold text-free underline" onClick={()=>{setArea('');setQuery('');setLimit(20);}}>초기화</button></div>
 <div className={discoveryGrid} data-testid="city-grid">{filtered.slice(0,limit).map(a=><DiscoveryCard key={a.id} href={'/city-tour/'+a.id} title={a.title.replace(/\s*코스와.*$|\s*(운영 정보|운행 정보).*$/,'')} image={a.image} meta={`${a.area} · ${a.city==='없음'?'시티투어':a.city}`}/>)}</div>
 {!filtered.length&&<p className="py-10 text-center text-sm">조건에 맞는 코스가 없어요. 지역이나 검색어를 바꾸거나 초기화해 주세요.</p>}
 {filtered.length>limit&&<button onClick={()=>setLimit(n=>n+20)} className="mx-auto mt-6 block min-h-11 rounded-full border px-6 text-sm font-bold">더보기 ({Math.min(limit,filtered.length)}/{filtered.length})</button>}</>;
}
