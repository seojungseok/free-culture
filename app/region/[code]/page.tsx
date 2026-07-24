import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllEvents, getByRegion, slimForClient } from "@/lib/data";
import { SIDO_SLUG, sidoFromSlug } from "@/lib/classify";
import DateBrowser from "@/components/DateBrowser";
import { Band } from "@/components/Band";

export function generateStaticParams() {
  return Object.values(SIDO_SLUG).map((code) => ({ code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const sido = sidoFromSlug(code);
  if (!sido) return { title: "지역을 찾을 수 없습니다" };
  const n = getByRegion(sido).length;
  return {
    title: `${sido} 문화행사 — 무료·저렴한 전시·공연`,
    description: `${sido}에서 지금 열리는 전시·공연·문화행사 ${n}건. 날짜별로 골라 보고 무료 행사를 먼저 확인하세요.`,
    alternates: { canonical: `/region/${code}` },
  };
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const sido = sidoFromSlug(code);
  if (!sido) notFound();
  const regionCount = getByRegion(sido).length;
  const events = slimForClient(getAllEvents());

  return (
    <>
      <Band tone="tint" innerClassName="py-6">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          <span className="text-free">{sido}</span> 문화행사
        </h1>
        <p className="mt-1 text-[14px] text-ink-soft">
          {sido}에서 열리는 전시·공연 {regionCount.toLocaleString()}건 — 지역·분야·가격·날짜로 골라보세요
        </p>
      </Band>
      <Suspense fallback={null}>
        <DateBrowser events={events} initial={{ region: sido }} />
      </Suspense>
    </>
  );
}
