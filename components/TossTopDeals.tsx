'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import {usePathname} from 'next/navigation';
import {affiliateTrack} from '@/lib/affiliate-track';
import {freshnessMs} from '@/lib/sharelink-policy.mjs';
import {selectTopDeals} from '@/lib/toss-top-deals.mjs';
import {useTossFeed} from './TossFeedProvider';
import styles from './TossTopDeals.module.css';

export default function TossTopDeals({contained=false}:{contained?:boolean}) {
 const page=usePathname()||'/';
 const {feed,now}=useTossFeed();
 const [expiryClock,setExpiryClock]=useState(0);
 const strip=useRef<HTMLDivElement>(null);
 const seen=useRef(new Set<string>());
 const effectiveNow=Math.max(now,expiryClock);
 const deals=useMemo(()=>effectiveNow>0?selectTopDeals(feed,effectiveNow):[],[feed,effectiveNow]);

 // Recheck at the exact deal or feed expiry, even between the shared clock ticks.
 useEffect(()=>{
  if(!deals.length)return;
  const deadlines=[Date.parse(feed.checkedAt)+freshnessMs,...deals.map(p=>Date.parse(p.endAt!))];
  const delay=Math.max(0,Math.min(...deadlines)-Date.now()+5);
  const timer=setTimeout(()=>setExpiryClock(Date.now()),Math.min(delay,2147483647));
  return()=>clearTimeout(timer);
 },[deals,feed.checkedAt]);

 useEffect(()=>{
  const node=strip.current;if(!node||!deals.length)return;
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting)continue;
    const id=Number((entry.target as HTMLElement).dataset.product),key=`${page}:${id}`;
    if(!seen.current.has(key)){affiliateTrack('affiliate_impression','toss','food_deal_rail',page,id);seen.current.add(key);}
   }
  },{threshold:0.5});
  node.querySelectorAll('[data-product]').forEach(card=>observer.observe(card));
  return()=>observer.disconnect();
 },[deals,page]);

 if(!deals.length)return null;
 return <section className={`${styles.wrap} ${contained?styles.contained:''} ${page.startsWith('/game')?styles.game:''}`} aria-label="토스쇼핑 오늘의 먹거리 하루특가">
   <div className={styles.heading}><h2>오늘의 먹거리 특가</h2><div className={styles.controls}><button type="button" aria-label="이전 특가 상품" onClick={()=>strip.current?.scrollBy({left:-strip.current.clientWidth,behavior:'auto'})}>‹</button><button type="button" aria-label="다음 특가 상품" onClick={()=>strip.current?.scrollBy({left:strip.current.clientWidth,behavior:'auto'})}>›</button></div></div>
   <p className={styles.disclosure}>[광고] 토스쇼핑 쉐어링크 활동으로, 링크 구매 시 수수료를 지급받습니다.</p>
   <div ref={strip} className={styles.rail} role="region" aria-label="오늘의 하루특가 상품 목록. 좌우로 스크롤할 수 있습니다." tabIndex={0}>
    {deals.map(p=><article className={styles.card} data-product={p.id} key={p.id}>
     <a href={p.links.home} target="_blank" rel="sponsored noopener noreferrer" onClick={()=>affiliateTrack('affiliate_click','toss','food_deal_rail',page,p.id)} aria-label={`${p.name}, ${p.price.toLocaleString('ko-KR')}원. 토스에서 확인 (새 창)`}>
      <img src={p.image} alt="" width={240} height={180} loading="lazy" decoding="async" />
      <h3>{p.name}</h3><p className={styles.price}><span>{p.discountRate}% </span><strong>{p.price.toLocaleString('ko-KR')}원</strong></p><p className={styles.end}>{new Date(p.endAt!).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})} 종료 예정</p>
     </a>
    </article>)}
   </div>
   <p className={styles.fine}>확인 시점의 할인율과 가격입니다. 옵션·재고·배송 조건은 토스에서 확인하세요.</p>
 </section>;
}
