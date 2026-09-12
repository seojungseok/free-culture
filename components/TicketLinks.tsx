'use client';
import type {TicketArticle} from '@/lib/tickets';
import TicketComparison from './TicketComparison';
import useTicketClock from './useTicketClock';
import {guaranteeActive} from '@/lib/ticket-guarantee.mjs';

export default function TicketLinks({article}:{article:TicketArticle}){
 const {now,day}=useTicketClock(article);
 const tickets=article.tickets;
 const hasGuarantee=tickets.some(ticket=>{
  const expired=!!ticket.validUntil&&ticket.validUntil<day;
  return !expired&&guaranteeActive(ticket.priceGuarantee,ticket.href,now);
 });
 return <><TicketComparison article={article}/><aside aria-label="이용권 안내" className="my-8 rounded-[20px] border border-[#d7e3d3] bg-[#f7faf5] p-4 shadow-[0_10px_30px_rgba(34,74,43,0.06)] sm:p-5">
  <h2 className="break-keep text-lg font-extrabold tracking-[-0.02em] sm:text-xl">{article.placeName} 이용권 알아보기</h2>
  <p className="mt-1.5 break-keep text-sm leading-6 text-ink-soft">와그 예약 페이지에서 현재 가격과 이용 혜택을 확인할 수 있어요.</p>
  {hasGuarantee&&<p className="mt-3 inline-flex rounded-full border border-[#f6b0c0] bg-[#fff0f4] px-3 py-1.5 text-xs font-bold leading-5 text-[#bd2750]">와그 최저가보장 표기 상품은 핑크 버튼으로 표시했어요.</p>}
  {tickets.length?<><div className="mt-4 flex flex-col gap-2.5">{tickets.map(t=>{
   const expired=!!t.validUntil&&t.validUntil<day; const guarantee=!expired&&guaranteeActive(t.priceGuarantee,t.href,now);
   const b=t.verifiedBenefit;const discount=!expired&&!!(b?.sourceUrl&&b.conditions&&b.checkedAt&&Date.parse(b.checkedAt)<=now&&now-Date.parse(b.checkedAt)<86400000&&Date.parse(b.startsAt)<=now&&Date.parse(b.endsAt)>now);
   const kind=tickets.length>1?t.label.replace(/\s*(보기|가격 확인|가격·할인 혜택 확인)\s*$/,'').replace(/특가|최저가|할인받기/g,'').trim()||'이용권':'이용권';
   const label=expired?kind+' 최신 가격 확인':kind+' 가격·혜택 확인';
   return <div key={t.href} className="rounded-2xl border border-[#e1e9de] bg-white p-2 shadow-[0_3px_10px_rgba(34,74,43,0.04)]"><a href={t.href} rel="sponsored noopener noreferrer" target="_blank" className={`flex min-h-14 items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${guarantee?'bg-[#eb4770] hover:bg-[#d93660] focus-visible:outline-[#d93660]':'bg-[#236b3d] hover:bg-[#195630] focus-visible:outline-[#236b3d]'}`}><span className="min-w-0"><span className="block break-keep text-sm font-extrabold leading-5">{label}</span>{guarantee&&<span className="mt-1 block text-[11px] font-bold leading-4 text-white/90">와그 최저가보장</span>}</span><span aria-hidden="true" className="shrink-0 text-lg leading-none">↗</span></a>{expired&&<p className="mt-2 break-keep px-1 text-xs leading-5 text-ink-soft">이전에 확인한 판매기간은 {t.validUntil}까지예요. 링크에서 현재 판매 옵션을 볼 수 있어요.</p>}{discount&&<p className="mt-2 break-keep px-1 text-xs leading-5 text-ink-soft">{b!.conditions} · {new Date(b!.endsAt).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}까지</p>}</div>;
  })}</div><p className="mt-3 break-keep text-xs leading-5 text-ink-soft">와그 제휴 예약 페이지로 이동합니다.</p></>:<p className="mt-3 break-keep text-sm leading-6">확인된 이용권의 판매 기간이 지났습니다. 새 이용권을 확인하고 있습니다.</p>}
 </aside></>;
}
