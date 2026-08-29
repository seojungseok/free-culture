import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Band, Container } from "@/components/Band";
import { FilterRow, Chip } from "@/components/FilterChips";
import FoodCard from "@/components/FoodCard";
import { filterRestaurants, foodAreas, FOOD_CATS } from "@/lib/food";
import { SIDO_SLUG, sidoFromSlug } from "@/lib/classify";

export const dynamicParams = false;
const CAP = 120;

export function generateStaticParams() {
  const have = new Set(foodAreas());
  return Object.entries(SIDO_SLUG)
    .filter(([sido]) => have.has(sido))
    .map(([, area]) => ({ area }));
}

export async function generateMetadata({ params }: { params: Promise<{ area: string }> }): Promise<Metadata> {
  const { area } = await params;
  const sido = sidoFromSlug(area);
  if (!sido) return { title: "지역을 찾을 수 없습니다" };
  const n = filterRestaurants({ area: sido }).length;
  return {
    title: `${sido} 맛집 — 한식·중식·일식·카페 ${n.toLocaleString()}곳`,
    description: `${sido} 맛집 ${n.toLocaleString()}곳을 업종(한식·서양식·일식·중식·카페·이색)으로 골라보세요. 위치·연락처·영업정보 제공.`,
    keywords: [`${sido} 맛집`, `${sido} 맛집 추천`, `${sido} 한식`, `${sido} 카페`, `${sido} 맛집 탐방`],
    alternates: { canonical: `/food/${area}` },
  };
}

export default async function FoodAreaPage({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  const sido = sidoFromSlug(area);
  if (!sido) notFound();

  const list = filterRestaurants({ area: sido });
  if (!list.length) notFound();
  const shown = list.slice(0, CAP);
  const catCount = (code: string) => filterRestaurants({ area: sido, cat3: code }).length;
  const otherAreas = foodAreas().filter((a) => a !== sido);

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-[12.5px] text-ink-faint">
          <Link href="/food" className="hover:text-free">맛집</Link>
          <span>›</span>
          <span className="text-ink-soft">{sido}</span>
        </nav>
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          <span className="text-free">{sido}</span> 맛집
        </h1>
        <p className="mt-1 text-[14px] text-ink-soft">{sido} 음식점 {list.length.toLocaleString()}곳 — 업종별로 골라보세요 · 출처: 한국관광공사</p>
      </Band>

      <div className="bg-panel">
        <Container className="space-y-2.5 py-4">
          <FilterRow label="업종">
            {FOOD_CATS.map((c) => (
              <Chip key={c.code} href={`/food/${area}/${c.slug}`} active={false} label={c.label} count={catCount(c.code)} />
            ))}
          </FilterRow>
        </Container>
      </div>

      <Container className="py-6">
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {shown.map((r) => <FoodCard key={r.id} r={r} />)}
        </div>
        {list.length > CAP && (
          <p className="mt-6 text-center text-[13px] text-ink-faint">
            {sido} 맛집 {list.length.toLocaleString()}곳 중 {CAP}곳 표시 — 업종을 선택해 더 좁혀보세요.
          </p>
        )}

        {/* 쿠팡 제휴 배너 — 목록 끝, 광고와 간격 확보 */}
        {/* 다른 지역 맛집 — 내부링크(크롤 유도) */}
        {otherAreas.length > 0 && (
          <section className="mt-10 border-t border-line pt-6">
            <h2 className="mb-3 text-[15px] font-extrabold text-ink">다른 지역 맛집</h2>
            <div className="flex flex-wrap gap-2">
              {otherAreas.map((a) => (
                <Link key={a} href={`/food/${(SIDO_SLUG as Record<string, string>)[a]}`}
                  className="rounded-full border border-line bg-white px-3 py-1 text-[13px] text-ink-soft hover:border-free hover:text-free">
                  {a} 맛집
                </Link>
              ))}
            </div>
          </section>
        )}
      </Container>
    </>
  );
}
