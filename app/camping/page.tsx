import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Band } from "@/components/Band";
import CampingBrowser, { type CampRow } from "@/components/CampingBrowser";
import { CAMP_FACILITIES, CAMP_TYPES, campAreaCounts, getAllCamps, getCampCount, type Camp } from "@/lib/camping";
import { SIDO_SLUG } from "@/lib/classify";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: {
    absolute: "전국 캠핑장 추천 | 글램핑·오토캠핑·카라반 | 주말에뭐하지",
  },
  description: "전국 캠핑장을 유형(글램핑·오토캠핑·카라반)·편의시설(전기·샤워·온수)·반려동물 동반으로 골라보세요. 요금·예약·지도 정보 제공.",
  keywords: ["전국 캠핑장", "글램핑", "오토캠핑", "카라반", "반려동물 캠핑장"],
  alternates: { canonical: "/camping" },
};

const SIDO_NAME: Record<string, string> = {
  경기: "경기도",
  강원: "강원도",
  충북: "충청북도",
  충남: "충청남도",
  전북: "전라북도",
  전남: "전라남도",
  경북: "경상북도",
  경남: "경상남도",
  제주: "제주도",
};
const displaySido = (sido: string) => SIDO_NAME[sido] || sido;

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
  const areas = campAreaCounts();
  const camps = getAllCamps().map(slimCamp);

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          <span className="text-free">전국 캠핑장 추천</span>
        </h1>
        <p className="mt-2 max-w-4xl text-[13.5px] leading-7 text-ink-soft sm:text-[14px]">
          이번 주말 캠핑장을 찾고 있다면 글램핑, 오토캠핑, 카라반, 일반야영장까지 지역과 시설 기준으로 비교해 보세요. 전기·샤워실·온수 같은 편의시설, 반려동물 동반 여부, 지도와 예약 정보를 함께 확인할 수 있어 가족 나들이나 1박 여행 계획을 세우기 좋습니다. 자주 바뀌지 않는 고캠핑 기반 데이터를 활용해 필요한 정보만 빠르게 살펴볼 수 있습니다.
        </p>
        <p className="mt-2 text-[13px] text-ink-faint">
          전국 캠핑장 <span className="whitespace-nowrap">{total.toLocaleString()}곳</span> — 유형·시설·지역으로 골라보세요 · 출처: 한국관광공사 고캠핑
        </p>
        <details className="mt-3 text-[12.5px] leading-6 text-ink-faint">
          <summary className="cursor-pointer font-semibold text-ink-soft underline decoration-line underline-offset-2">
            지역별 캠핑장 더보기
          </summary>
          <nav aria-label="지역별 캠핑장" className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            {areas.map(({ area, count }, index) => (
              <span key={area} className="inline-flex items-center gap-2">
                {index > 0 ? <span aria-hidden="true">·</span> : null}
                <Link
                  href={`/camping/region/${(SIDO_SLUG as Record<string, string>)[area]}`}
                  prefetch={false}
                  className="font-semibold text-ink-soft underline decoration-line underline-offset-2 transition hover:text-free"
                >
                  {displaySido(area)} 캠핑장 <span className="font-normal text-ink-faint">{count.toLocaleString()}</span>
                </Link>
              </span>
            ))}
          </nav>
        </details>
      </Band>
      <Suspense fallback={null}>
        <CampingBrowser camps={camps} areas={areas} total={total} />
      </Suspense>
    </>
  );
}
