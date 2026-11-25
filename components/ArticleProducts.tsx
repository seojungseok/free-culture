'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useTossFeed} from './TossFeedProvider';
import {selectArticleProducts} from '@/lib/article-products.mjs';
import {affiliateTrack} from '@/lib/affiliate-track';
import {freshnessMs} from '@/lib/sharelink-policy.mjs';
import styles from './TossTopDeals.module.css';

export default function ArticleProducts(){
 const page=usePathname()||'/',{feed,now}=useTossFeed();
 const [title,setTitle]=useState(''),[expiry,setExpiry]=useState(0);
 const section=useRef<HTMLElement>(null),seen=useRef(new Set<string>());
 const time=Math.max(now,expiry);
 const cards=useMemo(()=>selectArticleProducts(feed,time,page,title),[feed,time,page,title]);
 useEffect(()=>setTitle(document.querySelector('h1')?.textContent||''),[page]);
 useEffect(()=>{
  if(!cards.some(p=>!p.guide))return;
  const end=Math.min(Date.parse(feed.checkedAt)+freshnessMs,...cards.map(p=>p.endAt?Date.parse(p.endAt):Infinity));
  if(!Number.isFinite(end))return;
  const timer=setTimeout(()=>setExpiry(Date.now()),Math.max(0,end-Date.now()+1));return()=>clearTimeout(timer);
 },[cards,feed.checkedAt]);
 useEffect(()=>{
  if(!section.current)return;
  const observer=new IntersectionObserver(entries=>{for(const e of entries){
   const id=Number((e.target as HTMLElement).dataset.product),key=page+'|'+id;
   if(e.intersectionRatio>=.5&&!seen.current.has(key)){seen.current.add(key);affiliateTrack('affiliate_impression','toss','article',page,id);}
  }},{threshold:.5});
  section.current.querySelectorAll('[data-product]').forEach(el=>observer.observe(el));return()=>observer.disconnect();
 },[cards,page]);
 if(!cards.length)return <aside className={styles.wrap}><Link href="/shopping/winter-snacks" prefetch={false}>겨울 먹거리 고르는 법 보기 →</Link></aside>;
 const priced=cards.every(p=>p.price!==null);
 return <section ref={section} className={styles.articleOffer} data-article-products="" data-nosnippet="" aria-label="토스쇼핑 제휴 상품">
  <div className={styles.heading}><h2>{priced?'3만 원 미만으로 고르는 상품':'토스쇼핑 먹거리 추천'}</h2><span className={styles.count}>광고 · 토스쇼핑</span></div>
  <p className={styles.disclosure}>제휴 링크로 구매하면 수수료를 받습니다. {priced?'배송비와 옵션은 토스에서 확인하세요.':'현재 가격과 판매 여부는 토스에서 확인하세요.'}</p>
  <div className={styles.articleGrid}>{cards.map(p=><a className={styles.articleCard} key={p.id} data-product={p.id} href={p.href} rel="sponsored noopener noreferrer" onClick={event=>{
   if(!p.guide&&!selectArticleProducts(feed,Date.now(),page,title).some(current=>current.id===p.id&&current.href===p.href&&!current.guide)){event.preventDefault();setExpiry(Date.now());return;}
   affiliateTrack('affiliate_click','toss','article',page,p.id);
  }}><img width={96} height={82} src={p.image} alt={p.guide?'AI 음식 연출 이미지':''} loading="lazy"/><div><b>{p.name}</b>{p.price!==null&&<strong>{p.discount&&<small>{p.discount}% 할인 · </small>}{p.price.toLocaleString('ko-KR')}원</strong>}<span>토스에서 가격 보기 →</span></div></a>)}</div>
 </section>;
}
