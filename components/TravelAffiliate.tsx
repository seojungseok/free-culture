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
   <article className={styles.stay}><a className={styles.scene} href={stay} target="_blank" rel="sponsored noopener noreferrer" onClick={()=>track('affiliate_click','stay',page)}><img src="/affiliate-images/weekend-stay-v2.webp" alt="객실 분위기 AI 연출 · 특정 숙소 사진 아님" width={240} height={180} loading="lazy"/></a><div className={styles.copy}><span className={styles.tag}>국내 숙소 · 세시간전 제휴</span><h3>돌아가는 대신, 하루 더 쉬어갈까요?</h3><p>여기어때 호텔 기획전에서 여행 날짜와 지역을 골라보세요. 혜택은 숙소·날짜에 따라 달라집니다.</p><p className={styles.disclosure}>[광고] 세시간전 제휴 링크를 통한 숙소 예약 시 수수료를 지급받습니다.</p><a href={stay} target="_blank" rel="sponsored noopener noreferrer" onClick={()=>track('affiliate_click','stay',page)}>내 여행 날짜로 숙소 살펴보기 <span aria-hidden="true">↗</span></a><small>AI 연출 이미지 · 특정 숙소 사진 아님. 지역·날짜는 이동 후 선택하세요.</small></div></article>
  </div>
 </section>;
}
