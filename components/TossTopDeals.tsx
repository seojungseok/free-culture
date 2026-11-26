'use client';

import {useEffect, useId, useMemo, useRef, useState,type PointerEvent,type KeyboardEvent} from 'react';
import {usePathname} from 'next/navigation';
import {affiliateTrack} from '@/lib/affiliate-track';
import {freshnessMs} from '@/lib/sharelink-policy.mjs';
import {selectTopDeals,topDealGroups,topDealGroup} from '@/lib/toss-top-deals.mjs';
import {useTossFeed} from './TossFeedProvider';
import styles from './TossTopDeals.module.css';
import ArticleProducts from './ArticleProducts';
import {isShoppingArticle} from '@/lib/article-products.mjs';
const priceFormat=new Intl.NumberFormat('ko-KR');
const deadlineFormat=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});

export default function TossTopDeals(props:{contained?:boolean;compact?:boolean}) {
 const page=usePathname()||'/';
 const article=isShoppingArticle(page);
 const {contained=false,compact=false}=props;
 const placement=article?'article':'food_deal_rail';
 const meals=/^\/(camping|weekend-prep|food)(?:\/|$)/.test(page);
 const heading=article?(meals?'식사 준비 하루특가':'나들이 간식·음료 하루특가'):'오늘의 먹거리 특가';
 const {feed,now}=useTossFeed();
 const [expiryClock,setExpiryClock]=useState(0);
 const [group,setGroup]=useState('all');
 const railId=useId();
 const strip=useRef<HTMLDivElement>(null);
 const drag=useRef<{pointerId:number;x:number;y:number;left:number;moved:boolean}|null>(null);
 const suppressClick=useRef(false);
 const seen=useRef(new Set<string>());
 const effectiveNow=Math.max(now,expiryClock);
 const eligible=useMemo(()=>effectiveNow>0?selectTopDeals(feed,effectiveNow,{isHome:page==='/'}):[],[feed,effectiveNow,page]);
 const relevant=useMemo(()=>article?eligible.filter(p=>topDealGroup(p)===(meals?'meal':'snack')):eligible,[eligible,article,meals]);
 const groups=topDealGroups.filter(g=>g.id==='all'||relevant.some(p=>topDealGroup(p)===g.id));
 const activeGroup=!article&&groups.some(g=>g.id===group)?group:'all';
 const matching=useMemo(()=>activeGroup==='all'?relevant:relevant.filter(p=>topDealGroup(p)===activeGroup),[relevant,activeGroup]);
 const shown=useMemo(()=>compact&&!article?matching.slice(0,4):matching,[compact,article,matching]);
 const overflow=shown.length>4?'many':shown.length>2?'medium':'few';

 useEffect(()=>{drag.current=null;suppressClick.current=false;strip.current?.removeAttribute('data-dragging');strip.current?.scrollTo({left:0,behavior:'auto'});},[activeGroup,page]);

 function startDrag(event:PointerEvent<HTMLDivElement>){
  suppressClick.current=false;
  if(event.pointerType!=='mouse'||event.button!==0||!event.isPrimary||event.currentTarget.scrollWidth<=event.currentTarget.clientWidth)return;
  drag.current={pointerId:event.pointerId,x:event.clientX,y:event.clientY,left:event.currentTarget.scrollLeft,moved:false};
 }
 function moveDrag(event:PointerEvent<HTMLDivElement>){
  const state=drag.current;if(!state||state.pointerId!==event.pointerId)return;
  if((event.buttons&1)===0){finishDrag(event);return;}
  const dx=event.clientX-state.x,dy=event.clientY-state.y;
  if(!state.moved){
   if(Math.abs(dx)<8&&Math.abs(dy)<8)return;
   if(Math.abs(dy)>Math.abs(dx)){drag.current=null;suppressClick.current=true;return;}
   state.moved=true;event.currentTarget.dataset.dragging='true';event.currentTarget.setPointerCapture(event.pointerId);
  }
  event.preventDefault();event.currentTarget.scrollLeft=state.left-dx;
 }
 function finishDrag(event:PointerEvent<HTMLDivElement>){
  const state=drag.current;if(!state||state.pointerId!==event.pointerId)return;
  drag.current=null;suppressClick.current=state.moved;event.currentTarget.removeAttribute('data-dragging');
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
 }
 function moveWithKeyboard(event:KeyboardEvent<HTMLDivElement>){
  if(event.target!==event.currentTarget||event.altKey||event.ctrlKey||event.metaKey||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  const node=event.currentTarget,card=node.querySelector<HTMLElement>('[data-product]');if(!card)return;
  event.preventDefault();
  const step=card.getBoundingClientRect().width+parseFloat(getComputedStyle(node).columnGap||'0'),behavior=window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
  if(event.key==='Home'||event.key==='End')node.scrollTo({left:event.key==='Home'?0:node.scrollWidth,behavior});
  else node.scrollBy({left:(event.key==='ArrowRight'?1:-1)*step,behavior});
 }

 // Recheck at the exact deal or feed expiry, even between the shared clock ticks.
 useEffect(()=>{
  if(!eligible.length)return;
  const deadlines=[Date.parse(feed.checkedAt)+freshnessMs,...eligible.map(p=>Date.parse(p.endAt!))];
  const delay=Math.max(0,Math.min(...deadlines)-Date.now()+5);
  const timer=setTimeout(()=>setExpiryClock(Date.now()),Math.min(delay,2147483647));
  return()=>clearTimeout(timer);
 },[eligible,feed.checkedAt]);

 useEffect(()=>{
  const node=strip.current;if(!node||!shown.length)return;
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting||entry.intersectionRatio<0.5)continue;
    const id=Number((entry.target as HTMLElement).dataset.product),key=`${page}:${id}`;
    if(!seen.current.has(key)){affiliateTrack('affiliate_impression','toss',placement,page,id);seen.current.add(key);}
   }
  },{threshold:0.5});
  node.querySelectorAll('[data-product]').forEach(card=>observer.observe(card));
  return()=>observer.disconnect();
 },[shown,page,placement]);

 function articleHref(p:(typeof shown)[number]){
  const tagged=p.links[p.topic];
  return article&&tagged&&/^https:\/\/toss\.shopping\/_m\/[a-zA-Z0-9_-]+$/.test(tagged)?tagged:p.links.home;
 }
 if(!shown.length)return page==='/'?<ArticleProducts/>:null;
 return <section className={`${styles.wrap} ${contained?styles.contained:''} ${compact?styles.compact:''} ${page.startsWith('/game')?styles.game:''}`} data-nosnippet="" data-article-products={article?"":undefined} aria-label={heading}>
   <div className={styles.heading}><h2>{heading}</h2><span className={styles.count} role="status" aria-live="polite">{article?'토스쇼핑':groups.find(g=>g.id===activeGroup)?.label} · {shown.length}개</span></div>
   {!compact&&groups.length>2&&<div className={styles.filters} role="group" aria-label="먹거리 종류">{groups.map(g=><button type="button" key={g.id} aria-pressed={activeGroup===g.id} aria-controls={railId} onClick={()=>setGroup(g.id)}>{g.label}</button>)}</div>}
   <p className={styles.disclosure}>[광고] 토스쇼핑 쉐어링크 활동으로, 링크 구매 시 수수료를 지급받습니다.</p>
   <div id={railId} ref={strip} className={styles.rail} role="region" aria-label={`${groups.find(g=>g.id===activeGroup)?.label} 특가 ${shown.length}개`} aria-describedby={railId+'-hint'} tabIndex={0} data-overflow={overflow} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={finishDrag} onLostPointerCapture={finishDrag} onDragStart={event=>event.preventDefault()} onKeyDown={moveWithKeyboard} onClickCapture={event=>{if(suppressClick.current){suppressClick.current=false;if(event.detail>0){event.preventDefault();event.stopPropagation();}}}}>
    {shown.map(p=><article className={styles.card} data-product={p.id} key={p.id}>
     <a href={articleHref(p)} target="_blank" rel="sponsored noopener noreferrer" draggable={false} onClick={event=>{
       const clickedAt=Date.now();
       if(!selectTopDeals(feed,clickedAt).some(item=>item.id===p.id)){event.preventDefault();setExpiryClock(clickedAt);return;}
       affiliateTrack('affiliate_click','toss',placement,page,p.id);
      }} aria-label={`${p.name}, ${priceFormat.format(p.price)}원. 재고 확인하기 (새 창)`}>
      <img src={p.image} alt="" width={240} height={180} loading="lazy" decoding="async" draggable={false} />
      <h3 title={p.name}>{p.name}</h3>
      <p className={styles.price}><span>{p.discountRate}% </span><strong>{priceFormat.format(p.price)}원</strong></p><p className={styles.end}>{deadlineFormat.format(new Date(p.endAt!))} 특가 종료</p>
      <span className={styles.cta}>재고 확인하기 <span aria-hidden="true">↗</span></span>
     </a>
    </article>)}
   </div>
   <p id={railId+'-hint'} className={styles.swipeHint} data-overflow={overflow}>좌우로 밀어 더 보기 · PC에서는 마우스로 끌거나 방향키를 사용하세요.</p>
   {page!=='/'&&<div className={styles.footer}><p className={styles.dealHint}><time dateTime={feed.checkedAt}>{deadlineFormat.format(new Date(feed.checkedAt))}</time> 확인 · 할인율은 토스 표시 기준 · 배송비·옵션은 구매 화면 기준입니다.<span className={styles.desktopHint}> PC에서는 연결 화면의 QR코드를 스캔하세요.</span></p></div>}
 </section>;
}
