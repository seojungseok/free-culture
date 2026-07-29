import type { Metadata } from "next";
import Link from "next/link";
import { filterCamps, campAreaCounts, getCampCount, getAllCamps, CAMP_TYPE_SLUG } from "@/lib/camping";
import CampCard from "@/components/CampCard";
import { Band, Container } from "@/components/Band";
import { FilterRow, Chip } from "@/components/FilterChips";
import { SIDO_SLUG } from "@/lib/classify";

const CAP = 60;
// 정적 페이지(엣지 캐시). 하루 1회 재생성. 필터는 쿼리 대신 정적 라우트(/camping/region·type).
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "전국 캠핑장 — 글램핑·오토캠핑·카라반",
  description: "전국 캠핑장을 유형(글램핑·오토캠핑·카라반)·지역·반려동물 동반으로 골라보세요. 요금·예약·지도 정보 제공. 출처: 한국관광공사 고캠핑.",
  keywords: ["캠핑장", "전국 캠핑장", "글램핑", "오토캠핑", "카라반", "반려동물 캠핑장"],
  alternates: { canonical: "/camping" },
};

export default function CampingPage() {
  const areas = campAreaCounts();
  const total = getCampCount();
  const shown = getAllCamps().slice(0, CAP);

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]"><span className="text-free">⛺ 캠핑</span></h1>
        <p className="mt-1 text-[14px] text-ink-soft">
          전국 캠핑장 <span className="whitespace-nowrap">{total.toLocaleString()}곳</span> — 유형·지역으로 골라보세요 · 출처: 한국관광공사 고캠핑
        </p>
        <Link href="/camping/collections" className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-bold text-freedark ring-1 ring-free/30 transition hover:bg-tint">
          🏕️ 지역·유형별 캠핑장 모음 보기 →
        </Link>
      </Band>

      <div className="bg-panel">
        <Container className="space-y-3 py-4">
          <FilterRow label="유형">
            {CAMP_TYPE_SLUG.map((t) => (
              <Chip key={t.slug} href={`/camping/type/${t.slug}`} active={false} label={t.label} count={filterCamps({ type: t.label }).length} />
            ))}
          </FilterRow>
          <FilterRow label="지역">
            <Chip href="/camping" active label="전국" count={total} />
            {areas.map((a) => (
              <Chip key={a.area} href={`/camping/region/${(SIDO_SLUG as Record<string, string>)[a.area]}`} active={false} label={a.area} count={a.count} />
            ))}
          </FilterRow>
          <p className="pt-0.5 text-[12.5px] text-ink-faint">시설·반려동물 조건은 <Link href="/camping/collections" className="font-semibold text-free hover:underline">모음</Link>에서 지역·유형별로 볼 수 있어요.</p>
        </Container>

        <Container className="pb-12 pt-2">
          <div className="mb-4 flex items-baseline gap-2">
            <h2 className="text-[20px] font-extrabold tracking-tight text-ink sm:text-[22px]">전국 캠핑장</h2>
            <span className="text-[14px] font-bold text-free">{total.toLocaleString()}곳</span>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {shown.map((c) => <CampCard key={c.id} camp={c} />)}
          </div>
          <p className="mt-8 text-center text-[13px] text-ink-faint">유형·지역을 선택하면 더 많은 캠핑장을 볼 수 있어요</p>

          {/* 지역별 캠핑장 — 정적 라우트로 내부링크 */}
          <section className="mt-12 border-t border-line pt-6">
            <h2 className="mb-3 text-[15px] font-extrabold text-ink">지역별 캠핑장</h2>
            <div className="flex flex-wrap gap-2">
              {areas.map((a) => (
                <Link key={a.area} href={`/camping/region/${(SIDO_SLUG as Record<string, string>)[a.area]}`}
                  className="rounded-full border border-line bg-white px-3 py-1 text-[13px] text-ink-soft hover:border-free hover:text-free">
                  {a.area} 캠핑장 <span className="text-ink-faint">{a.count}</span>
                </Link>
              ))}
            </div>
          </section>
          <p className="mt-6 text-[12px] text-ink-faint">캠핑정보 제공: 한국관광공사 고캠핑</p>
        </Container>
      </div>
    </>
  );
}
