"use client";
import {useEffect, useRef, useState} from 'react';
import {approved, productImage, type Food} from './WinterFoodCoupang';
import {usePathname} from 'next/navigation';
import {affiliateTrack} from '@/lib/affiliate-track';

const hideKey='mwohaji-coupang-popup-hide-day';
const sessionKey='mwohaji-coupang-popup-shown-day';
const koreanDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());

export default function CoupangFoodPopup() {
  const [product,setProduct]=useState<Food|null>(null);
  const [visible,setVisible]=useState(false);
  const page=usePathname()||'/';
  const pageRef=useRef(page);pageRef.current=page;
  useEffect(()=>{
    const controller=new AbortController();
    const day=koreanDay();
    try {if(localStorage.getItem(hideKey)===day || sessionStorage.getItem(sessionKey)===day) return;} catch {return;}
    fetch('/api/affiliate/coupang-food',{cache:'no-store',signal:controller.signal})
      .then(r=>r.ok?r.json():null)
      .then(feed=>{const item=Array.isArray(feed?.products)?feed.products.find((p:Food)=>approved(p,Date.now())):null;if(item)setProduct(item);})
      .catch(()=>{});
    return()=>controller.abort();
  },[]);
  useEffect(()=>{
    if(!product) return;
    const timer=window.setTimeout(()=>{
      setVisible(true);affiliateTrack('affiliate_impression','coupang','popup',pageRef.current,Number(product.id));try{sessionStorage.setItem(sessionKey,koreanDay());}catch{}
    },1200);
    return()=>window.clearTimeout(timer);
  },[product]);
  if(!product || !visible)return null;
  const close=(hideToday=false)=>{if(hideToday)try{localStorage.setItem(hideKey,koreanDay());}catch{}setVisible(false);};
  return <aside aria-labelledby="coupang-popup-title" className="fixed bottom-4 right-4 z-50 w-[min(82vw,320px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
    <div className="bg-white p-4">
      <div className="flex items-start justify-between gap-4"><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">[광고] 겨울 캠핑 먹거리</span><button type="button" onClick={()=>close()} aria-label="광고 닫기" className="flex h-10 w-10 items-center justify-center rounded-full text-2xl text-slate-700">×</button></div>
      <h2 id="coupang-popup-title" className="mt-1 text-base font-black text-slate-900">따뜻한 한 끼를 준비해요</h2>
      <div className="mt-2 flex items-center gap-3"><img src={productImage(product.id)} alt={product.name} className="h-16 w-16 shrink-0 rounded-xl object-contain" /><p className="line-clamp-2 text-sm font-bold leading-5 text-slate-800">{product.name}</p></div>
      <a href={product.url} target="_blank" rel="sponsored nofollow noopener noreferrer" onClick={()=>affiliateTrack('affiliate_click','coupang','popup',page,Number(product.id))} className="mt-4 flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-4 font-bold text-white">쿠팡에서 상품 보기 ↗</a>
      <p className="mt-3 text-[11px] leading-5 text-slate-500">쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 제공받습니다. 상품 조건은 판매처에서 확인해 주세요.</p>
      <button type="button" onClick={()=>close(true)} className="mt-3 min-h-11 w-full border-t border-slate-100 text-sm font-bold text-slate-600">오늘 하루 보지 않기</button>
    </div>
  </aside>;
}
