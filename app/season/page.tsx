import { Suspense } from "react";
import type { Metadata } from "next";
import { Band } from "@/components/Band";
import SeasonBrowser from "@/components/SeasonBrowser";
import { filterSeasonPlaces, SEASON_KEYWORDS } from "@/lib/season";
import { slimTours } from "@/lib/tour";
import { autumnReason } from "@/lib/autumnContent";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "가을나들이 추천 — 단풍·억새·수목원·자연휴양림",
  description: "전국 가을나들이 장소를 단풍·억새·수목원·자연휴양림 테마와 지역별 필터로 빠르게 찾아보세요.",
  keywords: ["가을나들이", "단풍 명소", "억새 명소", "수목원", "자연휴양림", "주말 나들이", "전국 관광지"],
  alternates: { canonical: "/season" },
};

export default function SeasonPage() {
  const s = { key: "autumn", label: "가을", emoji: "🍁" };
  const keywords = SEASON_KEYWORDS.autumn;
  const fullSpots = keywords.flatMap((kw) => filterSeasonPlaces({ kw }));
  const uniqueFullSpots = [...new Map(fullSpots.map((spot) => [spot.id, spot])).values()];
  const spots = slimTours(uniqueFullSpots).map((spot) => ({ ...spot, overview: autumnReason(spot) }));

  return (
    <>
      <Band tone="tint" innerClassName="py-4">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">{s.emoji} <span className="text-free">{s.label} 나들이</span></h1>
        <p className="mt-1 max-w-[760px] text-[14px] leading-[1.7] text-ink-soft">
          가을은 날씨가 선선하고 단풍, 억새, 숲길 풍경이 좋아 걷기 편한 여행을 계획하기 좋은 계절입니다. 테마와 지역을 골라 이번 주말 갈 만한 가을나들이 장소를 빠르게 찾아보세요.
        </p>
      </Band>
      <Suspense fallback={null}>
        <SeasonBrowser spots={spots} keywords={keywords} areas={[...new Set(uniqueFullSpots.map((spot) => spot.area))]} seasonLabel={s.label} />
      </Suspense>
    </>
  );
}
