import { Suspense } from "react";
import type { Metadata } from "next";
import { Band } from "@/components/Band";
import SeasonBrowser from "@/components/SeasonBrowser";
import { season } from "@/lib/finder";
import { filterSeasonPlaces, seasonAreas, seasonKeywords } from "@/lib/season";
import { slimTours } from "@/lib/tour";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "계절 나들이 — 지금 가기 좋은 전국 나들이",
  description: "계절에 가기 좋은 계곡·해변·물놀이·꽃·단풍 등 전국 나들이 장소를 지역·테마로 골라보세요.",
  keywords: ["계절 나들이", "가볼만한 곳", "주말 나들이", "전국 관광지"],
  alternates: { canonical: "/season" },
};

export default function SeasonPage() {
  const s = season();
  const keywords = seasonKeywords();
  const spots = slimTours(filterSeasonPlaces({}));

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">{s.emoji} <span className="text-free">{s.label} 나들이</span></h1>
        <p className="mt-1 text-[14px] text-ink-soft">{s.label}에 가기 좋은 전국 나들이 — 지역·테마로 골라보세요 · 계절은 자동으로 바뀌어요</p>
      </Band>
      <Suspense fallback={null}>
        <SeasonBrowser spots={spots} keywords={keywords} areas={seasonAreas()} seasonLabel={s.label} />
      </Suspense>
    </>
  );
}
