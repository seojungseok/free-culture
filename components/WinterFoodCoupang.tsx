"use client";
import {useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import {affiliateTrack} from '@/lib/affiliate-track';
import styles from './WinterFoodCoupang.module.css';
export type Food={id:string;name:string;image:string;url:string;checkedAt:string;art:string};
const disclosure='[광고] 쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 제공받습니다.';
export const productImage=(id:string)=>`/api/affiliate/coupang-image/${encodeURIComponent(id)}`;
export function approved(food:Food,now:number){
 if(!food||typeof food.id!=='string'||typeof food.name!=='string')return false;
 const checked=Date.parse(food.checkedAt);
 try{const link=new URL(food.url);return Number.isFinite(checked)&&checked<=now&&now-checked<7*86400000&&link.protocol==='https:'&&['link.coupang.com','coupa.ng'].includes(link.hostname)&&/^\d{1,20}$/.test(food.id)&&food.image===productImage(food.id)&&!!food.name;}catch{return false;}
}
function creative(food:Food){
 if(/어묵/.test(food.name))return {label:'어묵전골',title:'찬바람 불면,\n뜨끈한 어묵 한 냄비',image:'/affiliate-images/coupang-winter-fishcake-20261030-v2.webp'};
 if(/부대찌개/.test(food.name))return {label:'부대찌개',title:'쌀쌀한 저녁,\n얼큰한 한 냄비로',image:'/affiliate-images/coupang-winter-budae-20261030-v2.webp'};
 if(/만두/.test(food.name))return {label:'떡만둣국',title:'뜨끈한 국물에,\n든든함을 더해요',image:'/affiliate-images/coupang-winter-mandu-20261030-v2.webp'};
 if(/호빵/.test(food.name))return {label:'호빵',title:'찬바람 부는 날,\n포근한 호빵 한 입',image:'/affiliate-images/coupang-winter-hoppang-20261030-v1.webp'};
 if(/붕어빵/.test(food.name))return {label:'붕어빵',title:'집에서도 즐기는\n따뜻한 겨울 간식',image:'/affiliate-images/coupang-winter-bungeoppang-20261030-v1.webp'};
 return {label:'겨울 한 끼',title:'이번 주말,\n따뜻한 한 끼를 준비해요',image:'/affiliate-images/winter-weekend-scene-20261030.webp'};
}
export default function WinterFoodCoupang({slot}:{slot:'top'|'article'|'rail'}){
 const [products,setProducts]=useState<Food[]>([]),[now,setNow]=useState(0),[index,setIndex]=useState(0),[paused,setPaused]=useState(false),[hover,setHover]=useState(false),[visible,setVisible]=useState(false),[reduced,setReduced]=useState(true),[foreground,setForeground]=useState(true);
 const node=useRef<HTMLElement>(null),rail=useRef<HTMLDivElement>(null),seen=useRef(new Set<string>()),swipe=useRef({x:0,moved:false});
 const page=usePathname()||'/';
 useEffect(()=>{
  const controller=new AbortController(),tick=()=>setNow(Date.now()),motion=matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(motion.matches),visibility=()=>setForeground(!document.hidden);
  tick();change();visibility();motion.addEventListener('change',change);document.addEventListener('visibilitychange',visibility);const clock=setInterval(tick,60000);
  fetch('/api/affiliate/coupang-food',{cache:'no-store',signal:controller.signal}).then(r=>r.ok?r.json():null).then(feed=>{if(Array.isArray(feed?.products))setProducts(feed.products);}).catch(()=>{});
  return()=>{controller.abort();clearInterval(clock);motion.removeEventListener('change',change);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 const list=products.filter(p=>now>0&&approved(p,now));
 // Each page keeps a stable recommendation; only the home hero rotates.
 const fixedIndex=Array.from(page).reduce((hash,char)=>(hash*31+char.charCodeAt(0))>>>0,0);
 const active=list[(slot==='article'?fixedIndex:index)%list.length];
 useEffect(()=>{if(!node.current||!active)return;const observer=new IntersectionObserver(entries=>setVisible(entries.some(e=>e.isIntersecting)),{threshold:.35});observer.observe(node.current);return()=>observer.disconnect();},[!!active]);
 useEffect(()=>{if(slot!=='top'||list.length<2||paused||hover||!visible||reduced||!foreground)return;const timer=setInterval(()=>setIndex(i=>(i+1)%list.length),5000);return()=>clearInterval(timer);},[slot,list.length,index,paused,hover,visible,reduced,foreground]);
 useEffect(()=>{if(slot==='rail'||!active||!visible)return;const key=page+':'+active.id;if(!seen.current.has(key)){seen.current.add(key);affiliateTrack('affiliate_impression','coupang',slot,page,Number(active.id));}},[active?.id,page,slot,visible]);
 useEffect(()=>{if(slot!=='rail'||!rail.current)return;const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;const id=(entry.target as HTMLElement).dataset.product!,key=page+':'+id;if(!seen.current.has(key)){seen.current.add(key);affiliateTrack('affiliate_impression','coupang','home_rail',page,Number(id));}}},{threshold:.5});for(const card of rail.current.children)observer.observe(card);return()=>observer.disconnect();},[slot,list.length,page]);
 const click=(food:Food)=>affiliateTrack('affiliate_click','coupang',slot,page,Number(food.id));
 const choose=(next:number)=>setIndex((next+list.length)%list.length);
 if(!active)return null;const art=creative(active);
 if(slot==='rail')return <section className={styles.shopping} aria-label="쿠팡 여행 준비 먹거리"><div className={styles.railHeading}><h2>여행 준비 먹거리</h2><div><button aria-label="이전 먹거리 상품" onClick={()=>rail.current?.scrollBy({left:-rail.current.clientWidth,behavior:reduced?'instant':'smooth'})}>‹</button><button aria-label="다음 먹거리 상품" onClick={()=>rail.current?.scrollBy({left:rail.current.clientWidth,behavior:reduced?'instant':'smooth'})}>›</button></div></div><p className={styles.disclosure}>{disclosure}</p><div ref={rail} className={styles.rail} aria-label="쿠팡 먹거리 좌우 목록">{list.map(food=><a key={food.id} data-product={food.id} className={styles.card} href={food.url} target="_blank" rel="sponsored nofollow noopener noreferrer" onClick={()=>click(food)}><img src={productImage(food.id)} alt={food.name} width={240} height={180} loading="lazy"/><h3>{food.name}</h3><span>쿠팡에서 보기 ↗</span></a>)}</div></section>;
 return <section ref={node} className={`${styles.wrap} ${slot==='article'?styles.compact:''}`} aria-label="쿠팡 먹거리 기획전"><div className={styles.hero} aria-roledescription={slot==='top'?'캐러셀':undefined} aria-label={slot==='article'?'겨울 별미 추천':'겨울 캠핑 먹거리'} onPointerEnter={e=>{if(e.pointerType==='mouse')setHover(true);}} onPointerLeave={()=>setHover(false)} onFocusCapture={()=>setHover(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setHover(false);}}>
  <a className={styles.bannerLink} href={active.url} target="_blank" rel="sponsored nofollow noopener noreferrer" aria-label={`${active.name} 쿠팡에서 보기`} onTouchStart={e=>{swipe.current={x:e.touches[0].clientX,moved:false};}} onTouchEnd={e=>{const delta=e.changedTouches[0].clientX-swipe.current.x;if(slot==='top'&&Math.abs(delta)>45){swipe.current.moved=true;choose(index+(delta<0?1:-1));}}} onClick={e=>{if(swipe.current.moved){e.preventDefault();swipe.current.moved=false;return;}click(active);}}>
   <img key={active.id} className={`${styles.scene} ${slot==='top'?styles.motion:''}`} style={slot==='top'?{animationPlayState:paused||hover||!visible||reduced||!foreground?'paused':'running'}:undefined} src={art.image} alt="" width={2100} height={700} fetchPriority={slot==='top'?'high':'auto'} loading={slot==='top'?'eager':'lazy'}/><div className={styles.copy}><span className={styles.badge}>쿠팡 · 겨울 별미</span><h2>{art.title}</h2><p>{active.name}</p><span className={styles.cta}>쿠팡에서 상품 보기 ↗</span></div>
  </a>{slot==='top'&&<><div className={styles.categories} aria-label="먹거리 기획전 선택">{list.map((food,i)=><button key={food.id} aria-label={creative(food).label} aria-pressed={active.id===food.id} onClick={()=>choose(i)}>{creative(food).label}<span>›</span></button>)}</div><div className={styles.controls}><button aria-label="이전 먹거리 기획전" onClick={()=>choose(index-1)}>‹</button><span aria-live="off">{index%list.length+1} / {list.length}</span><button aria-label="다음 먹거리 기획전" onClick={()=>choose(index+1)}>›</button><button aria-label={paused?'먹거리 자동 재생 시작':'먹거리 자동 재생 일시정지'} aria-pressed={paused} onClick={()=>setPaused(p=>!p)}>{paused?'▶':'Ⅱ'}</button></div></>}
 </div><p className={styles.disclosure}>{disclosure}</p></section>;
}
