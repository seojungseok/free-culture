import type { Metadata } from "next";
import { getPlaceCount, getPlacesSample, getTourAreaCounts, getTypeCounts, slimTours } from "@/lib/tour";
import PlacesBrowser from "@/components/PlacesBrowser";
import { Band } from "@/components/Band";

export const metadata: Metadata = {
  title: "나들이·가볼만한 곳 — 전국 관광지·문화시설·체험 명소",
  keywords: ["나들이", "가볼만한 곳", "주말 나들이", "전국 관광지", "문화시설", "체험 명소"],
  description:
    "전국의 관광지·박물관·과학관·수목원·체험 명소를 지역·유형별로 모았어요. 장소 소개와 지도·홈페이지 링크 제공.",
  alternates: { canonical: "/places" },
};

export default function PlacesPage() {
  const total = getPlaceCount();
  const spots = slimTours(getPlacesSample(300));
  const areas = getTourAreaCounts();

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          <span className="text-free">나들이</span>
        </h1>
        <p className="mt-1 text-[14px] text-ink-soft">
          전국 관광지·문화시설·체험 명소 {total.toLocaleString()}곳 — 지역·유형으로 골라보세요
        </p>
      </Band>
      <PlacesBrowser spots={spots} areas={areas} total={total} typeTotals={getTypeCounts()} />
    </>
  );
}
