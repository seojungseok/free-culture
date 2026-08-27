import { Suspense } from "react";
import type { Metadata } from "next";
import { Band } from "@/components/Band";
import AffiliateNotice from "@/components/AffiliateNotice";
import CampingBrowser, { type CampRow } from "@/components/CampingBrowser";
import { CAMP_FACILITIES, CAMP_TYPES, campAreaCounts, getAllCamps, getCampCount, type Camp } from "@/lib/camping";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "전국 캠핑장 — 글램핑·오토캠핑·카라반 · 주말에뭐하지",
  description: "전국 캠핑장을 유형(글램핑·오토캠핑·카라반)·편의시설(전기·샤워·온수)·반려동물 동반으로 골라보세요. 요금·예약·지도 정보 제공.",
  keywords: ["전국 캠핑장", "글램핑", "오토캠핑", "카라반", "반려동물 캠핑장"],
  alternates: { canonical: "/camping" },
};

function bits(values: readonly string[], selected: string[]): number {
  return selected.reduce((out, value) => {
    const i = values.indexOf(value);
    return i >= 0 ? out | (1 << i) : out;
  }, 0);
}

function slimCamp(c: Camp): CampRow {
  const facilityBits = CAMP_FACILITIES.reduce((out, f, i) => c.facilities[f] ? out | (1 << i) : out, 0);
  return [c.id, c.name, c.area, c.sigungu, c.image, bits(CAMP_TYPES, c.types), facilityBits, c.pet ? 1 : 0];
}

export default function CampingPage() {
  const total = getCampCount();
  const camps = getAllCamps().map(slimCamp);

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          <span className="text-free">⛺ 캠핑</span>
        </h1>
        <AffiliateNotice className="mt-1.5" partner="coupang" />
        <p className="mt-1 text-[14px] text-ink-soft">
          전국 캠핑장 <span className="whitespace-nowrap">{total.toLocaleString()}곳</span> — 유형·시설·지역으로 골라보세요 · 출처: 한국관광공사 고캠핑
        </p>
      </Band>
      <Suspense fallback={null}>
        <CampingBrowser camps={camps} areas={campAreaCounts()} total={total} />
      </Suspense>
    </>
  );
}
