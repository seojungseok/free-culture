'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import type {TossFeed,TossProduct} from '@/lib/sharelink';
import {currentProducts} from '@/lib/sharelink-policy.mjs';
import {affiliateTrack} from '@/lib/affiliate-track';
import HomeAffiliateShowcase from './HomeAffiliateShowcase';
const disclosure='[광고] 토스쇼핑 쉐어링크 활동으로, 링크 구매 시 수수료를 지급받습니다.';
function track(event:string,p:TossProduct,placement:string,page:string){
 affiliateTrack(event,'toss',placement,page,p.id);
}
export default function TossAffiliate({initial,position,compact=false,initialIndex=0,collection='camp'}:{initial:TossFeed;position:'top'|'article';compact?:boolean;initialIndex?:number;collection?:'camp'|'daily'|'travel'|'stay'}){
 const page=usePathname()||'/';
 const [feed,setFeed]=useState(initial),[now,setNow]=useState(0),[saved,setSaved]=useState<number[]>([]),[message,setMessage]=useState('');
 const box=useRef<HTMLElement>(null),seen=useRef(new Set<string>());
 const channel=page==='/'?'home':/^\/camping\/\d+$/.test(page)?'camping':/^\/(event\/[^/]+|places\/spot\/[^/]+|course\/c\/[^/]+|date\/c\/[^/]+)/.test(page)?'picnic':page.startsWith('/weekend-prep/')?(/soup|stew|hotpot|ramen|noodle|sujebi|tteokbokki|fishcake|crab|mussel/.test(page)?'cooking-pot':/grill|rice|pancake|sandwich|skewer|stir-fry|jeon|corn-cheese|tofu-kimchi/.test(page)?'cooking-pan':/picnic|park|outing/.test(page)?'picnic':null):null;
 const correctPosition=(page==='/'&&position==='top')||(page!=='/'&&position==='article');
 const items=useMemo(()=>correctPosition&&channel&&now>0?currentProducts(feed,now).filter(p=>p.links[channel]&&(page!=='/'||p.homeFeature)).sort((a,b)=>Number(Boolean(b.endAt))-Number(Boolean(a.endAt))).slice(0,page==='/'?40:2):[],[correctPosition,channel,now,feed,page]);
 useEffect(()=>{
  let active=true;const tick=()=>setNow(Date.now());tick();const clock=setInterval(tick,30000);
  const sync=()=>{try{const value=JSON.parse(localStorage.getItem('mwohaji-toss-saved')||'[]');setSaved(Array.isArray(value)?value.filter(Number.isInteger).slice(0,100):[]);}catch{setSaved([]);}};sync();window.addEventListener('storage',sync);
  const refresh=()=>fetch('/api/affiliate/toss',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(v=>{if(active&&v?.version===1&&Array.isArray(v.products))setFeed(v);}).catch(()=>{});
  refresh();const refreshTimer=setInterval(refresh,300000);
  return()=>{active=false;clearInterval(clock);clearInterval(refreshTimer);window.removeEventListener('storage',sync);};
 },[]);
 useEffect(()=>{
  const node=box.current;if(!node||!items.length)return;
  const observer=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return;for(const p of items){const key=`${page}:${p.id}`;if(!seen.current.has(key)){track('affiliate_impression',p,position,page);seen.current.add(key);}}},{threshold:0.5});observer.observe(node);return()=>observer.disconnect();
 },[page,position,items]);
 function toggle(p:TossProduct){try{const next=saved.includes(p.id)?saved.filter(id=>id!==p.id):[p.id,...saved].slice(0,100);localStorage.setItem('mwohaji-toss-saved',JSON.stringify(next));setSaved(next);setMessage(next.includes(p.id)?'이 브라우저에 저장했습니다. 다시 방문하면 저장 표시를 확인할 수 있어요. 저장은 가격이나 재고를 예약하지 않습니다.':'저장을 해제했습니다.');track('affiliate_save',p,position,page);}catch{setMessage('이 브라우저에서는 저장할 수 없습니다.');}}
 if(page==='/'&&position==='top')return <HomeAffiliateShowcase products={items} checkedAt={feed.checkedAt} compact={compact} initialIndex={initialIndex} collection={collection}/>;
 if(!items.length)return null;
 const checked=new Date(feed.checkedAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});
 return <section ref={box} aria-label="토스쇼핑 제휴 추천" className="mx-auto my-5 w-[calc(100%-2.5rem)] max-w-6xl rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:p-6">
  <p className="mb-3 text-sm leading-6 text-slate-700">{disclosure}</p>
  <p className="text-sm font-bold text-blue-700">{items.some(p=>p.endAt)?'종료 시간을 확인한 토스 하루특가':items.some(p=>(p.discountRate||0)>0)?'주말 준비 전에 살펴볼 토스 할인 상품':'주말 준비 전에 살펴볼 토스 상품'}</p>
  <div className="mt-3 grid gap-5 sm:grid-cols-2">{items.map(p=><article key={p.id} className={items.length===1?'sm:col-span-2':''}>
   <div className="flex min-w-0 items-start gap-3 sm:gap-4">
    <figure className="w-24 shrink-0 sm:w-48"><a href={p.links[channel!]} rel="sponsored noopener noreferrer" target="_blank" onClick={()=>track('affiliate_click',p,position,page)} aria-label={`${p.name} 토스에서 보기`} className="block rounded-xl bg-white p-2 sm:p-3"><img src={p.image} alt={p.imageNote||p.name} width={160} height={160} className="mx-auto h-20 w-20 object-contain sm:h-40 sm:w-40" loading={position==='top'?'eager':'lazy'}/></a><figcaption className="mt-1 text-xs leading-5 text-slate-600">{p.imageNote}</figcaption></figure>
    <div className="min-w-0 flex-1"><h2 className="text-base font-bold leading-6 text-slate-900 sm:text-lg sm:leading-7">{p.headline}</h2><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-700 sm:text-sm">{p.name}</p><p className="mt-2 text-xl font-black text-blue-800">{p.price.toLocaleString('ko-KR')}원 <span className="block text-xs font-normal text-slate-600 sm:inline">확인한 표시 가격</span></p>
    <p className="mt-1 text-xs leading-5 text-slate-700">{p.option}</p>
    {p.endAt&&<p className="mt-1 text-sm font-bold text-rose-700">{new Date(p.endAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})} 종료 예정</p>}
    <details className="mt-2 text-xs leading-5 text-slate-600"><summary className="cursor-pointer py-1 font-bold">선택 기준·옵션 확인</summary><p>{p.reason}</p><p>{p.caution}</p></details>
    <div className="mt-3 flex flex-wrap gap-2"><a href={p.links[channel!]} rel="sponsored noopener noreferrer" target="_blank" onClick={()=>track('affiliate_click',p,position,page)} className="inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800">토스에서 현재 가격 확인 ↗</a><button type="button" aria-pressed={saved.includes(p.id)} onClick={()=>toggle(p)} className="min-h-11 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-bold text-blue-800">{saved.includes(p.id)?'저장됨 · 해제':'다음 나들이 전에 다시 보기'}</button></div>
    </div>
   </div>
  </article>)}</div>
  <p className="mt-3 text-xs leading-5 text-slate-600">{checked} 기준 · 가격·옵션·재고는 달라질 수 있습니다. 최종 구매 조건은 토스 상품 상세에서 확인하세요.</p>
  <p role="status" className="mt-1 text-sm text-slate-700">{message}</p>
 </section>;
}
