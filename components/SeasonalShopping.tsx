'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import catalogue from '@/data/seasonal-shopping.json';
import {selectSeasonalProducts} from '@/lib/seasonal-shopping.mjs';
import {affiliateTrack} from '@/lib/affiliate-track';
import {useTossFeed} from './TossFeedProvider';
import type {TossFeed} from '@/lib/sharelink';
import styles from './SeasonalShopping.module.css';

type Collection=typeof catalogue.collections[number];
export default function SeasonalShopping({collection,initialFeed,initialTime}:{collection:Collection;initialFeed:TossFeed;initialTime:number}){
 const {feed,now,loading}=useTossFeed();
 const [clock,setClock]=useState(0),[filter,setFilter]=useState('전체'),[sort,setSort]=useState('추천순');
 const time=Math.max(now,clock,initialTime),page='/shopping/'+collection.slug;
 // A retained root layout may have an older feed after client navigation.
 const feedTime=Date.parse(feed.checkedAt),initialFeedTime=Date.parse(initialFeed.checkedAt);
 const currentFeed=Number.isFinite(feedTime)&&(!Number.isFinite(initialFeedTime)||feedTime>initialFeedTime)?feed:initialFeed;
 const products=useMemo(()=>selectSeasonalProducts(currentFeed,collection,catalogue.reviewedProducts,time),[currentFeed,collection,time]);
 useEffect(()=>{
  if(!products.length)return;
  const timer=setTimeout(()=>setClock(Date.now()),Math.min(Math.max(0,Math.min(...products.map(p=>p.expiresAt))-Date.now()+5),2147483647));
  return()=>clearTimeout(timer);
 },[products]);
 const labels=['전체',...new Set(products.map(p=>p.label))];
 const visible=products.filter(p=>filter==='전체'||p.label===filter).sort((a,b)=>sort==='낮은 가격순'?a.price-b.price:0);
 const stamp=(value:string)=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value));
 return <>
  <section className={styles.products} aria-label="모음 상품">
   <div className={styles.toolbar}>
    <div className={styles.filters} aria-label="상품 종류">{labels.map(label=><button key={label} type="button" aria-pressed={filter===label} onClick={()=>setFilter(label)}>{label}</button>)}</div>
    <label className={styles.sort}>정렬 <select value={sort} onChange={e=>setSort(e.target.value)}><option>추천순</option><option>낮은 가격순</option></select></label>
   </div>
   <p className={styles.count}>{products.length?<>3만 원 미만 · {visible.length}개 상품</>:loading?'상품을 불러오고 있어요.':'현재 확인할 수 있는 상품이 없습니다. 다른 모음도 살펴보세요.'}</p>
   <div className={styles.grid}>
    {visible.map(p=><article key={p.id} id={'product-'+p.id} className={styles.product}>
     <a href={p.links.home} target="_blank" rel="sponsored nofollow noopener noreferrer" aria-label={p.name+' · 구매하러가기 (새 창)'} onClick={()=>affiliateTrack('affiliate_click','toss','seasonal_product_list',page,p.id)}>
      <div className={styles.productImage}><img src={p.image} alt={p.name} width={400} height={400} loading="lazy" decoding="async"/></div>
      <div className={styles.productCopy}><span className={styles.kind}>{p.label} · 토스쇼핑</span><h2>{p.name}</h2><div className={styles.price}>{Number.isFinite(p.discountRate)&&Number(p.discountRate)>0&&Number(p.discountRate)<=100&&<span>{p.discountRate}%</span>}<strong>{p.price.toLocaleString('ko-KR')}원</strong></div><time dateTime={p.checkedAt}>{stamp(p.checkedAt)} 확인</time><span className={styles.buy}>구매하러가기 <span aria-hidden="true">↗</span></span></div>
     </a>
    </article>)}
   </div>
  </section>
  <aside className={styles.guide}><h2>고르기 전에 살펴보세요</h2><p>{collection.intro}</p><ul>{collection.tips.map(tip=><li key={tip}>{tip}</li>)}</ul></aside>
  <section className={styles.related}><h2>이 모음도 둘러보세요</h2><div>{catalogue.collections.filter(c=>c.slug!==collection.slug).map(c=><Link key={c.slug} href={'/shopping/'+c.slug} prefetch={false}><img src={'/affiliate-images/seasonal-'+c.banner+'-mobile-20261113.webp'} alt="" width={960} height={320} loading="lazy"/><span>{c.title}</span></Link>)}</div></section>
 </>;
}
