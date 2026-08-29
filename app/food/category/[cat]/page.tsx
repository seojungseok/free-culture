import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Band, Container } from "@/components/Band";
import { FilterRow, Chip } from "@/components/FilterChips";
import FoodCard from "@/components/FoodCard";
import { filterRestaurants, foodAreas, FOOD_CATS, foodCatFromSlug } from "@/lib/food";
import { SIDO_SLUG } from "@/lib/classify";

export const dynamicParams = false;
export const revalidate = 86400;
const CAP = 60;

export function generateStaticParams() {
  // 전국에 음식점 있는 업종만(=전부)
  return FOOD_CATS.filter((c) => filterRestaurants({ cat3: c.code }).length).map((c) => ({ cat: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ cat: string }> }): Promise<Metadata> {
  const { cat } = await params;
  const c = foodCatFromSlug(cat);
  if (!c) return { title: "맛집을 찾을 수 없습니다" };
  const n = filterRestaurants({ cat3: c.code }).length;
  return {
    title: `전국 ${c.label} 맛집 ${n.toLocaleString()}곳 — 지역별 ${c.label} 추천`,
    description: `전국 ${c.label} 맛집 ${n.toLocaleString()}곳을 지역별로 모았어요. 위치·전화·영업정보를 확인하고 가볼 만한 ${c.label} 음식점을 찾아보세요.`,
    keywords: [`${c.label} 맛집`, `전국 ${c.label} 맛집`, `${c.label} 맛집 추천`, `${c.label} 맛집 순위`],
    alternates: { canonical: `/food/category/${cat}` },
  };
}

export default async function FoodCategoryPage({ params }: { params: Promise<{ cat: string }> }) {
  const { cat } = await params;
  const c = foodCatFromSlug(cat);
  if (!c) notFound();

  const list = filterRestaurants({ cat3: c.code });
  if (!list.length) notFound();
  const shown = list.slice(0, CAP);
  const areas = foodAreas();
  const areaCount = (a: string) => filterRestaurants({ area: a, cat3: c.code }).length;

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-[12.5px] text-ink-faint">
          <Link href="/food" className="hover:text-free">맛집</Link>
          <span>›</span>
          <span className="text-ink-soft">전국 {c.label}</span>
        </nav>
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          전국 <span className="text-free">{c.label}</span> 맛집
        </h1>
        <p className="mt-1 text-[14px] text-ink-soft">전국 {c.label} 음식점 {list.length.toLocaleString()}곳 · 출처: 한국관광공사</p>
      </Band>

      <div className="bg-panel">
        <Container className="space-y-2.5 py-4">
          <FilterRow label="업종">
            {FOOD_CATS.map((f) => (
              <Chip key={f.code} href={`/food/category/${f.slug}`} active={f.slug === cat} label={f.label} count={filterRestaurants({ cat3: f.code }).length} />
            ))}
          </FilterRow>
          <p className="pt-0.5 text-[12.5px] text-ink-faint">지역을 고르면 <b className="text-ink-soft">{`지역 ${c.label}`}</b> 맛집만 볼 수 있어요.</p>
        </Container>

        <Container className="pb-12 pt-2">
          <div className="mb-4 flex items-baseline gap-2">
            <h2 className="text-[20px] font-extrabold tracking-tight text-ink sm:text-[22px]">전국 {c.label} 맛집</h2>
            <span className="text-[14px] font-bold text-free">{list.length.toLocaleString()}곳</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {shown.map((r) => <FoodCard key={r.id} r={r} />)}
          </div>
          <p className="mt-8 text-center text-[13px] text-ink-faint">지역을 선택하면 더 많은 {c.label} 맛집을 볼 수 있어요</p>

          {/* 쿠팡 제휴 배너 — 목록 끝, 광고와 간격 확보 */}
          {/* 지역별 {업종} 맛집 — /food/[지역]/[업종] 정적 라우트로 내부링크 */}
          <section className="mt-12 border-t border-line pt-6">
            <h2 className="mb-3 text-[15px] font-extrabold text-ink">지역별 {c.label} 맛집</h2>
            <div className="flex flex-wrap gap-2">
              {areas.filter((a) => areaCount(a) > 0).map((a) => (
                <Link key={a} href={`/food/${(SIDO_SLUG as Record<string, string>)[a]}/${c.slug}`}
                  className="rounded-full border border-line bg-white px-3 py-1 text-[13px] text-ink-soft hover:border-free hover:text-free">
                  {a} {c.label} <span className="text-ink-faint">{areaCount(a)}</span>
                </Link>
              ))}
            </div>
          </section>
        </Container>
      </div>
    </>
  );
}
