'use client';
import {useEffect,useState} from 'react';
import type {TicketArticle} from '@/lib/tickets';
export default function TicketLinks({article}:{article:TicketArticle}){
 const [now,setNow]=useState(()=>Date.now());useEffect(()=>{setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(timer);},[]);
 const day=new Date(now).toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
 const tickets=article.tickets.filter(t=>!t.validUntil||t.validUntil>=day);
 return <aside aria-label="이용권 안내" className="my-8 rounded-2xl border border-[#cbdccb] bg-[#f4f8f2] p-4 sm:p-5">
  <h2 className="break-keep text-xl font-bold">{article.placeName} 이용권 알아보기</h2>
  <p className="mt-2 break-keep text-sm leading-6 text-ink-soft">방문 날짜에 맞는 이용권 가격과 할인 혜택이 있는지 확인해 보세요.</p>
  {tickets.length?<><div className="mt-3 flex flex-col gap-2">{tickets.map(t=>{
   const b=t.verifiedBenefit;const discount=!!(b?.sourceUrl&&b.conditions&&b.checkedAt&&Date.parse(b.checkedAt)<=now&&now-Date.parse(b.checkedAt)<86400000&&Date.parse(b.startsAt)<=now&&Date.parse(b.endsAt)>now);
   const kind=tickets.length>1?t.label.replace(/\s*(보기|가격 확인|가격·할인 혜택 확인)\s*$/,'').replace(/특가|최저가|할인받기/g,'').trim()||'이용권':'이용권';
   return <div key={t.href}><a href={t.href} rel="sponsored noopener noreferrer" target="_blank" className="flex min-h-11 flex-wrap items-center justify-center gap-x-1 rounded-xl bg-free px-3 py-2 text-center text-sm font-bold leading-6 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-free"><span className="break-keep">{discount?(tickets.length>1?kind+' 가격·할인 혜택':'가격·할인 혜택'):kind+' 가격'}</span><span className="whitespace-nowrap">확인 ↗</span></a>{discount&&<p className="mt-1 break-keep text-xs leading-5 text-ink-soft">{b!.conditions} · {new Date(b!.endsAt).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}까지</p>}</div>;
  })}</div><p className="mt-3 break-keep text-xs leading-5 text-ink-soft">와그 예약 페이지로 이동합니다.</p></>:<p className="mt-3 break-keep text-sm leading-6">확인된 이용권의 판매 기간이 지났습니다. 새 이용권을 확인하고 있습니다.</p>}
 </aside>;
}
