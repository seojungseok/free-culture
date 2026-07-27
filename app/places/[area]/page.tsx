import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlaces, getTourAreaCounts, getTypeCounts, slimTours } from "@/lib/tour";
import { SIDO_SLUG, sidoFromSlug } from "@/lib/classify";
import PlacesBrowser from "@/components/PlacesBrowser";
import { Band } from "@/components/Band";

export const dynamicParams = false;

export function generateStaticParams() {
  // 관광지 데이터가 있는 지역만 생성
  const have = new Set(getTourAreaCounts().map((a) => a.area));
  return Object.entries(SIDO_SLUG)
    .filter(([sido]) => have.has(sido))
    .map(([, area]) => ({ area }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ area: string }>;
}): Promise<Metadata> {
  const { area } = await params;
  const sido = sidoFromSlug(area);
  if (!sido) return { title: "지역을 찾을 수 없습니다" };
  const n = getPlaces({ area: sido }).length;
  return {
    title: `${sido} 나들이·가볼만한 곳 — 관광지·문화시설·체험 ${n.toLocaleString()}곳`,
    description: `${sido}에서 나들이하기 좋은 관광지·박물관·과학관·수목원·체험 명소 ${n.toLocaleString()}곳. 장소 소개와 지도·홈페이지 링크를 확인하세요.`,
    keywords: [`${sido} 나들이`, `${sido} 가볼만한 곳`, `${sido} 주말 나들이`, `${sido} 관광지`, `${sido} 문화시설`],
    alternates: { canonical: `/places/${area}` },
  };
}

export default async function PlacesAreaPage({
  params,
}: {
  params: Promise<{ area: string }>;
}) {
  const { area } = await params;
  const sido = sidoFromSlug(area);
  if (!sido) notFound();

  const regionSpots = getPlaces({ area: sido });
  const spots = slimTours(regionSpots);
  const areas = getTourAreaCounts();

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          <span className="text-free">{sido}</span> 나들이
        </h1>
        <p className="mt-1 text-[14px] text-ink-soft">
          {sido}의 관광지·문화시설·체험 명소 {regionSpots.length.toLocaleString()}곳 — 유형·지도·소개 제공
        </p>
      </Band>
      <PlacesBrowser spots={spots} areas={areas} initialArea={sido} total={regionSpots.length} typeTotals={getTypeCounts(sido)} />
    </>
  );
}
