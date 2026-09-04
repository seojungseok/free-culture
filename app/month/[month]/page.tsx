import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Band } from "@/components/Band";
import TraditionalMarketCallout from "@/components/TraditionalMarketCallout";
import DateBrowser from "@/components/DateBrowser";
import PosterCard from "@/components/PosterCard";
import { getAllEvents, slimForClient } from "@/lib/data";
import { monthRangeYmd } from "@/lib/dates";
import { getChuseokEvents } from "@/lib/chuseok";
import festivalsData from "@/data/festivals.json";
import type { CultureEvent } from "@/lib/types";

export const revalidate = 86400;

const MONTH_NAMES = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const MONTH_THEMES = ["겨울 실내 나들이", "설날·겨울 행사", "봄꽃·문화행사", "벚꽃·축제", "가정의 달 행사", "초여름 나들이", "여름방학·축제", "휴가철 문화행사", "추석·가을 축제", "단풍·가을 행사", "늦가을 전시·공연", "겨울 축제·연말 행사"];

export function generateStaticParams() {
  return MONTH_NAMES.map((_, i) => ({ month: String(i + 1) }));
}

export async function generateMetadata({ params }: { params: Promise<{ month: string }> }): Promise<Metadata> {
  const { month } = await params;
  const n = Math.min(12, Math.max(1, Number(month) || 9));
  return {
    title: `${n}월에 뭐하지? · ${MONTH_THEMES[n - 1]} 전국 행사·축제`,
    description: `${n}월에 가볼 만한 전국 문화행사와 축제, 추석 행사와 지역별 나들이를 날짜·지역·가격 필터로 찾아보세요.`,
    keywords: [`${n}월에 뭐하지`, `${n}월 가볼만한곳`, `${n}월 행사`, `${n}월 축제`, "전국 문화행사", "주말 나들이"],
    alternates: { canonical: `/month/${n}` },
  };
}

type Festival = { id: string; title: string; addr: string; area: string; image?: string; startDate: string; endDate: string };
const FESTIVALS = ((festivalsData as unknown as { festivals?: Festival[] }).festivals || []);

export default async function MonthlyPage({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  const n = Math.min(12, Math.max(1, Number(month) || 9));
  const year = 2026;
  const range = monthRangeYmd(year, n - 1);
  const events = getAllEvents()
    .filter((event) => event.startDate <= range.end && event.endDate >= range.start)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const festivals = FESTIVALS.filter((festival) => festival.startDate <= range.end && festival.endDate >= range.start);
  const chuseok = n === 9 ? getChuseokEvents() : [];
  const themeClass = n === 9 ? "bg-[#fff8e9] border-[#ead8b8]" : n >= 3 && n <= 5 ? "bg-[#fff8f4] border-[#f0d8cf]" : n >= 6 && n <= 8 ? "bg-[#f2fbff] border-[#cfe7ef]" : "bg-[#f7f8fb] border-[#dfe3ec]";

  return <>
    <Band tone="panel" innerClassName="py-6 sm:py-8">
      <h1 className="text-[25px] font-black tracking-tight text-ink sm:text-[34px]">{n}월에 뭐하지?</h1>
      <p className="mt-2 max-w-3xl text-[14px] leading-6 text-ink-soft">{n}월 {MONTH_THEMES[n - 1]}를 기준으로 전국 문화행사와 축제를 모았습니다. 날짜·지역·분야·가격 필터로 이번 달에 실제로 갈 곳을 골라보세요.</p>
    </Band>
    <main className="mx-auto w-full max-w-[1180px] px-5 pb-12 sm:px-6 lg:px-8">
      <TraditionalMarketCallout enabled={n === 9} />
      <section className={`mt-6 rounded-2xl border p-5 sm:p-6 ${themeClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[12px] font-black text-free">MONTHLY PICK · {n}월</p><h2 className="mt-1 text-[20px] font-black text-ink">{MONTH_THEMES[n - 1]}</h2></div><Link href="/events?period=month" className="rounded-full bg-ink px-4 py-2 text-[12px] font-bold text-white">이번 달 행사 전체보기</Link></div>
        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">{MONTH_NAMES.map((label, i) => <Link key={label} href={`/month/${i + 1}`} className={["flex min-h-9 items-center justify-center rounded-lg bg-white/80 px-1 text-[12px] font-bold text-ink-soft hover:bg-white hover:text-ink", i + 1 === n ? "ring-2 ring-[#b86f32]" : ""].join(" ")}>{label}</Link>)}</div>
      </section>
      {n === 9 && <section className="mt-5 rounded-2xl border border-[#ead8b8] bg-[#fffdf8] p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[12px] font-black text-[#9c5b24]">추석 특별관</p><h2 className="mt-1 text-[20px] font-black text-ink">추석 연휴·9월 축제 함께 보기</h2><p className="mt-1 text-[13px] text-ink-soft">공식 일정이 확인된 추석 행사는 별도 카드로 안내하고, 9월 전국 행사는 아래 필터에서 지역과 분야를 다시 고를 수 있습니다.</p></div><Link href="/chuseok" className="rounded-full bg-[#9c5b24] px-4 py-2 text-[12px] font-bold text-white">추석 행사 필터</Link></div>{chuseok.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2">{chuseok.map((event) => <div key={event.id} className="rounded-xl bg-white p-4 ring-1 ring-[#ead8b8]"><h3 className="text-[14px] font-extrabold text-ink">{event.title}</h3><p className="mt-1 text-[12px] text-ink-soft">{event.area} · {event.place} · 09월 25일~09월 27일</p><a href={event.officialUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[12px] font-bold text-free">공식 안내 확인 ↗</a></div>)}</div>}</section>}
      {festivals.length > 0 && <section className="mt-5"><div className="mb-3 flex items-center justify-between"><h2 className="text-[20px] font-black text-ink">{n}월 전국 축제</h2><Link href="/events?genre=festival&period=month" className="text-[13px] font-bold text-ink-soft">축제 필터 ›</Link></div><div className="grid gap-3 sm:grid-cols-2">{festivals.map((festival) => <article key={festival.id} className="rounded-xl border border-line bg-white p-4"><h3 className="text-[14px] font-extrabold text-ink">{festival.title}</h3><p className="mt-1 text-[12px] text-ink-soft">{festival.area} · {festival.addr}</p><p className="mt-1 text-[12px] text-ink-faint">{festival.startDate.slice(4, 6)}월 {festival.startDate.slice(6)}일 ~ {festival.endDate.slice(4, 6)}월 {festival.endDate.slice(6)}일</p><Link href="/events?genre=festival&period=month" className="mt-2 inline-block text-[12px] font-bold text-free">관련 축제 더 보기 →</Link></article>)}</div></section>}
      <section className="mt-6"><h2 className="mb-1 text-[20px] font-black text-ink">{n}월 문화행사 필터</h2><p className="mb-1 text-[13px] text-ink-soft">{events.length.toLocaleString()}건의 행사에서 지역·분야·가격을 골라보세요.</p><Suspense fallback={null}><DateBrowser events={slimForClient(events) as CultureEvent[]} openFilters /></Suspense></section>
      <nav aria-label="월별 행사 내부링크" className="mt-8 border-t border-line pt-5"><p className="mb-2 text-[13px] font-black text-ink">다른 달도 찾아보기</p><div className="flex flex-wrap gap-2">{MONTH_NAMES.map((label, i) => <Link key={label} href={`/month/${i + 1}`} className="rounded-full bg-tint px-3 py-1.5 text-[12px] font-bold text-ink-soft hover:text-ink">{label}에 뭐하지?</Link>)}</div></nav>
    </main>
  </>;
}
