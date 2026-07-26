import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllEvents, getByRegion, slimForClient } from "@/lib/data";
import { getKidTours } from "@/lib/tour";
import { GENRES, SIDO_SLUG, sidoFromSlug } from "@/lib/classify";
import DateBrowser from "@/components/DateBrowser";
import TourCard from "@/components/TourCard";
import { Band, Container } from "@/components/Band";

const isFree = (t: string) => t === "free" || t === "free_estimated";

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
    keywords: [`${sido} 문화행사`, `${sido} 무료 전시`, `${sido} 무료 공연`, `${sido} 가볼만한 곳`, `${sido} 주말 나들이`],
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
  const all = getAllEvents();
  const regionCount = getByRegion(sido).length;
  const events = slimForClient(all);

  // 이 지역에서 무료 행사 있는 분야 (조합 페이지 링크)
  const freeGenres = GENRES.filter(
    (g) => g.key !== "etc" && all.some((e) => e.area === sido && e.genreKey === g.key && isFree(e.priceType))
  );
  const tours = getKidTours(sido, 12);

  return (
    <>
      <Band tone="tint" innerClassName="py-6">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          <span className="text-free">{sido}</span> 문화행사
        </h1>
        <p className="mt-1 text-[14px] text-ink-soft">
          {sido}에서 열리는 전시·공연 {regionCount.toLocaleString()}건 — 지역·분야·가격·날짜로 골라보세요
        </p>
        {freeGenres.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {freeGenres.map((g) => (
              <Link
                key={g.key}
                href={`/region/${code}/${g.key}`}
                className="rounded-full border border-free/30 bg-white px-3 py-1 text-[12.5px] font-bold text-free transition hover:bg-free hover:text-white"
              >
                {sido} 무료 {g.label}
              </Link>
            ))}
          </div>
        )}
      </Band>
      <Suspense fallback={null}>
        <DateBrowser events={events} initial={{ region: sido }} />
      </Suspense>

      {/* 아이와 가볼만한 곳 (TourAPI) */}
      {tours.length > 0 && (
        <div className="border-t border-line bg-white">
          <Container className="pb-12 pt-8">
            <h2 className="text-[18px] font-extrabold text-ink">
              🏞️ {sido} 아이와 가볼만한 곳
            </h2>
            <p className="mt-1 text-[13px] text-ink-faint">
              박물관·과학관·체험 등 {sido}에서 아이와 나들이하기 좋은 명소 (지도 링크 제공)
            </p>
            <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {tours.map((t) => (
                <TourCard key={t.id} spot={t} />
              ))}
            </div>
            <p className="mt-6 text-[12px] text-ink-faint">
              관광정보 제공: 한국관광공사 (TourAPI)
            </p>
          </Container>
        </div>
      )}
    </>
  );
}
