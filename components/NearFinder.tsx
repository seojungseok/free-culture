"use client";
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {SIDO_LIST} from '@/lib/classify';
import {NEAR_KINDS,NEAR_RADII,NEAR_PAGE_SIZE,validPoint,nearDistanceLabel,type NearKind,type NearOrder,type NearPoint,type NearItem} from '@/lib/nearSearch';
import {NEAR_SESSION,requestNearLocation,takeHomeLocation} from '@/lib/nearClient';
import DiscoveryCard,{discoveryGrid} from './DiscoveryCard';
import TossTopDeals from './TossTopDeals';
import useListReturn from './useListReturn';

type Query={point:NearPoint|null;area:string;radius:number;kind:NearKind;order:NearOrder;page:number};
type Result=Omit<NearItem,'lat'|'lng'>;
const defaults:Query={point:null,area:'',radius:10,kind:'all',order:'mixed',page:1};
const selectStyle='mt-1 block h-10 w-full rounded-lg border border-line bg-white px-2 text-sm text-ink disabled:bg-neutral-100';
const kinds=new Map(NEAR_KINDS.map(k=>[k.value,k.label]));

export default function NearFinder(){
 const [query,setQuery]=useState<Query>(defaults),[ready,setReady]=useState(false);
 const [status,setStatus]=useState('idle'),[error,setError]=useState(''),[locating,setLocating]=useState(false);
 const [items,setItems]=useState<Result[]>([]),[total,setTotal]=useState(0),[revision,reload]=useState(0);
 const cache=useRef({key:'',items:[] as Result[],total:0});
 const remember=useListReturn('near-return',ready&&status==='done');
 useEffect(()=>{
   const refresh=()=>reload(n=>n+1);
   window.addEventListener('event-publication-expired',refresh);
   return ()=>window.removeEventListener('event-publication-expired',refresh);
 },[]);
 useEffect(()=>{
   try{
     const state=takeHomeLocation()||JSON.parse(sessionStorage.getItem(NEAR_SESSION)||'null');
     if(state){
       setQuery({point:state.point&&validPoint(state.point)?state.point:null,area:SIDO_LIST.includes(state.area)?state.area:'',
         radius:NEAR_RADII.includes(state.radius)?state.radius:10,kind:kinds.has(state.kind)?state.kind:'all',order:state.order==='nearest'?'nearest':'mixed',
         page:Number.isInteger(state.page)?Math.min(8334,Math.max(1,state.page)):1});
       if(typeof state.error==='string')setError(state.error);
     }
   }catch{}setReady(true);
 },[]);
 useEffect(()=>{if(ready)try{sessionStorage.setItem(NEAR_SESSION,JSON.stringify(query));}catch{}},[query,ready]);
 useEffect(()=>{
   if(!ready||(!query.point&&!query.area)){setStatus('idle');return;}
   const abort=new AbortController();
   const params=new URLSearchParams({radius:String(query.radius),kind:query.kind,order:query.order});
   if(query.point){params.set('lat',String(query.point.lat));params.set('lng',String(query.point.lng));}
   else params.set('area',query.area);
   const key=params.toString()+'|'+revision;
   if(cache.current.key!==key){cache.current={key,items:[],total:0};setItems([]);setTotal(0);}
   const current=cache.current;
   setStatus('loading');setError('');
   async function fetchPages(){
     const target=query.page*NEAR_PAGE_SIZE;
     while(current.items.length<target&&(!current.items.length||current.items.length<current.total)){
       const response=await fetch('/api/nearby?'+params+'&offset='+current.items.length,{signal:abort.signal,cache:'no-store'});
       if(!response.ok)throw Error();
       const page=await response.json();
       if(abort.signal.aborted)return;
       current.total=page.total;
       current.items=current.items.concat(page.items);
       if(!page.hasMore||!page.items.length)break;
     }
     if(!abort.signal.aborted){setItems(current.items.slice(0,target));setTotal(current.total);setStatus('done');}
   }
   fetchPages().catch(()=>{if(!abort.signal.aborted){setError('결과를 불러오지 못했어요. 다시 시도해 주세요.');setStatus('error');}});
   return ()=>abort.abort();
 },[query,ready,revision]);
 function change(patch:Partial<Query>){setQuery(q=>({...q,...patch,page:patch.page||1}));}
 async function locate(){
   if(locating)return;
   setLocating(true);setError('');
   try{change({point:await requestNearLocation(),area:''});}
   catch(e){setError((e as Error).message);}
   finally{setLocating(false);}
 }
 const nextRadius=NEAR_RADII.find(r=>r>query.radius);
 const mixed=query.kind==='all'&&query.order==='mixed';
 const button='min-h-11 rounded-full border border-line px-4 text-sm font-bold';
 function grid(rows:Result[]){
   return <div className={discoveryGrid} data-testid="near-grid">{rows.map(it=><DiscoveryCard key={it.url} href={it.url} title={it.title} image={it.image}
    meta={[it.area,kinds.get(it.kind),it.note].filter(Boolean).join(' · ')} distance={query.point&&it.distanceKm!==undefined?nearDistanceLabel(it.distanceKm):undefined} onClick={remember}/>)}</div>;
 }
 return <>
   <div className="flex items-center justify-between gap-2"><button onClick={locate} disabled={locating} className="min-h-11 rounded-xl bg-ink px-4 text-sm font-bold text-white disabled:opacity-60">{locating?'위치 확인 중…':query.point?'📍 내 위치 다시 찾기':'📍 내 위치로 찾기'}</button><button className="min-h-11 px-2 text-xs font-bold text-free underline" onClick={()=>change({radius:10,kind:'all',order:'mixed'})}>필터 초기화</button></div>
   {error&&<p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm">{error}</p>}
   <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-line p-3 sm:grid-cols-3">
     <label className="text-xs font-bold">거리<select aria-label="거리" value={query.radius} disabled={!query.point} onChange={e=>change({radius:Number(e.target.value)})} className={selectStyle}>{NEAR_RADII.map(r=><option key={r} value={r}>{r}km</option>)}</select></label>
     <label className="text-xs font-bold">종류<select aria-label="종류" value={query.kind} onChange={e=>change({kind:e.target.value as NearKind})} className={selectStyle}>{NEAR_KINDS.map(k=><option key={k.value} value={k.value}>{k.label}</option>)}</select></label>
     <label className="col-span-2 text-xs font-bold sm:col-span-1">정렬<select aria-label="정렬" value={mixed?'mixed':'nearest'} disabled={query.kind!=='all'} onChange={e=>change({order:e.target.value as NearOrder})} className={selectStyle}><option value="mixed">종류별로 둘러보기</option><option value="nearest">{query.point?'가까운 순':'이름순'}</option></select></label>
   </div>
   <details open={!query.point} className="mt-3 rounded-xl border border-line px-3 py-2"><summary className="cursor-pointer py-1 text-xs font-bold">지역 직접 선택</summary><label className="mt-2 block text-xs">시·도<select aria-label="지역 직접 선택" value={query.area} onChange={e=>change({area:e.target.value,point:null})} className={selectStyle}><option value="">지역을 골라주세요</option>{SIDO_LIST.map(a=><option key={a}>{a}</option>)}</select></label></details>
   <p className="mt-3 text-xs leading-5 text-ink-soft">{query.point?(mixed?'종류마다 가장 가까운 곳을 먼저 보여드려요. 거리는 현재 위치에서의 직선거리예요.':'현재 위치에서 직선거리가 가까운 순이에요.'):query.area?'선택한 지역의 결과예요. 위치가 확인되지 않은 장소도 포함해요.':'현재 위치를 허용하거나 시·도를 선택해 주세요.'}</p>
   {status==='error'&&<button onClick={()=>reload(n=>n+1)} className={button}>다시 불러오기</button>}
   {(status==='done'||items.length>0&&status==='loading')&&<>
     <p className="my-4 text-sm" aria-live="polite">{query.point?`${query.radius}km 이내`:query.area} · {kinds.get(query.kind)} <strong>{total.toLocaleString()}건</strong></p>
     {items.length>0?<>
       {grid(items.slice(0,NEAR_PAGE_SIZE))}
       {query.kind==='camp'&&<Link href="/camping/cooking" className="my-4 inline-flex min-h-11 items-center font-bold text-free underline">캠핑 요리와 필요한 재료 보기 →</Link>}
       <TossTopDeals contained compact/>
       {items.length>NEAR_PAGE_SIZE&&grid(items.slice(NEAR_PAGE_SIZE))}
       {items.length<total&&<button disabled={status==='loading'} onClick={()=>change({page:query.page+1})} className={button+' mx-auto mt-6 block'}>더보기 ({items.length}/{total})</button>}
     </>:<div className="rounded-xl bg-panel px-4 py-8 text-center"><h2 className="font-bold">조건에 맞는 결과가 없어요</h2><p className="mt-2 text-sm">{query.point?'좌표가 확인된 장소만 거리 검색에 표시해요. 반경을 넓히거나 지역을 직접 선택해 보세요.':'다른 지역이나 종류를 골라보세요.'}</p>{query.point&&nextRadius&&<button onClick={()=>change({radius:nextRadius})} className={button+' mt-4'}>{nextRadius}km로 넓혀보기</button>}</div>}
   </>}
   {status==='loading'&&<p role="status" className="my-4 text-sm">주변 장소를 찾고 있어요…</p>}
 </>;
}
