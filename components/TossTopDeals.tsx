'use client';

import {useEffect, useId, useMemo, useRef, useState} from 'react';
import {usePathname} from 'next/navigation';
import {affiliateTrack} from '@/lib/affiliate-track';
import {freshnessMs} from '@/lib/sharelink-policy.mjs';
import {selectTopDeals,topDealGroups,topDealGroup,topDealOption,topDealPreparation} from '@/lib/toss-top-deals.mjs';
import {useTossFeed} from './TossFeedProvider';
import styles from './TossTopDeals.module.css';

export default function TossTopDeals({contained=false}:{contained?:boolean}) {
 const page=usePathname()||'/';
 const {feed,now}=useTossFeed();
 const [expiryClock,setExpiryClock]=useState(0);
 const [group,setGroup]=useState('all');
 const [dealPage,setDealPage]=useState(0);
 const railId=useId();
 const strip=useRef<HTMLDivElement>(null);
 const seen=useRef(new Set<string>());
 const effectiveNow=Math.max(now,expiryClock);
 const eligible=useMemo(()=>effectiveNow>0?selectTopDeals(feed,effectiveNow,{isHome:page==='/'}):[],[feed,effectiveNow,page]);
 const groups=topDealGroups.filter(g=>g.id==='all'||eligible.some(p=>topDealGroup(p)===g.id));
 const activeGroup=groups.some(g=>g.id===group)?group:'all';
 const matching=useMemo(()=>activeGroup==='all'?eligible:eligible.filter(p=>topDealGroup(p)===activeGroup),[eligible,activeGroup]);
 const pageCount=Math.ceil(matching.length/6);
 const activePage=Math.min(dealPage,Math.max(0,pageCount-1));
 const deals=useMemo(()=>matching.slice(activePage*6,activePage*6+6),[matching,activePage]);

 useEffect(()=>{strip.current?.scrollTo({left:0,behavior:'auto'});},[activeGroup,activePage,page]);

 // Recheck at the exact deal or feed expiry, even between the shared clock ticks.
 useEffect(()=>{
  if(!eligible.length)return;
  const deadlines=[Date.parse(feed.checkedAt)+freshnessMs,...eligible.map(p=>Date.parse(p.endAt!))];
  const delay=Math.max(0,Math.min(...deadlines)-Date.now()+5);
  const timer=setTimeout(()=>setExpiryClock(Date.now()),Math.min(delay,2147483647));
  return()=>clearTimeout(timer);
 },[eligible,feed.checkedAt]);

 useEffect(()=>{
  const node=strip.current;if(!node||!deals.length)return;
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting||entry.intersectionRatio<0.5)continue;
    const id=Number((entry.target as HTMLElement).dataset.product),key=`${page}:${id}`;
    if(!seen.current.has(key)){affiliateTrack('affiliate_impression','toss','food_deal_rail',page,id);seen.current.add(key);}
   }
  },{threshold:0.5});
  node.querySelectorAll('[data-product]').forEach(card=>observer.observe(card));
  return()=>observer.disconnect();
 },[deals,page]);

 if(!deals.length)return null;
 return <section className={`${styles.wrap} ${contained?styles.contained:''} ${page.startsWith('/game')?styles.game:''}`} aria-label="토스쇼핑 오늘의 먹거리 하루특가">
   <div className={styles.heading}><h2>오늘의 먹거리 특가</h2><span className={styles.count} role="status" aria-live="polite">{groups.find(g=>g.id===activeGroup)?.label} · {activePage*6+1}–{activePage*6+deals.length} / {matching.length}개</span></div>
   {groups.length>2&&<div className={styles.filters} role="group" aria-label="먹거리 종류">{groups.map(g=><button type="button" key={g.id} aria-pressed={activeGroup===g.id} aria-controls={railId} onClick={()=>{setGroup(g.id);setDealPage(0);}}>{g.label}</button>)}</div>}
   <p className={styles.disclosure}>[광고] 토스쇼핑 쉐어링크 활동으로, 링크 구매 시 수수료를 지급받습니다.</p>
   <div id={railId} ref={strip} className={styles.rail} role="region" aria-label={`${groups.find(g=>g.id===activeGroup)?.label} 특가 ${deals.length}개. 좌우로 스크롤할 수 있습니다.`} tabIndex={0}>
    {deals.map(p=><article className={styles.card} data-product={p.id} key={p.id}>
     <a href={p.links.home} target="_blank" rel="sponsored noopener noreferrer" onClick={()=>affiliateTrack('affiliate_click','toss','food_deal_rail',page,p.id)} aria-label={`${p.name}, ${p.price.toLocaleString('ko-KR')}원. 토스에서 확인 (새 창)`}>
      <img src={p.image} alt="" width={240} height={180} loading="lazy" decoding="async" />
      <p className={styles.preparation}>{topDealPreparation(p)}</p>
      <h3 title={p.name}>{p.name}</h3><p className={styles.option} title={topDealOption(p)}>{topDealOption(p)||'판매 옵션은 상세에서 확인'}</p>
      <p className={styles.price}><span>{p.discountRate}% </span><strong>{p.price.toLocaleString('ko-KR')}원</strong></p><p className={styles.end}>{new Date(p.endAt!).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})} 종료 예정</p>
      <span className={styles.cta}>토스에서 확인 <span aria-hidden="true">↗</span></span>
     </a>
    </article>)}
   </div>
   <div className={styles.footer}><p className={styles.dealHint}><time dateTime={feed.checkedAt}>{new Date(feed.checkedAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})}</time> 확인(한국시간) · 할인율은 토스 표시 기준 · 배송비·최종 조건은 구매 화면에서 확인하세요.<span className={styles.desktopHint}> PC에서는 QR코드로 가격을 확인해요.</span></p>{pageCount>1&&<div className={styles.controls}><button type="button" disabled={activePage===0} aria-controls={railId} aria-label="이전 특가 상품 최대 6개" onClick={()=>setDealPage(activePage-1)}>이전</button><button type="button" disabled={activePage>=pageCount-1} aria-controls={railId} aria-label={activePage>=pageCount-1?'마지막 특가 상품입니다':`특가 상품 더보기, 다음 ${Math.min(6,matching.length-(activePage+1)*6)}개`} onClick={()=>setDealPage(activePage+1)}>상품 더보기 →</button></div>}</div>
 </section>;
}
