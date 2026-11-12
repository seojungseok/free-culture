'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import {affiliateTrack} from '@/lib/affiliate-track';
import {selectWinterTossHero,winterTossCampaign} from '@/lib/toss-winter-hero.mjs';
import {useTossFeed} from './TossFeedProvider';
import styles from './TossWinterHero.module.css';

export default function TossWinterHero(){
 const {feed,now}=useTossFeed(),page=usePathname()||'/';
 const [clock,setClock]=useState(0),[index,setIndex]=useState(0),[paused,setPaused]=useState(false);
 const [hover,setHover]=useState(false),[visible,setVisible]=useState(false),[reduced,setReduced]=useState(true),[foreground,setForeground]=useState(true),[compact,setCompact]=useState(true);
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
  const deadline=Math.min(...list.map(p=>p.freshUntil),...list.filter(p=>p.endAt).map(p=>Date.parse(p.endAt!)));
  const timer=setTimeout(()=>setClock(Date.now()),Math.min(Math.max(0,deadline-Date.now()+5),2147483647));
  return()=>clearTimeout(timer);
 },[feed.checkedAt,list]);
 useEffect(()=>{
  if(!node.current||!active)return;
  const observer=new IntersectionObserver(entries=>setVisible(entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.35)),{threshold:.35});
  observer.observe(node.current);return()=>observer.disconnect();
 },[!!active]);
 useEffect(()=>{
  if(!node.current)return;
  const element=node.current,measure=()=>setCompact(element.getBoundingClientRect().width<440);
  measure();
  if(typeof ResizeObserver==='undefined'){window.addEventListener('resize',measure);return()=>window.removeEventListener('resize',measure);}
  const observer=new ResizeObserver(measure);observer.observe(element);return()=>observer.disconnect();
 },[!!active]);
 useEffect(()=>{
  if(list.length<2||paused||hover||!visible||reduced||!foreground||compact)return;
  const timer=setInterval(()=>setIndex(i=>(i+1)%list.length),8000);
  return()=>clearInterval(timer);
 },[list.length,paused,hover,visible,reduced,foreground,compact]);
 useEffect(()=>{
  if(!active||!visible||!foreground)return;
  const key=page+':'+active.id;
  if(seen.current.has(key))return;
  seen.current.add(key);affiliateTrack('affiliate_impression','toss','home_winter_hero',page,active.id);
 },[active?.id,page,visible,foreground]);
 if(!active)return null;
 const checkedAt=active.verifiedAt||feed.checkedAt;
 const checkedParts=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(checkedAt));
 const checkedPart=(type:string)=>checkedParts.find(part=>part.type===type)?.value||'';
 const checked=`${checkedPart('month')}.${checkedPart('day')} ${checkedPart('hour')}:${checkedPart('minute')} 기준`;
 const choose=(next:number)=>{setPaused(true);setIndex((next+list.length)%list.length);};
 const click=()=>affiliateTrack('affiliate_click','toss','home_winter_hero',page,active.id);
 return <section className={styles.wrap} aria-label="토스쇼핑 겨울 먹거리">
  <div ref={node} className={styles.hero} role="group" aria-roledescription="캐러셀" aria-label="겨울 먹거리 상품"
   onPointerEnter={e=>{if(e.pointerType==='mouse')setHover(true);}} onPointerLeave={()=>setHover(false)}
   onFocusCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node)&&!(e.target as HTMLElement).closest('[data-playback-control]'))setPaused(true);}}>
   <a className={styles.bannerLink} href={active.links.home} target="_blank" rel="sponsored nofollow noopener noreferrer"
    aria-label={`${active.name} · 지금 구매하기 (새 창)`}
    onTouchStart={e=>{setPaused(true);swipe.current={x:e.touches[0].clientX,y:e.touches[0].clientY,moved:false};}}
    onTouchCancel={()=>{swipe.current.moved=false;}}
    onTouchEnd={e=>{const dx=e.changedTouches[0].clientX-swipe.current.x,dy=e.changedTouches[0].clientY-swipe.current.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){swipe.current.moved=true;choose(index+(dx<0?1:-1));}}}
    onClick={e=>{if(swipe.current.moved){e.preventDefault();swipe.current.moved=false;return;}click();}}>
    <div className={styles.visual}><img key={active.id} className={styles.scene} src={art?.art||active.image} alt={art?.art?`${art.label} 조리·상차림 예시 · AI 연출 이미지`:`${active.name} 상품 사진`} width={1800} height={600} loading="lazy" decoding="async"/></div>
    <div className={styles.copy}>
     <div className={styles.intro}><p className={styles.eyebrow}>[광고]<span className={styles.eyebrowDetail}> 토스쇼핑 · 겨울 먹거리</span></p><h2>{art?.title.replace(/\n/g,' ')||'겨울 식탁을 따뜻하게'}</h2><p className={styles.productName} title={active.name}>{art?.productPrefix}{active.name}</p></div>
     <div className={styles.purchase}>
      <div className={styles.purchaseDetails}>
       <div className={styles.offer}>
        {Number.isFinite(active.discountRate)&&Number(active.discountRate)>0&&Number(active.discountRate)<=100&&<span>{active.discountRate}%</span>}
        <strong>{active.price.toLocaleString('ko-KR')}원</strong>
       </div>
       <span className={styles.priceCaption}>{active.priceLabel&&<>{active.priceLabel} · </>}<time dateTime={checkedAt}>{checked}</time></span>
      </div>
      <span className={styles.cta}>지금 구매하기 <span aria-hidden="true">↗</span></span>
     </div>
    </div>
   </a>
   {list.length>1&&<div className={styles.navigation}>
    <div className={styles.controls} aria-label="먹거리 상품 넘기기">
     <span className={styles.position} aria-live={paused?'polite':'off'} aria-atomic="true">{index%list.length+1} / {list.length}</span>
     <button type="button" aria-label="이전 먹거리 상품" onClick={()=>choose(index-1)}>‹</button>
     <button type="button" aria-label="다음 먹거리 상품" onClick={()=>choose(index+1)}>›</button>
     {!reduced&&!compact&&<button type="button" data-playback-control aria-label={paused?'먹거리 자동 재생 시작':'먹거리 자동 재생 일시정지'} aria-pressed={paused} onClick={()=>setPaused(p=>!p)}>{paused?'▶':'Ⅱ'}</button>}
    </div>
   </div>}
  </div>
  <p className={styles.disclosure}>[광고] 구매 시 수수료 지급 · AI 음식 연출 · 실제 상품·가격·할인율·구성은 구매 화면 기준</p>
 </section>;
}
