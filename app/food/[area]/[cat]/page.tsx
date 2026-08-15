import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Band, Container } from "@/components/Band";
import AffiliateNotice from "@/components/AffiliateNotice";
import { FilterRow, Chip } from "@/components/FilterChips";
import FoodCard from "@/components/FoodCard";
import CoupangBanner from "@/components/CoupangBanner";
import { filterRestaurants, foodAreas, FOOD_CATS, foodCatFromSlug } from "@/lib/food";
import { SIDO_SLUG, sidoFromSlug } from "@/lib/classify";

export const dynamicParams = false;
const CAP = 120;

export function generateStaticParams() {
  const have = new Set(foodAreas());
  const areaSlugs = Object.entries(SIDO_SLUG).filter(([sido]) => have.has(sido)).map(([, s]) => s);
  const params: { area: string; cat: string }[] = [];
  for (const area of areaSlugs) {
    const sido = sidoFromSlug(area);
    for (const c of FOOD_CATS) {
      // 실제 음식점이 있는 조합만 정적 생성(빈 페이지 색인 방지)
      if (filterRestaurants({ area: sido, cat3: c.code }).length) params.push({ area, cat: c.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ area: string; cat: string }> }): Promise<Metadata> {
  const { area, cat } = await params;
  const sido = sidoFromSlug(area);
  const c = foodCatFromSlug(cat);
  if (!sido || !c) return { title: "맛집을 찾을 수 없습니다" };
  const n = filterRestaurants({ area: sido, cat3: c.code }).length;
  return {
    title: `${sido} ${c.label} 맛집 ${n.toLocaleString()}곳 — 위치·연락처·영업정보`,
    description: `${sido} ${c.label} 맛집 ${n.toLocaleString()}곳. 위치·지도·전화·영업시간을 한눈에 확인하고 가볼 만한 ${c.label} 음식점을 찾아보세요.`,
    keywords: [`${sido} ${c.label}`, `${sido} ${c.label} 맛집`, `${sido} ${c.label} 맛집 추천`, `${sido} 맛집`],
    alternates: { canonical: `/food/${area}/${cat}` },
  };
}

export default async function FoodAreaCatPage({ params }: { params: Promise<{ area: string; cat: string }> }) {
  const { area, cat } = await params;
  const sido = sidoFromSlug(area);
  const c = foodCatFromSlug(cat);
  if (!sido || !c) notFound();

  const list = filterRestaurants({ area: sido, cat3: c.code });
  if (!list.length) notFound();
  const shown = list.slice(0, CAP);

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-[12.5px] text-ink-faint">
          <Link href="/food" className="hover:text-free">맛집</Link>
          <span>›</span>
          <Link href={`/food/${area}`} className="hover:text-free">{sido}</Link>
          <span>›</span>
          <span className="text-ink-soft">{c.label}</span>
        </nav>
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          <span className="text-free">{sido} {c.label}</span> 맛집
        </h1>
        <AffiliateNotice className="mt-1.5" partner="coupang" />
        <p className="mt-1 text-[14px] text-ink-soft">{sido}의 {c.label} 음식점 {list.length.toLocaleString()}곳 · 출처: 한국관광공사</p>
      </Band>

      <div className="bg-panel">
        <Container className="space-y-2.5 py-4">
          <FilterRow label="업종">
            <Chip href={`/food/${area}`} active={false} label="전체" count={filterRestaurants({ area: sido }).length} />
            {FOOD_CATS.map((f) => (
              <Chip key={f.code} href={`/food/${area}/${f.slug}`} active={f.slug === cat} label={f.label} count={filterRestaurants({ area: sido, cat3: f.code }).length} />
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
            {sido} {c.label} 맛집 {list.length.toLocaleString()}곳 중 {CAP}곳 표시
          </p>
        )}

        {/* 쿠팡 제휴 배너 — 목록 끝, 광고와 간격 확보 */}
        <div className="mt-8">
          <CoupangBanner />
        </div>
      </Container>
    </>
  );
}
