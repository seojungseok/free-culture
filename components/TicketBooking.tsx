'use client';
import {useEffect,useRef,useState} from 'react';
import type {TicketArticle} from '@/lib/tickets';
import {bookingLabel,guaranteeActive} from '@/lib/ticket-guarantee.mjs';
import styles from './TicketEditorial.module.css';
import reservation from './TicketReservation.module.css';
import TicketComparison from './TicketComparison';
import useTicketClock from './useTicketClock';
export default function TicketBooking({article,mobile=false}:{article:TicketArticle;mobile?:boolean}) {
  const [now,setNow]=useState<number|null>(null);
  const bar=useRef<HTMLElement>(null),[height,setHeight]=useState(150);
  useEffect(()=>{const update=()=>setNow(Date.now());update();const id=setInterval(update,30000);return()=>clearInterval(id);},[]);
  useEffect(()=>{if(!mobile||!bar.current)return;const observer=new ResizeObserver(entries=>setHeight(Math.ceil(entries[0].contentRect.height)+40));observer.observe(bar.current);return()=>observer.disconnect();},[mobile]);
  useEffect(()=>{if(!mobile)return;document.body.style.setProperty('--ticket-booking-height',`${height}px`);return()=>{document.body.style.removeProperty('--ticket-booking-height');};},[mobile,height]);
  const {day}=useTicketClock(article);
  const tickets=article.tickets;
  const [selected,setSelected]=useState(article.tickets[0]?.href||'');
  const chosen=tickets.find(t=>t.href===selected)||tickets[0];
  const expired=(t:TicketArticle['tickets'][number])=>!!t.validUntil&&t.validUntil<day;
  const link=(t:TicketArticle['tickets'][number])=><a className={mobile?styles.button:reservation.cta} href={t.href} target="_blank" rel="sponsored noopener noreferrer">{expired(t)?'최신 이용권 가격·혜택 확인':bookingLabel(t.priceGuarantee,t.href,now ?? NaN)}</a>;
  if(mobile)return <div className={styles.mobileSpace} style={{height}}><aside ref={bar} className={styles.mobileBar} aria-label="모바일 예약 확인">
    {tickets.length>1&&<label className={styles.selectLabel}>이용권 선택<select value={chosen?.href} onChange={e=>setSelected(e.target.value)}>{tickets.map(t=><option value={t.href} key={t.href}>{t.label}</option>)}</select></label>}
    {chosen?link(chosen):<p>현재 확인 가능한 이용권이 없습니다.</p>}
  </aside></div>;
  return <><TicketComparison article={article}/><aside id="ticket-booking" className={reservation.panel} aria-label="이용권 및 예약 안내">
    {tickets.map(t=>{const guaranteed=!expired(t)&&now!==null&&guaranteeActive(t.priceGuarantee,t.href,now);return <div className={reservation.option} key={t.href}>
      <div className={reservation.row}><div><h3 className={reservation.title}>{t.label==='이용권'?article.placeName+' 이용권 알아보기':t.label}</h3>
        {guaranteed&&<span className={reservation.badge}>와그 최저가보장</span>}
        <p className={reservation.context}>{expired(t)?`이전에 확인한 판매기간은 ${t.validUntil}까지예요. 링크에서 현재 판매 옵션을 볼 수 있어요.`:guaranteed?'와그 제공 · 조건 적용 · 승인 시 차액 포인트 보상':'방문일별 가격과 선택 가능한 옵션을 와그에서 볼 수 있어요.'}</p>
      </div>{link(t)}</div>
      {guaranteed&&<details className={reservation.conditions}><summary>보장 적용 조건·확인 출처 보기</summary><p>{t.priceGuarantee!.conditions}</p><p className={reservation.source}><a href={t.priceGuarantee!.sourceUrl} rel="sponsored noopener noreferrer" target="_blank">와그 상품 안내</a> · 확인일 {new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date(t.priceGuarantee!.checkedAt))} · 우리 사이트가 직접 보장하는 가격이 아닙니다.</p></details>}
    </div>;})}{!tickets.length&&<p>현재 확인 가능한 이용권이 없습니다.</p>}
  </aside></>;
}
