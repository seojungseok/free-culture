"use client";
import {useEffect,useState} from 'react';
import {SIDO_LIST} from '@/lib/classify';
import {NEAR_KINDS,NEAR_RADII,validPoint,nearDistanceLabel,type NearKind,type NearPoint,type NearItem} from '@/lib/nearSearch';
import {NEAR_SESSION,requestNearLocation} from '@/lib/nearClient';
import DiscoveryCard,{discoveryGrid} from './DiscoveryCard';
import useListReturn from './useListReturn';
type Query={point:NearPoint|null;area:string;radius:number;kind:NearKind;page:number};
type Result=Omit<NearItem,'lat'|'lng'>;
const defaults:Query={point:null,area:'',radius:10,kind:'all',page:1};
export default function NearFinder(){
 const [query,setQuery]=useState<Query>(defaults),[ready,setReady]=useState(false),[status,setStatus]=useState('idle'),[error,setError]=useState('');
 const [items,setItems]=useState<Result[]>([]),[total,setTotal]=useState(0),[locating,setLocating]=useState(false);
 const remember=useListReturn('near-return',ready&&status==='done');
 useEffect(()=>{try{const raw=sessionStorage.getItem(NEAR_SESSION);if(raw){const s=JSON.parse(raw);setQuery({point:s.point&&validPoint(s.point)?s.point:null,area:SIDO_LIST.includes(s.area)?s.area:'',radius:NEAR_RADII.includes(s.radius)?s.radius:10,kind:NEAR_KINDS.some(k=>k.value===s.kind)?s.kind:'all',page:Math.max(1,Math.min(50,Number(s.page)||1))});setError(s.error||'');}}catch{}setReady(true);},[]);
 useEffect(()=>{if(!ready)return;try{sessionStorage.setItem(NEAR_SESSION,JSON.stringify(query));}catch{}},[query,ready]);
 useEffect(()=>{
  if(!ready||(!query.point&&!query.area)){setStatus('idle');return;}
  const controller=new AbortController();setStatus('loading');setError('');
  if(query.page===1)setItems([]);
  const params=new URLSearchParams({radius:String(query.radius),kind:query.kind});
  if(query.point){params.set('lat',String(query.point.lat));params.set('lng',String(query.point.lng));}else params.set('area',query.area);
  Promise.all(Array.from({length:query.page},async(_,i)=>{const r=await fetch(`/api/nearby?${params}&offset=${i*12}`,{signal:controller.signal,cache:'no-store'});if(!r.ok)throw Error('결과를 불러오지 못했어요. 다시 시도해 주세요.');return r.json();})).then(pages=>{if(controller.signal.aborted)return;setItems(pages.flatMap(p=>p.items));setTotal(pages[0].total);setStatus('done');}).catch(e=>{if(!controller.signal.aborted){setError(e.message);setStatus('error');}});
  return ()=>controller.abort();
 },[query,ready]);
 function change(patch:Partial<Query>){setQuery(q=>({...q,...patch,page:patch.page||1}));}
 async function locate(){if(locating)return;setLocating(true);setError('');try{change({point:await requestNearLocation(),area:''});}catch(e){change({point:null,area:''});setItems([]);setError((e as Error).message);}finally{setLocating(false);}}
 const kindLabel=NEAR_KINDS.find(k=>k.value===query.kind)!.label;
 const nextRadius=NEAR_RADII.find(r=>r>query.radius);
 return <>
  <div className="flex items-center justify-between gap-2"><button onClick={locate} disabled={locating} className="min-h-11 rounded-xl bg-ink px-4 text-sm font-bold text-white disabled:opacity-60">{locating?'위치 확인 중…':query.point?'📍 내 위치 다시 찾기':'📍 내 위치로 찾기'}</button><button className="min-h-11 px-2 text-xs font-bold text-free underline" onClick={()=>change({radius:10,kind:'all'})}>필터 초기화</button></div>
  {error&&<p role="alert" className="mt-3 break-keep rounded-xl bg-amber-50 p-3 text-sm leading-6 text-ink">{error}</p>}
  <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-line p-3">
   <label className="min-w-0 text-xs font-bold text-ink-soft">거리<select aria-label="거리" value={query.radius} disabled={!query.point} onChange={e=>change({radius:Number(e.target.value)})} className="mt-1 block h-10 w-full rounded-lg border border-line bg-white px-2 text-sm text-ink disabled:bg-neutral-100">{NEAR_RADII.map(r=><option key={r} value={r}>{r}km</option>)}</select></label>
   <label className="min-w-0 text-xs font-bold text-ink-soft">종류<select aria-label="종류" value={query.kind} onChange={e=>change({kind:e.target.value as NearKind})} className="mt-1 block h-10 w-full rounded-lg border border-line bg-white px-2 text-sm text-ink">{NEAR_KINDS.map(k=><option key={k.value} value={k.value}>{k.label}</option>)}</select></label>
  </div>
  <details open={!query.point} className="mt-3 rounded-xl border border-line px-3 py-2"><summary className="cursor-pointer py-1 text-xs font-bold text-ink-soft">지역 직접 선택</summary><label className="mt-2 block text-xs text-ink-soft">시·도<select aria-label="지역 직접 선택" value={query.area} onChange={e=>change({area:e.target.value,point:null})} className="my-2 block h-10 w-full rounded-lg border border-line bg-white px-2 text-sm text-ink"><option value="">지역을 골라주세요</option>{SIDO_LIST.map(a=><option key={a}>{a}</option>)}</select></label></details>
  <p className="mt-3 break-keep text-xs leading-5 text-ink-soft">{query.point?'현재 위치 기준 직선거리 · 가까운 순입니다. 자동차 이동거리와 달라요.':query.area?'선택한 지역의 장소명 순입니다. 현재 위치가 없어 거리·반경은 적용하지 않아요.':'위치 버튼을 누를 때만 권한을 요청해요. 지역을 직접 골라도 볼 수 있어요.'}</p>
  {status==='loading'&&<p role="status" className="my-4 text-sm">주변 장소를 찾고 있어요…</p>}
  {status==='error'&&<button onClick={()=>setQuery(q=>({...q}))} className="mt-3 min-h-11 rounded-full border border-line px-4 text-sm font-bold">다시 불러오기</button>}
  {status==='done'&&<>
   <p className="my-4 text-sm text-ink-soft" aria-live="polite">{query.point?`${query.radius}km 이내`:query.area} · {kindLabel} <strong className="text-ink">{total.toLocaleString()}곳</strong></p>
   {items.length?<><div className={discoveryGrid} data-testid="near-grid">{items.map(it=><DiscoveryCard key={it.url} href={it.url} title={it.title} image={it.image} meta={`${it.area} · ${NEAR_KINDS.find(k=>k.value===it.kind)?.label}`} distance={query.point&&it.distanceKm!==undefined?nearDistanceLabel(it.distanceKm):undefined} onClick={remember}/>)}</div>{items.length<total&&<button onClick={()=>change({page:query.page+1})} className="mx-auto mt-6 block min-h-11 rounded-full border border-line px-6 text-sm font-bold">더보기 ({items.length}/{total})</button>}</>:<div className="rounded-xl bg-panel px-4 py-8 text-center"><h2 className="font-bold">조건에 맞는 장소가 없어요</h2><p className="mt-2 break-keep text-sm leading-6 text-ink-soft">{query.point?'반경을 넓히거나 다른 종류를 골라보세요.':'다른 지역이나 종류를 골라보세요.'}</p>{query.point&&nextRadius&&<button onClick={()=>change({radius:nextRadius})} className="mt-4 min-h-11 rounded-full bg-free px-5 text-sm font-bold text-white">{nextRadius}km로 넓혀보기</button>}{query.point&&!nextRadius&&<p className="mt-3 text-xs text-ink-soft">최대 반경 50km입니다. 지역 직접 선택도 이용해 보세요.</p>}</div>}
  </>}
 </>;
}
