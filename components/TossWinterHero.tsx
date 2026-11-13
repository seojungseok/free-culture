'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import catalogue from '@/data/seasonal-shopping.json';
import {affiliateTrack} from '@/lib/affiliate-track';
import styles from './TossWinterHero.module.css';

const campaigns=catalogue.campaigns;
export default function TossWinterHero(){
 const page=usePathname()||'/';
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[hover,setHover]=useState(false);
 const [visible,setVisible]=useState(false),[reduced,setReduced]=useState(true),[foreground,setForeground]=useState(true);
 const node=useRef<HTMLDivElement>(null),seen=useRef(new Set<string>()),swipe=useRef({x:0,y:0,moved:false});
 const active=campaigns[index%campaigns.length];
 useEffect(()=>{
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(motion.matches),visibility=()=>setForeground(!document.hidden);
  change();visibility();motion.addEventListener('change',change);document.addEventListener('visibilitychange',visibility);
  return()=>{motion.removeEventListener('change',change);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 useEffect(()=>{
  if(!node.current)return;
  const observer=new IntersectionObserver(entries=>setVisible(entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.35)),{threshold:.35});
  observer.observe(node.current);return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  if(campaigns.length<2||paused||hover||!visible||reduced||!foreground)return;
  const timer=setInterval(()=>setIndex(i=>(i+1)%campaigns.length),5000);
  return()=>clearInterval(timer);
 },[paused,hover,visible,reduced,foreground]);
 useEffect(()=>{
  if(!visible||!foreground)return;
  const key=page+':'+active.key;
  if(seen.current.has(key))return;
  seen.current.add(key);affiliateTrack('collection_impression','toss','home_seasonal_hero',page);
 },[active.key,page,visible,foreground]);
 useEffect(()=>{
  if(!visible||!foreground)return;
  const next=campaigns[(index+1)%campaigns.length],image=new Image();
  image.src=matchMedia('(max-width:767px)').matches?next.artMobile:next.art;
 },[index,visible,foreground]);
 const choose=(next:number)=>{setPaused(true);setIndex((next+campaigns.length)%campaigns.length);};
 return <section className={styles.wrap} aria-label="겨울 쇼핑 모음" data-seasonal-hero>
  <div ref={node} className={styles.hero} role="group" aria-roledescription="캐러셀" aria-label="겨울 쇼핑 기획전"
   onPointerEnter={e=>{if(e.pointerType==='mouse')setHover(true);}} onPointerLeave={()=>setHover(false)}
   onFocusCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node)&&!(e.target as HTMLElement).closest('[data-playback-control]'))setPaused(true);}}>
   <Link className={styles.bannerLink} href={active.href} prefetch={false} aria-label={active.title+' · '+active.label+' 모음 보기'}
    onTouchStart={e=>{setPaused(true);swipe.current={x:e.touches[0].clientX,y:e.touches[0].clientY,moved:false};}}
    onTouchCancel={()=>{swipe.current.moved=false;}}
    onTouchEnd={e=>{const dx=e.changedTouches[0].clientX-swipe.current.x,dy=e.changedTouches[0].clientY-swipe.current.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){swipe.current.moved=true;choose(index+(dx<0?1:-1));}}}
    onClick={e=>{if(swipe.current.moved){e.preventDefault();swipe.current.moved=false;return;}affiliateTrack('collection_click','toss','home_seasonal_hero',page);}}>
    <picture className={styles.visual}><source media="(max-width:767px)" srcSet={active.artMobile} width={960} height={320}/><img className={styles.scene} src={active.art} alt={active.title+' · '+active.label+' 모음 · AI 연출'} width={1760} height={320} loading="eager" fetchPriority="high" decoding="async"/></picture>
    <h2 className={styles.screenReader}>{active.title}</h2>
    <span className={styles.ad}>광고</span>
   </Link>
   <div className={styles.navigation}><div className={styles.controls} aria-label="기획전 넘기기">
    <span className={styles.position} aria-live={paused?'polite':'off'} aria-atomic="true">{index%campaigns.length+1} / {campaigns.length}</span>
    <button type="button" aria-label="이전 기획전" onClick={()=>choose(index-1)}>‹</button>
    <button type="button" aria-label="다음 기획전" onClick={()=>choose(index+1)}>›</button>
    {!reduced&&<button type="button" data-playback-control aria-label={paused?'기획전 자동 재생 시작':'기획전 자동 재생 일시정지'} aria-pressed={paused} onClick={()=>setPaused(p=>!p)}>{paused?'▶':'Ⅱ'}</button>}
   </div></div>
  </div>
  <nav className={styles.collectionLinks} aria-label="겨울 상품 모음 바로가기">{catalogue.collections.map(c=><Link key={c.slug} href={'/shopping/'+c.slug} prefetch={false}>{c.title}</Link>)}</nav>
  <p className={styles.disclosure}>[광고] 배너는 AI 연출입니다. 모음에서 실제 상품을 골라보세요. 제휴 링크로 구매 시 수수료를 지급받습니다.</p>
 </section>;
}
