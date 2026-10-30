"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { affiliateTrack } from "@/lib/affiliate-track";

export type Food = { id: string; name: string; image: string; url: string; checkedAt: string; art: "seafood" | "rice" | "fishcake" };
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const artwork = { seafood: "/affiliate-images/winter-food-seafood-draft-20261030.webp", rice: "/affiliate-images/winter-food-rice-draft-20261030.webp", fishcake: "/affiliate-images/winter-food-fishcake-20261030.webp" };
export const productImage = (id:string)=>`/api/affiliate/coupang-image/${encodeURIComponent(id)}`;

export function approved(food: Food, now: number) {
  const checked = Date.parse(food.checkedAt);
  try {
    const link = new URL(food.url);
    return Number.isFinite(checked) && checked <= now && now - checked < MAX_AGE &&
      link.protocol === "https:" && ["link.coupang.com", "coupa.ng"].includes(link.hostname) &&
      /^\d{1,20}$/.test(food.id) && food.image === productImage(food.id) && !!food.name && !!artwork[food.art];
  } catch { return false; }
}

export default function WinterFoodCoupang({ slot }: { slot: "top" | "article" }) {
  const [products, setProducts] = useState<Food[]>([]);
  const [now, setNow] = useState(0);
  const node=useRef<HTMLElement>(null), seen=useRef(new Set<string>());
  const page=usePathname()||'/';
  useEffect(() => {
    const controller = new AbortController();
    setNow(Date.now());
    fetch('/api/affiliate/coupang-food', { cache: 'no-store', signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then(feed => { if (Array.isArray(feed?.products)) setProducts(feed.products); })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const list = products.filter((item) => now > 0 && approved(item, now));
  const first=list[0];
  useEffect(()=>{
    if(!first||!node.current)return;
    const observer=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return;const key=page+':'+first.id;if(!seen.current.has(key)){seen.current.add(key);affiliateTrack('affiliate_impression','coupang',slot,page,Number(first.id));}},{threshold:0.5});
    observer.observe(node.current);return()=>observer.disconnect();
  },[first?.id,page,slot]);
  if (!list.length) return null;
  return <section ref={node} aria-label="겨울 캠핑 먹거리 광고" className="mx-auto w-full max-w-[1120px] px-4 pt-4 sm:px-6 lg:px-8">
    <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white">
      <img src={artwork[first.art]} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#071728]/95 via-[#102033]/80 to-[#102033]/25" />
      <div className="relative grid min-h-[220px] grid-cols-[1fr_110px] items-center gap-4 p-5 sm:min-h-[250px] sm:grid-cols-[1fr_160px] sm:p-8">
        <div><span className="inline-block rounded-full bg-amber-200 px-3 py-1 text-xs font-black text-slate-900">겨울 캠핑 먹거리</span><h2 className="mt-3 text-xl font-black leading-tight sm:text-3xl">추운 날, 따뜻한 한 끼</h2><p className="mt-2 max-w-lg text-sm leading-6 text-white/90">{first.name}</p><a href={first.url} target="_blank" rel="sponsored nofollow noopener noreferrer" onClick={()=>affiliateTrack('affiliate_click','coupang',slot,page,Number(first.id))} className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-white px-4 text-sm font-extrabold text-slate-900">쿠팡에서 상품 보기 ↗</a></div>
        <a href={first.url} target="_blank" rel="sponsored nofollow noopener noreferrer" onClick={()=>affiliateTrack('affiliate_click','coupang',slot,page,Number(first.id))} aria-label={`${first.name} 상품 보기`} className="rounded-xl bg-white p-2"><img src={productImage(first.id)} alt={first.name} className="aspect-square w-full object-contain" /></a>
      </div>
    </div>
    <p className="mt-2 text-[11px] leading-5 text-slate-500">[광고] 쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 제공받습니다. 배경은 AI 연출이며 실제 상품의 조리 사진이 아닙니다. 상품 구성과 가격은 판매 페이지에서 확인해 주세요.</p>
    {slot === 'top' && list.length > 1 && <div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-2">{list.slice(1, 5).map((item) => <a key={item.id} href={item.url} target="_blank" rel="sponsored nofollow noopener noreferrer" onClick={()=>affiliateTrack('affiliate_click','coupang','top',page,Number(item.id))} className="flex w-[230px] shrink-0 snap-start items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 text-sm font-bold text-slate-800"><img src={productImage(item.id)} alt="" loading="lazy" className="h-16 w-16 rounded-lg object-contain" /><span className="line-clamp-2">{item.name} ↗</span></a>)}</div>}
  </section>;
}
