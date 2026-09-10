"use client";
import {useSearchParams} from 'next/navigation';
import type {TicketArticle} from '@/lib/tickets';
import DiscoveryCard,{discoveryGrid} from './DiscoveryCard';
import useListReturn from './useListReturn';
const PAGE_SIZE=12;
export default function TicketBrowser({articles}:{articles:Pick<TicketArticle,'slug'|'placeName'|'listTitle'|'area'|'theme'|'thumbnail'>[]}) {
 const params=useSearchParams();
 const areas=['전체',...new Set(articles.map(a=>a.area))],themes=['전체',...new Set(articles.map(a=>a.theme))];
 const area=areas.includes(params.get('area')||'')?params.get('area')!:'전체';
 const theme=themes.includes(params.get('theme')||'')?params.get('theme')!:'전체';
 const page=Math.max(1,Math.min(Math.ceil(articles.length/PAGE_SIZE)||1,Number(params.get('page'))||1));
 const visible=articles.filter(a=>(area==='전체'||a.area===area)&&(theme==='전체'||a.theme===theme));
 const remember=useListReturn('tickets-return');
 function update(patch:Record<string,string>){const next=new URLSearchParams(params.toString());for(const [k,v] of Object.entries(patch)){if(v==='전체'||!v)next.delete(k);else next.set(k,v);}window.history.replaceState(null,'',`/tickets${next.size?'?'+next:''}`);}
 const reset=()=>update({area:'',theme:'',page:''});
 return <>
  <div className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-white p-3">
   <label className="min-w-0 text-xs font-bold text-ink-soft">지역<select aria-label="지역" value={area} onChange={e=>update({area:e.target.value,page:''})} className="mt-1 block h-10 w-full min-w-0 rounded-lg border border-line bg-white px-2 text-sm text-ink">{areas.map(v=><option key={v}>{v}</option>)}</select></label>
   <label className="min-w-0 text-xs font-bold text-ink-soft">테마<select aria-label="테마" value={theme} onChange={e=>update({theme:e.target.value,page:''})} className="mt-1 block h-10 w-full min-w-0 rounded-lg border border-line bg-white px-2 text-sm text-ink">{themes.map(v=><option key={v}>{v}</option>)}</select></label>
  </div>
  <div className="my-3 flex items-center justify-between gap-2 text-xs"><p className="min-w-0 break-keep text-ink-soft" aria-live="polite">{area} · {theme} <strong className="text-ink">{visible.length}곳</strong></p><button onClick={reset} className="min-h-9 shrink-0 px-2 font-bold text-free underline">초기화</button></div>
  {visible.length?<>
   <div className={discoveryGrid} data-testid="ticket-grid">{visible.slice(0,page*PAGE_SIZE).map(a=><DiscoveryCard key={a.slug} href={`/tickets/${a.slug}`} title={a.listTitle||a.placeName} image={a.thumbnail.url} meta={`${a.area} · ${a.theme}`} onClick={remember}/>)}</div>
   {visible.length>page*PAGE_SIZE&&<button onClick={()=>update({page:String(page+1)})} className="mx-auto mt-6 block min-h-11 rounded-full border border-line bg-white px-6 text-sm font-bold">더보기 ({Math.min(page*PAGE_SIZE,visible.length)}/{visible.length})</button>}
  </>:<div className="rounded-xl bg-panel px-4 py-9 text-center"><h2 className="break-keep font-bold">선택한 조건에 맞는 장소가 없어요</h2><p className="mt-2 text-sm text-ink-soft">지역이나 테마를 바꾸거나 초기화해 보세요.</p><button onClick={reset} className="mt-4 min-h-11 rounded-full bg-free px-5 text-sm font-bold text-white">필터 초기화</button></div>}
 </>;
}
