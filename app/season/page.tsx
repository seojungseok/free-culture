import { Suspense } from "react";
import type { Metadata } from "next";
import { Band } from "@/components/Band";
import SeasonBrowser from "@/components/SeasonBrowser";
import { filterSeasonPlaces, SEASON_KEYWORDS } from "@/lib/season";
import { slimTours } from "@/lib/tour";
import { nearbyRestaurants } from "@/lib/nearby";
import { autumnHeroText, autumnReason, buildAutumnStories } from "@/lib/autumnContent";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "가을나들이 추천 — 단풍·억새·수목원·자연휴양림",
  description: "전국 가을나들이 장소를 단풍·억새·수목원·자연휴양림 테마로 정리했습니다. 주소, 사진, 가을에 좋은 이유와 주변 맛집 동선까지 확인하세요.",
  keywords: ["가을나들이", "단풍 명소", "억새 명소", "수목원", "자연휴양림", "주말 나들이", "전국 관광지"],
  alternates: { canonical: "/season" },
};

export default function SeasonPage() {
  const s = { key: "autumn", label: "가을", emoji: "🍁" };
  const keywords = SEASON_KEYWORDS.autumn;
  const fullSpots = keywords.flatMap((kw) => filterSeasonPlaces({ kw }));
  const uniqueFullSpots = [...new Map(fullSpots.map((spot) => [spot.id, spot])).values()];
  const spots = slimTours(uniqueFullSpots).map((spot) => ({ ...spot, overview: autumnReason(spot) }));
  const nearbyFoodByPlace =
    Object.fromEntries(uniqueFullSpots.filter((p) => p.id === "2715684").map((p) => [p.id, nearbyRestaurants(p, 4)]));
  const autumnStories = buildAutumnStories(uniqueFullSpots, nearbyFoodByPlace);

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">{s.emoji} <span className="text-free">{s.label} 나들이</span></h1>
        <p className="mt-1 max-w-[820px] text-[14px] leading-[1.75] text-ink-soft">
          {autumnHeroText(uniqueFullSpots.length)}
        </p>
      </Band>
      <Suspense fallback={null}>
        <SeasonBrowser spots={spots} keywords={keywords} areas={[...new Set(uniqueFullSpots.map((spot) => spot.area))]} seasonLabel={s.label} autumnStories={autumnStories} />
      </Suspense>
    </>
  );
}
