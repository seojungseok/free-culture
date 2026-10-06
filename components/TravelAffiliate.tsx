'use client';
import {useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import styles from './TravelAffiliate.module.css';
import {affiliateTrack} from '@/lib/affiliate-track';
const ticket='https://www.waug.com/r/99PBHMQK',stay='https://3ha.in/r/722026';
function track(event:string,provider:string,page:string){affiliateTrack(event,provider,page==='/'?'home_plan':'article_plan',page);}
export default function TravelAffiliate({home=false}:{home?:boolean}){
 const page=usePathname()||'/',ref=useRef<HTMLElement>(null),seen=useRef(new Set<string>()),[title,setTitle]=useState(''),[day,setDay]=useState('');
 useEffect(()=>{setTitle(document.querySelector('h1')?.textContent||'');setDay(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));},[page]);
 const relevant=home||/^\/(places\/spot\/|course\/c\/|date\/c\/|event\/|camping\/[^/]+$|pet-travel\/)/.test(page);
 const ticketVisible=!!day&&day<='2026-12-31'&&(home||title.includes('허브아일랜드'));
 useEffect(()=>{if(!ref.current||!relevant)return;const observer=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return;for(const provider of ticketVisible?['waug','stay']:['stay']){const key=`${page}:${provider}`;if(!seen.current.has(key)){track('affiliate_impression',provider,page);seen.current.add(key);}}},{threshold:0.5});observer.observe(ref.current);return()=>observer.disconnect();},[page,relevant,ticketVisible]);
 if(!relevant)return null;
 return <section ref={ref} className={styles.wrap} aria-label="여행 티켓과 숙소 제휴 안내">
  <div className={styles.intro}><span>PLAN YOUR WEEKEND</span><h2>갈 곳을 찾았다면, 여행을 완성해 보세요</h2><p>입장권은 날짜와 옵션을, 숙소는 이동 동선과 취소 조건을 먼저 확인하세요.</p></div>
  <div className={styles.grid}>
   {ticketVisible&&<article className={styles.ticket}><img src="/ticket-images/herb-island-6b87a5714e79.jpg" alt="허브아일랜드 나들이" width={480} height={320} loading="lazy"/><div className={styles.copy}><span className={styles.tag}>포천 · 정원 나들이</span><h3>허브아일랜드, 입장권부터 확인해 볼까요?</h3><p>원하는 날의 옵션을 확인하고, 포함되는 이용 범위를 살펴보세요.</p><p className={styles.disclosure}>[광고] 와그 제휴 링크를 통한 구매 시 수수료를 지급받습니다.</p><a href={ticket} target="_blank" rel="sponsored noopener noreferrer" onClick={()=>track('affiliate_click','waug',page)}>와그에서 날짜·입장권 확인 <span aria-hidden="true">↗</span></a><small>상품 이용기한 2026.12.31 · 구매 전 최신 조건 확인</small></div></article>}
   <article className={styles.stay}><div className={styles.scene} aria-hidden="true"><svg viewBox="0 0 360 190" role="presentation"><rect width="360" height="190" rx="20" fill="#e8edff"/><rect x="24" y="20" width="105" height="95" rx="10" fill="#182d67"/><circle className={styles.moon} cx="88" cy="53" r="18" fill="#f9e4aa"/><path d="M40 104L78 79L112 104" fill="none" stroke="#7293c8" strokeWidth="4"/><rect x="52" y="112" width="220" height="45" rx="14" fill="#fff"/><rect x="52" y="127" width="220" height="30" rx="10" fill="#d4bba2"/><rect x="62" y="112" width="64" height="16" rx="8" fill="#fff5e8"/><rect x="131" y="112" width="64" height="16" rx="8" fill="#fff5e8"/><path d="M65 157V174M258 157V174" stroke="#6c5b53" strokeWidth="7"/><path d="M305 88V162" stroke="#a58256" strokeWidth="5"/><path className={styles.lamp} d="M284 89L293 58H317L326 89Z" fill="#ffce7a"/><path d="M289 162H321" stroke="#a58256" strokeWidth="5"/></svg></div><div className={styles.copy}><span className={styles.tag}>국내 숙소 · 세시간전 제휴</span><h3>돌아가는 대신, 하루 더 쉬어갈까요?</h3><p>여기어때 호텔 기획전에서 여행 날짜와 지역을 골라보세요. 혜택은 숙소·날짜에 따라 달라집니다.</p><p className={styles.disclosure}>[광고] 세시간전 제휴 링크를 통한 숙소 예약 시 수수료를 지급받습니다.</p><a href={stay} target="_blank" rel="sponsored noopener noreferrer" onClick={()=>track('affiliate_click','stay',page)}>내 여행 날짜로 숙소 살펴보기 <span aria-hidden="true">↗</span></a><small>국내 호텔 기획전으로 연결됩니다. 지역·날짜는 이동 후 선택하세요.</small></div></article>
  </div>
 </section>;
}
