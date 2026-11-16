import { withSearchMetadata } from '@/lib/searchMetadata';
import TossTopDeals from '@/components/TossTopDeals';
import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllEvents, getByGenre, slimForClient } from "@/lib/data";
import { GENRES, genreLabelOf } from "@/lib/classify";
import DateBrowser from "@/components/DateBrowser";
import { Band } from "@/components/Band";
import { todayYmd } from '@/lib/dates';
import { fmtRange } from '@/lib/format';
import InitialIndexPreview from '@/components/InitialIndexPreview';

export function generateStaticParams() {
  return GENRES.map((g) => ({ code: g.key }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const label = genreLabelOf(code);
  const n = getByGenre(code).filter(event => event.endDate >= todayYmd()).length;
  return withSearchMetadata({
    title: `${label} 일정·관람 안내 | 전국 문화행사`,
    description: `전국 ${label} ${n}건의 날짜·장소·관람료와 공식 안내를 확인하세요. 지역·날짜·가격으로 원하는 행사를 찾아보세요.`,
    robots: n ? undefined : {index:false,follow:true},
    alternates: { canonical: `/genre/${code}` },
  });
}

export default async function GenrePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const valid = GENRES.some((g) => g.key === code);
  if (!valid) notFound();
  const label = genreLabelOf(code);
  const genreCount = getByGenre(code).filter(event => event.endDate >= todayYmd()).length;
  const events = slimForClient(getAllEvents());
  const preview=events.filter(event=>event.genreKey===code).slice(0,18).map(event=>({
    href:`/event/${event.id}`,title:event.title,meta:`${event.area} · ${fmtRange(event.startDate,event.endDate)} · ${event.place}`,
  }));

  return (
    <>
      <Band tone="tint" innerClassName="py-6">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          전국 <span className="text-free">{label}</span>
        </h1>
        <p className="mt-1 text-[14px] text-ink-soft">
          지금 열리는 {label} 행사 {genreCount.toLocaleString()}건 — 지역·가격·날짜로 골라보세요
        </p>
      </Band>
      <Suspense fallback={<InitialIndexPreview title={`현재 등록된 ${label}`} items={preview}/> }>
        <DateBrowser events={events} initial={{ genre: code }} advertisement={<TossTopDeals contained compact />} />
      </Suspense>
    </>
  );
}
