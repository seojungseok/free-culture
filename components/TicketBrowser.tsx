"use client";
import {useState} from 'react';
import Link from 'next/link';
import type {TicketArticle} from '@/lib/tickets';

export default function TicketBrowser({articles}:{articles:Pick<TicketArticle,'slug'|'title'|'description'|'area'|'theme'|'thumbnail'>[]}) {
  const [area,setArea]=useState('전체');const [theme,setTheme]=useState('전체');
  const visible=articles.filter(a=>(area==='전체'||a.area===area)&&(theme==='전체'||a.theme===theme));
  return <>
    <div className="flex flex-wrap gap-3 rounded-2xl border border-line bg-white p-4">
      <label className="flex items-center gap-2 text-sm font-bold">지역<select value={area} onChange={e=>setArea(e.target.value)} className="rounded-lg border border-line bg-white px-3 py-2">{['전체',...new Set(articles.map(a=>a.area))].map(v=><option key={v}>{v}</option>)}</select></label>
      <label className="flex items-center gap-2 text-sm font-bold">테마<select value={theme} onChange={e=>setTheme(e.target.value)} className="rounded-lg border border-line bg-white px-3 py-2">{['전체',...new Set(articles.map(a=>a.theme))].map(v=><option key={v}>{v}</option>)}</select></label>
    </div>
    <p className="my-5 text-sm text-ink-soft" aria-live="polite">{visible.length}곳의 입장권·체험 안내</p>
    {visible.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{visible.map(a=><Link key={a.slug} href={`/tickets/${a.slug}`} className="overflow-hidden rounded-2xl border border-line bg-white transition hover:border-free">
      {/* One stored JPEG shared by card, hero and OG; preserve the entire original. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={a.thumbnail.url} alt={a.thumbnail.alt} width={a.thumbnail.width} height={a.thumbnail.height} className="block h-auto w-full object-contain" loading="lazy" />
      <div className="p-5"><p className="text-xs font-bold text-free">{a.area} · {a.theme}</p><h2 className="mt-2 text-xl font-black leading-snug">{a.title}</h2><p className="mt-3 text-sm leading-6 text-ink-soft">{a.description}</p><span className="mt-4 block text-sm font-bold text-free">방문 정보 살펴보기 →</span></div>
    </Link>)}</div>:<div className="rounded-2xl bg-[#f4f7f3] px-5 py-12 text-center"><h2 className="text-xl font-bold">{articles.length?'다른 지역이나 테마를 골라보세요':'방문 정보를 꼼꼼히 준비하고 있어요'}</h2><p className="mt-3 text-sm leading-6 text-ink-soft">{articles.length?'선택한 조건에 맞는 장소가 아직 없습니다.':'확인이 끝난 장소부터 차례로 소개할게요. 그동안 가까운 나들이 장소를 둘러보세요.'}</p><Link href="/places" className="mt-5 inline-block rounded-full bg-free px-5 py-3 text-sm font-bold text-white">나들이 장소 찾기</Link></div>}
  </>;
}
