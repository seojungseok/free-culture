import type {Metadata} from 'next';
import Link from 'next/link';
import {Suspense} from 'react';
import TicketBrowser from '@/components/TicketBrowser';
import {getTickets} from '@/lib/tickets';
export const revalidate=3600;
export function generateMetadata():Metadata{return {title:'입장권·체험 — 주말 나들이 방문 가이드',description:'테마파크부터 체험 공간까지, 지역별 방문 정보와 이용권 선택 기준을 확인하세요.',alternates:{canonical:'/tickets'},robots:getTickets().length?{index:true,follow:true}:{index:false,follow:true}};}
export default function TicketsPage(){
  const articles=getTickets().map(({slug,placeName,listTitle,area,theme,thumbnail})=>({slug,placeName,listTitle,area,theme,thumbnail}));
  return <main className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8"><Link href="/" className="text-sm text-ink-soft">홈</Link><p className="mt-4 text-sm font-bold text-free">이번 주말, 새로운 경험</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">입장권·체험</h1><p className="mb-4 mt-3 max-w-2xl text-base leading-7 text-ink-soft">어떤 곳인지 먼저 살펴보고, 나에게 맞는 이용권을 골라보세요.</p><Suspense fallback={<p>목록을 불러오고 있어요.</p>}><TicketBrowser articles={articles}/></Suspense><nav className="mt-10 flex gap-5 text-sm font-bold text-free" aria-label="함께 둘러보기"><Link href="/season">가을나들이</Link><Link href="/course">여행코스</Link><Link href="/food">맛집탐방</Link></nav></main>;
}
