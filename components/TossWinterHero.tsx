'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import {affiliateTrack} from '@/lib/affiliate-track';
import {homeProductAds,selectHomeProductAds,unitPriceFor} from '@/lib/home-product-ads.mjs';
import {freshnessMs} from '@/lib/sharelink-policy.mjs';
import {useTossFeed} from './TossFeedProvider';
import styles from './TossWinterHero.module.css';

export type SeasonalHeroData={collections:{slug:string;title:string}[]};
const won=new Intl.NumberFormat('ko-KR');
function useHomeAdSelection(){
 const {feed,now}=useTossFeed();
 const [expiry,setExpiry]=useState(0);
 const products=selectHomeProductAds(feed,Math.max(now,expiry)),count=products.length;
 const deadline=Math.min(Date.parse(feed.checkedAt)+freshnessMs,...products.map(p=>p.endAt?Date.parse(p.endAt):Infinity));
 useEffect(()=>{
  if(!count||!Number.isFinite(deadline))return;
  const timer=setTimeout(()=>setExpiry(Date.now()),Math.max(0,deadline-Date.now()+1));return()=>clearTimeout(timer);
 },[count,deadline]);
 const reviewed=homeProductAds.map(ad=>({...ad,href:ad.reviewedHref,price:null}));
 function isCurrent(id:number,priced:boolean){
  if(!priced)return true;
  const checked=Date.now();
  if(selectHomeProductAds(feed,checked).some(product=>product.id===id))return true;
  setExpiry(checked);
  return false;
 }
 return {products:products.length?products:reviewed,isCurrent};
}
export default function TossWinterHero({collections}:SeasonalHeroData){
 const selection=useHomeAdSelection();
 const page=usePathname()||'/';
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[hover,setHover]=useState(false);
 const [visible,setVisible]=useState(false),[reduced,setReduced]=useState(true),[foreground,setForeground]=useState(true);
 const node=useRef<HTMLElement>(null),seen=useRef(new Set<number>()),swipe=useRef({x:0,y:0,moved:false});
 const count=selection.products.length,position=count?index%count:0,active=selection.products[position];
 const cheapest=count>1&&active?.price!=null&&active.price===selection.products[0]?.price;
 const action=cheapest?'추천 중 최저가 확인하기':'토스 가격 확인하기';
 useEffect(()=>{
  const m=matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(m.matches),visibility=()=>setForeground(!document.hidden);
  change();visibility();m.addEventListener('change',change);document.addEventListener('visibilitychange',visibility);
  return()=>{m.removeEventListener('change',change);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 useEffect(()=>{
  if(!node.current||!count)return;
  const observer=new IntersectionObserver(entries=>setVisible(entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.5)),{threshold:.5});
  observer.observe(node.current);return()=>observer.disconnect();
 },[count]);
 useEffect(()=>{
  if(count<2||paused||hover||!visible||reduced||!foreground)return;
  const timer=setInterval(()=>setIndex(i=>(i+1)%count),6500);return()=>clearInterval(timer);
 },[count,paused,hover,visible,reduced,foreground]);
 useEffect(()=>{
  if(!active||!visible||!foreground||seen.current.has(active.id))return;
  seen.current.add(active.id);affiliateTrack('affiliate_impression','toss','home_product_hero',page,active.id);
 },[active?.id,visible,foreground,page]);
 function choose(next:number){setPaused(true);setIndex((next+count)%count);}
 return <div className={styles.wrap} data-seasonal-hero>
  {active?<section ref={node} className={styles.hero} data-tone={active.tone} role="region" aria-roledescription="캐러셀" aria-label="토스쇼핑 먹거리 추천"
   onPointerEnter={e=>{if(e.pointerType==='mouse')setHover(true);}} onPointerLeave={()=>setHover(false)}
   onFocusCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node)&&!(e.target as HTMLElement).closest('[data-playback-control]'))setPaused(true);}}>
   <a className={styles.bannerLink} href={active.href} rel="sponsored noreferrer" aria-label={active.name+(active.price!==null?' · '+won.format(active.price)+'원':'')+' · '+action}
    onTouchStart={e=>{setPaused(true);swipe.current={x:e.touches[0].clientX,y:e.touches[0].clientY,moved:false};}}
    onTouchCancel={()=>{swipe.current.moved=false;}}
    onTouchEnd={e=>{const dx=e.changedTouches[0].clientX-swipe.current.x,dy=e.changedTouches[0].clientY-swipe.current.y;if(count>1&&Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){swipe.current.moved=true;choose(index+(dx<0?1:-1));}}}
    onClick={e=>{if(swipe.current.moved){e.preventDefault();swipe.current.moved=false;return;}
     if(!selection.isCurrent(active.id,active.price!==null)){e.preventDefault();return;}
     affiliateTrack('affiliate_click','toss','home_product_hero',page,active.id);}}>
    <div className={styles.copy}><span className={styles.ad}>광고 · 토스쇼핑</span><h2>{active.title}</h2><p className={styles.product}>{active.option}</p>
     <div className={styles.offer}>{active.price!==null&&<div className={styles.priceBlock}><strong>{won.format(active.price)}원</strong><small>{unitPriceFor(active)}</small></div>}<span className={styles.cta}>{action} →</span></div></div>
    <div className={styles.visual}><picture><source media="(max-width:560px)" srcSet={'/ads/home-products/'+active.id+'-compact-sm.webp'}/><img className={styles.scene} src={'/ads/home-products/'+active.id+'-wide.webp'} width={768} height={384} alt={active.imageCopy+' · '+active.scene} loading="eager" fetchPriority="high" decoding="async"/></picture>
     <small className={styles.photoNote}>AI 연출 이미지</small></div>
   </a>
  </section>:null}
  <div className={styles.footer}>
   <nav className={styles.collectionLinks} aria-label="상품 모음 바로가기">{collections.map(c=><Link key={c.slug} href={'/shopping/'+c.slug} prefetch={false}>{c.title}</Link>)}</nav>
   {count>1&&<div className={styles.controls} aria-label="상품 넘기기">
    <span aria-live={paused?'polite':'off'}>{position+1} / {count}</span>
    <button type="button" aria-label="이전 상품" onClick={()=>choose(index-1)}>‹</button><button type="button" aria-label="다음 상품" onClick={()=>choose(index+1)}>›</button>
    {!reduced&&<button type="button" data-playback-control aria-label={paused?'자동 재생 시작':'자동 재생 일시정지'} aria-pressed={paused} onClick={()=>setPaused(p=>!p)}>{paused?'▶':'Ⅱ'}</button>}
   </div>}
  </div>
  {active&&<p className={styles.disclosure}>제휴 링크로 구매하면 수수료를 지급받습니다.</p>}
 </div>;
}
