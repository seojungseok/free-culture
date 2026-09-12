'use client';
import type {TicketArticle} from '@/lib/tickets';
import TicketComparison from './TicketComparison';
import useTicketClock from './useTicketClock';
import {guaranteeActive} from '@/lib/ticket-guarantee.mjs';

export default function TicketLinks({article}:{article:TicketArticle}){
 const {now,day}=useTicketClock(article);
 const tickets=article.tickets;
 const available=tickets.filter(ticket=>!ticket.validUntil||ticket.validUntil>=day);
 const ticket=available.find(item=>guaranteeActive(item.priceGuarantee,item.href,now))||available[0]||tickets[0];
 const expired=!!ticket?.validUntil&&ticket.validUntil<day;
 const guarantee=!!ticket&&!expired&&guaranteeActive(ticket.priceGuarantee,ticket.href,now);
 const benefit=ticket?.verifiedBenefit;
 const discount=!expired&&!!(benefit?.sourceUrl&&benefit.conditions&&benefit.checkedAt&&Date.parse(benefit.checkedAt)<=now&&now-Date.parse(benefit.checkedAt)<86400000&&Date.parse(benefit.startsAt)<=now&&Date.parse(benefit.endsAt)>now);
 return <><TicketComparison article={article}/><aside aria-label="이용권 안내" className="my-8 rounded-[20px] border border-[#d7e3d3] bg-[#f7faf5] p-4 shadow-[0_10px_30px_rgba(34,74,43,0.06)] sm:p-5">
  <h2 className="break-keep text-lg font-extrabold tracking-[-0.02em] sm:text-xl">{article.placeName} 이용권 알아보기</h2>
  <p className="mt-1.5 break-keep text-sm leading-6 text-ink-soft">방문 날짜와 인원을 넣어 이용 가능한 옵션과 가격을 살펴볼 수 있어요.</p>
  {ticket?<div className="mt-4 rounded-2xl border border-[#e1e9de] bg-white p-2 shadow-[0_3px_10px_rgba(34,74,43,0.04)]"><a href={ticket.href} rel="sponsored noopener noreferrer" target="_blank" className={`flex min-h-14 items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${guarantee?'bg-[#eb4770] hover:bg-[#d93660] focus-visible:outline-[#d93660]':'bg-[#03c75a] hover:bg-[#02ae4f] focus-visible:outline-[#03c75a]'}`}><span className="min-w-0"><span className="block break-keep text-sm font-extrabold leading-5">{expired?'이용권 최신 가격 확인':'이용권 가격·혜택 확인'}</span>{guarantee&&<span className="mt-1 block text-[11px] font-bold leading-4 text-white/90">와그 최저가보장 혜택 확인하기</span>}</span><span aria-hidden="true" className="shrink-0 text-lg leading-none">↗</span></a>{expired&&<p className="mt-2 break-keep px-1 text-xs leading-5 text-ink-soft">이전에 확인한 판매기간은 {ticket.validUntil}까지예요. 링크에서 현재 판매 옵션을 볼 수 있어요.</p>}{discount&&<p className="mt-2 break-keep px-1 text-xs leading-5 text-ink-soft">{benefit!.conditions} · {new Date(benefit!.endsAt).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}까지</p>}</div>:<p className="mt-3 break-keep text-sm leading-6">확인된 이용권의 판매 기간이 지났습니다. 새 이용권을 확인하고 있습니다.</p>}
 </aside></>;
}
