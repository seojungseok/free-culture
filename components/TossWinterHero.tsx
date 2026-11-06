'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import {affiliateTrack} from '@/lib/affiliate-track';
import {freshnessMs} from '@/lib/sharelink-policy.mjs';
import {selectWinterTossHero,winterTossCampaign} from '@/lib/toss-winter-hero.mjs';
import {useTossFeed} from './TossFeedProvider';
import styles from './TossWinterHero.module.css';

export default function TossWinterHero(){
 const {feed,now}=useTossFeed(),page=usePathname()||'/';
 const [clock,setClock]=useState(0),[index,setIndex]=useState(0),[paused,setPaused]=useState(false);
 const [hover,setHover]=useState(false),[visible,setVisible]=useState(false),[reduced,setReduced]=useState(true),[foreground,setForeground]=useState(true);
 const node=useRef<HTMLDivElement>(null),seen=useRef(new Set<string>()),swipe=useRef({x:0,y:0,moved:false});
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
 useEffect(()=>{
  if(!node.current||!active)return;
  const observer=new IntersectionObserver(entries=>setVisible(entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.35)),{threshold:.35});
  observer.observe(node.current);return()=>observer.disconnect();
 },[!!active]);
 useEffect(()=>{
  if(list.length<2||paused||hover||!visible||reduced||!foreground)return;
  const timer=setInterval(()=>setIndex(i=>(i+1)%list.length),8000);
  return()=>clearInterval(timer);
 },[list.length,paused,hover,visible,reduced,foreground]);
 useEffect(()=>{
  if(!active||!visible||!foreground)return;
  const key=page+':'+active.id;
  if(seen.current.has(key))return;
  seen.current.add(key);affiliateTrack('affiliate_impression','toss','home_winter_hero',page,active.id);
 },[active?.id,page,visible,foreground]);
 if(!active)return null;
 const checkedParts=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(feed.checkedAt));
 const checkedPart=(type:string)=>checkedParts.find(part=>part.type===type)?.value||'';
 const checked=`${checkedPart('month')}.${checkedPart('day')} ${checkedPart('hour')}:${checkedPart('minute')} 기준`;
 const choose=(next:number)=>{setPaused(true);setIndex((next+list.length)%list.length);};
 const click=()=>affiliateTrack('affiliate_click','toss','home_winter_hero',page,active.id);
 const label=(product:typeof active)=>product.id===288570013?'삼겹살':winterTossCampaign(product)?.label||'먹거리';
 return <section className={styles.wrap} aria-label="토스쇼핑 겨울 먹거리">
  <div ref={node} className={styles.hero} role="group" aria-roledescription="캐러셀" aria-label="겨울 먹거리 상품"
   onPointerEnter={e=>{if(e.pointerType==='mouse')setHover(true);}} onPointerLeave={()=>setHover(false)}
   onFocusCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node)&&!(e.target as HTMLElement).closest('[data-playback-control]'))setPaused(true);}}>
   <a className={styles.bannerLink} href={active.links.home} target="_blank" rel="sponsored nofollow noopener noreferrer"
    aria-label={`${active.name} · 토스에서 가격·구성 확인 (새 창)`}
    onTouchStart={e=>{setPaused(true);swipe.current={x:e.touches[0].clientX,y:e.touches[0].clientY,moved:false};}}
    onTouchCancel={()=>{swipe.current.moved=false;}}
    onTouchEnd={e=>{const dx=e.changedTouches[0].clientX-swipe.current.x,dy=e.changedTouches[0].clientY-swipe.current.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){swipe.current.moved=true;choose(index+(dx<0?1:-1));}}}
    onClick={e=>{if(swipe.current.moved){e.preventDefault();swipe.current.moved=false;return;}click();}}>
    <img key={active.id} className={styles.scene} src={art?.art||active.image} alt="" width={2172} height={724} loading="lazy" decoding="async"/>
    <div className={styles.copy}>
     <p className={styles.eyebrow}>[광고] 토스쇼핑 · 겨울 먹거리</p>
     <h2>{active.name}</h2>
     <div className={styles.purchase}>
      <img className={styles.productImage} src={active.image} alt={`${active.name} 판매처 상품 사진`} width={72} height={72} loading="lazy" decoding="async"/>
      <div className={styles.purchaseDetails}>
       <span className={styles.priceCaption}>확인 가격 · <time dateTime={feed.checkedAt}>{checked}</time></span>
       <div className={styles.offer}>
        {Number.isFinite(active.discountRate)&&Number(active.discountRate)>0&&Number(active.discountRate)<=100&&<span>{active.discountRate}%</span>}
        <strong>{active.price.toLocaleString('ko-KR')}원</strong>
       </div>
       <span className={styles.cta}>토스에서 가격·구성 확인 <span aria-hidden="true">↗</span></span>
      </div>
     </div>
    </div>
   </a>
   {list.length>1&&<div className={styles.navigation}>
    <div className={styles.categories} aria-label="먹거리 상품 선택">
     {list.map((p,i)=><button key={p.id} type="button" aria-label={`${p.name} 선택`} aria-pressed={active.id===p.id} onClick={()=>choose(i)}>{label(p)}</button>)}
    </div>
    <div className={styles.controls} aria-label="먹거리 상품 넘기기">
     <span className={styles.position} aria-live={paused?'polite':'off'} aria-atomic="true">{index%list.length+1} / {list.length}</span>
     <button type="button" aria-label="이전 먹거리 상품" onClick={()=>choose(index-1)}>‹</button>
     <button type="button" aria-label="다음 먹거리 상품" onClick={()=>choose(index+1)}>›</button>
     {!reduced&&<button type="button" data-playback-control aria-label={paused?'먹거리 자동 재생 시작':'먹거리 자동 재생 일시정지'} aria-pressed={paused} onClick={()=>setPaused(p=>!p)}>{paused?'▶':'Ⅱ'}</button>}
    </div>
   </div>}
  </div>
  <p className={styles.disclosure}>[광고] 토스쇼핑 쉐어링크 활동으로, 링크 구매 시 수수료를 지급받습니다. 배경은 AI 음식 연출이며 실제 상품 조리 사진이 아닙니다. 가격·할인·구성은 토스에서 확인하세요.<span className={styles.desktopHint}> PC에서는 QR코드로 가격을 확인해요.</span></p>
 </section>;
}
