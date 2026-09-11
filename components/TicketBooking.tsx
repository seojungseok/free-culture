'use client';
import {useEffect,useRef,useState} from 'react';
import type {TicketArticle} from '@/lib/tickets';
import {bookingLabel,guaranteeActive} from '@/lib/ticket-guarantee.mjs';
import styles from './TicketEditorial.module.css';
export default function TicketBooking({article,mobile=false}:{article:TicketArticle;mobile?:boolean}) {
  const [now,setNow]=useState<number|null>(null);
  const bar=useRef<HTMLElement>(null),[height,setHeight]=useState(150);
  useEffect(()=>{const update=()=>setNow(Date.now());update();const id=setInterval(update,30000);return()=>clearInterval(id);},[]);
  useEffect(()=>{if(!mobile||!bar.current)return;const observer=new ResizeObserver(entries=>setHeight(Math.ceil(entries[0].contentRect.height)+40));observer.observe(bar.current);return()=>observer.disconnect();},[mobile]);
  useEffect(()=>{if(!mobile)return;document.body.style.setProperty('--ticket-booking-height',`${height}px`);return()=>{document.body.style.removeProperty('--ticket-booking-height');};},[mobile,height]);
  const day=new Date(now ?? Date.parse(article.publishedAt)).toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
  const tickets=article.tickets.filter(t=>!t.validUntil||t.validUntil>=day);
  const [selected,setSelected]=useState(article.tickets[0]?.href||'');
  const chosen=tickets.find(t=>t.href===selected)||tickets[0];
  const link=(t:TicketArticle['tickets'][number])=><a className={styles.button} href={t.href} target="_blank" rel="sponsored noopener noreferrer">{bookingLabel(t.priceGuarantee,t.href,now ?? NaN)}</a>;
  if(mobile)return <div className={styles.mobileSpace} style={{height}}><aside ref={bar} className={styles.mobileBar} aria-label="모바일 예약 확인">
    {tickets.length>1&&<label className={styles.selectLabel}>이용권 선택<select value={chosen?.href} onChange={e=>setSelected(e.target.value)}>{tickets.map(t=><option value={t.href} key={t.href}>{t.label}</option>)}</select></label>}
    {chosen?link(chosen):<p>현재 확인 가능한 이용권이 없습니다.</p>}
  </aside></div>;
  return <aside id="ticket-booking" className={styles.booking} aria-label="이용권 및 예약 안내"><h3>방문일에 맞는 이용권 확인</h3><p>옵션별 포함 사항과 이용 조건을 읽고 방문 날짜를 선택하세요.</p>
    {tickets.map(t=><div className={styles.option} key={t.href}><h4>{t.label}</h4>
      {now!==null&&guaranteeActive(t.priceGuarantee,t.href,now)&&<><span className={styles.badge}>와그 최저가보장 상품</span><p className={styles.note}>와그가 해당 상품에 안내한 보장으로, 아래 조건이 적용됩니다.</p><p>{t.priceGuarantee!.conditions}</p><p className={styles.note}><a href={t.priceGuarantee!.sourceUrl} rel="sponsored noopener noreferrer" target="_blank">확인한 와그 상품 안내</a> · 확인일 {t.priceGuarantee!.checkedAt.slice(0,10)}</p></>}
      {link(t)}
    </div>)}{!tickets.length&&<p>현재 확인 가능한 이용권이 없습니다.</p>}
  </aside>;
}
