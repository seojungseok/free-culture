'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import {affiliateTrack} from '@/lib/affiliate-track';
import {freshnessMs} from '@/lib/sharelink-policy.mjs';
import {selectWinterTossHero,winterTossCampaign} from '@/lib/toss-winter-hero.mjs';
import {useTossFeed} from './TossFeedProvider';
import styles from './WinterFoodCoupang.module.css';
import heroStyles from './TossWinterHero.module.css';

export default function TossWinterHero(){
 const {feed,now}=useTossFeed(),page=usePathname()||'/';
 const [clock,setClock]=useState(0),[index,setIndex]=useState(0),[paused,setPaused]=useState(false),[hover,setHover]=useState(false),[visible,setVisible]=useState(false),[reduced,setReduced]=useState(true),[foreground,setForeground]=useState(true);
 const node=useRef<HTMLElement>(null),seen=useRef(new Set<number>()),swipe=useRef({x:0,moved:false});
 const time=Math.max(now,clock);
 const list=useMemo(()=>time>0?selectWinterTossHero(feed,time):[],[feed,time]);
 const active=list[index%list.length],art=active?winterTossCampaign(active):null;
 useEffect(()=>{
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(motion.matches),visibility=()=>setForeground(!document.hidden);
  change();visibility();motion.addEventListener('change',change);document.addEventListener('visibilitychange',visibility);
  return()=>{motion.removeEventListener('change',change);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 useEffect(()=>{
  if(!list.length)return;
  const deadline=Math.min(Date.parse(feed.checkedAt)+freshnessMs,...list.filter(p=>p.endAt).map(p=>Date.parse(p.endAt!)));
  const timer=setTimeout(()=>setClock(Date.now()),Math.min(Math.max(0,deadline-Date.now()+5),2147483647));
  return()=>clearTimeout(timer);
 },[feed.checkedAt,list]);
 useEffect(()=>{if(!node.current||!active)return;const observer=new IntersectionObserver(entries=>setVisible(entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.35)),{threshold:.35});observer.observe(node.current);return()=>observer.disconnect();},[!!active]);
 useEffect(()=>{if(list.length<2||paused||hover||!visible||reduced||!foreground)return;const timer=setInterval(()=>setIndex(i=>(i+1)%list.length),5000);return()=>clearInterval(timer);},[list.length,paused,hover,visible,reduced,foreground]);
 useEffect(()=>{if(!active||!visible||seen.current.has(active.id))return;seen.current.add(active.id);affiliateTrack('affiliate_impression','toss','home_winter_hero',page,active.id);},[active?.id,page,visible]);
 if(!active)return null;
 const choose=(next:number)=>setIndex((next+list.length)%list.length);
 const click=()=>affiliateTrack('affiliate_click','toss','home_winter_hero',page,active.id);
 return <section ref={node} className={styles.wrap} aria-label="토스 겨울 먹거리 기획전">
  <div className={styles.hero} aria-roledescription="캐러셀" aria-label="토스 겨울 먹거리 기획전" onPointerEnter={e=>{if(e.pointerType==='mouse')setHover(true);}} onPointerLeave={()=>setHover(false)} onFocusCapture={()=>setHover(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setHover(false);}}>
   <a className={styles.bannerLink} href={active.links.home} target="_blank" rel="sponsored nofollow noopener noreferrer" aria-label={`${active.name} 토스에서 보기`} onTouchStart={e=>{swipe.current={x:e.touches[0].clientX,moved:false};}} onTouchEnd={e=>{const delta=e.changedTouches[0].clientX-swipe.current.x;if(Math.abs(delta)>45){swipe.current.moved=true;choose(index+(delta<0?1:-1));}}} onClick={e=>{if(swipe.current.moved){e.preventDefault();swipe.current.moved=false;return;}click();}}>
    <img key={active.id} className={styles.scene} src={art?.art||active.image} alt="" width={2172} height={724} fetchPriority="high"/>
    <div className={`${styles.copy} ${heroStyles.copy}`}><h2>{art?.title||'오늘 만나는\n먹거리 추천'}</h2><p>{active.name}</p><div className={heroStyles.offer}>{Number.isFinite(active.discountRate)&&Number(active.discountRate)>0&&Number(active.discountRate)<=100&&<span>{active.discountRate}%</span>}<strong>{active.price.toLocaleString('ko-KR')}원</strong></div><span className={styles.cta}>토스에서 상품 보기 ↗</span></div>
   </a>
   {list.length>1&&<><div className={styles.categories} aria-label="먹거리 기획전 선택">{list.map((p,i)=><button key={p.id} aria-label={winterTossCampaign(p)?.label||p.name} aria-pressed={active.id===p.id} onClick={()=>choose(i)}>{winterTossCampaign(p)?.label||'먹거리 추천'}<span>›</span></button>)}</div><div className={styles.controls}><button type="button" aria-label="이전 먹거리 기획전" onClick={()=>choose(index-1)}>‹</button><span aria-live="off">{index%list.length+1} / {list.length}</span><button type="button" aria-label="다음 먹거리 기획전" onClick={()=>choose(index+1)}>›</button><button type="button" aria-label={paused?'먹거리 자동 재생 시작':'먹거리 자동 재생 일시정지'} aria-pressed={paused} onClick={()=>setPaused(p=>!p)}>{paused?'▶':'Ⅱ'}</button></div></>}
  </div>
  <p className={styles.disclosure}>[광고] 토스쇼핑 쉐어링크 활동으로, 링크 구매 시 수수료를 지급받습니다. AI 음식 연출 이미지 · 실제 상품 조리 사진이 아닙니다. 할인·가격·구성은 토스에서 확인하세요.</p>
 </section>;
}
