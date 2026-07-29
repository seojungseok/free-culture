import type { Metadata } from "next";
import Link from "next/link";
import { Band, Container } from "@/components/Band";
import { FilterRow, Chip } from "@/components/FilterChips";
import FoodCard from "@/components/FoodCard";
import { filterRestaurants, foodAreas, FOOD_CATS, getAllRestaurants } from "@/lib/food";
import { SIDO_SLUG } from "@/lib/classify";

const CAP = 60;
// 정적 페이지(엣지 캐시). 하루 1회 재생성으로 새 데이터 반영. 필터는 쿼리 대신 정적 라우트(/food/[지역]).
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "전국 맛집 탐방 — 지역·업종별 맛집",
  description: "전국 음식점을 지역과 업종(한식·서양식·일식·중식·카페·이색)으로 골라보세요. 위치·연락처·영업정보 제공.",
  keywords: ["맛집", "맛집 탐방", "전국 맛집", "지역 맛집", "맛집 추천"],
  alternates: { canonical: "/food" },
};

export default function FoodPage() {
  const areas = foodAreas();
  const total = getAllRestaurants().length;
  const shown = getAllRestaurants().slice(0, CAP);
  const areaCount = (a: string) => filterRestaurants({ area: a }).length;
  // 지역별 대표 업종 링크(색인·크롤 유도): 데이터 많은 상위 지역 몇 곳
  const topAreas = [...areas].sort((a, b) => areaCount(b) - areaCount(a)).slice(0, 4);

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">🍽️ <span className="text-free">맛집 탐방</span></h1>
        <p className="mt-1 text-[14px] text-ink-soft">전국 음식점 {total.toLocaleString()}곳 — 지역·업종으로 골라보세요 · 출처: 한국관광공사</p>
      </Band>

      <div className="bg-panel">
        <Container className="space-y-2.5 py-4">
          <FilterRow label="지역">
            <Chip href="/food" active label="전국" count={total} />
            {areas.map((a) => (
              <Chip key={a} href={`/food/${(SIDO_SLUG as Record<string, string>)[a]}`} active={false} label={a} count={areaCount(a)} />
            ))}
          </FilterRow>
          <FilterRow label="업종">
            {FOOD_CATS.map((c) => (
              <Chip key={c.code} href={`/food/category/${c.slug}`} active={false} label={c.label} count={filterRestaurants({ cat3: c.code }).length} />
            ))}
          </FilterRow>
        </Container>

        <Container className="pb-12 pt-2">
          <div className="mb-4 flex items-baseline gap-2">
            <h2 className="text-[20px] font-extrabold tracking-tight text-ink sm:text-[22px]">전국 맛집</h2>
            <span className="text-[14px] font-bold text-free">{total.toLocaleString()}곳</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {shown.map((r) => <FoodCard key={r.id} r={r} />)}
          </div>
          <p className="mt-8 text-center text-[13px] text-ink-faint">지역을 선택하면 더 많은 맛집을 볼 수 있어요</p>

          {/* 지역별 맛집 — 정적 허브(/food/[area])로 내부링크(색인·크롤 유도) */}
          <section className="mt-12 border-t border-line pt-6">
            <h2 className="mb-3 text-[15px] font-extrabold text-ink">지역별 맛집</h2>
            <div className="flex flex-wrap gap-2">
              {areas.map((a) => (
                <Link key={a} href={`/food/${(SIDO_SLUG as Record<string, string>)[a]}`}
                  className="rounded-full border border-line bg-white px-3 py-1 text-[13px] text-ink-soft hover:border-free hover:text-free">
                  {a} 맛집
                </Link>
              ))}
            </div>
          </section>

          {/* 인기 지역×업종 — 검색의도 높은 조합으로 내부링크 */}
          <section className="mt-8">
            <h2 className="mb-3 text-[15px] font-extrabold text-ink">인기 지역·업종</h2>
            <div className="flex flex-wrap gap-2">
              {topAreas.flatMap((a) =>
                FOOD_CATS.slice(0, 4).map((c) => (
                  <Link key={`${a}-${c.slug}`} href={`/food/${(SIDO_SLUG as Record<string, string>)[a]}/${c.slug}`}
                    className="rounded-full bg-white px-3 py-1 text-[12.5px] text-ink-soft ring-1 ring-line hover:text-free hover:ring-free">
                    {a} {c.label}
                  </Link>
                ))
              )}
            </div>
          </section>
        </Container>
      </div>
    </>
  );
}
