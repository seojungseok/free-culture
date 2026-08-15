import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { filterCamps, campAreaCounts, CAMP_TYPE_SLUG, campTypeFromSlug } from "@/lib/camping";
import CampCard from "@/components/CampCard";
import CoupangBanner from "@/components/CoupangBanner";
import { Band, Container } from "@/components/Band";
import { FilterRow, Chip } from "@/components/FilterChips";
import { SIDO_SLUG } from "@/lib/classify";

export const dynamicParams = false;
export const revalidate = 86400;
const CAP = 60;

export function generateStaticParams() {
  return CAMP_TYPE_SLUG.filter((t) => filterCamps({ type: t.label }).length).map((t) => ({ type: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  const t = campTypeFromSlug(type);
  if (!t) return { title: "캠핑장을 찾을 수 없습니다" };
  const n = filterCamps({ type: t.label }).length;
  return {
    title: `전국 ${t.label} ${n.toLocaleString()}곳 — 지역별 ${t.label} 추천`,
    description: `전국 ${t.label} ${n.toLocaleString()}곳을 지역별로 모았어요. 요금·예약·편의시설·지도 정보를 확인하고 가볼 만한 ${t.label}을 찾아보세요.`,
    keywords: [`${t.label}`, `전국 ${t.label}`, `${t.label} 추천`, `${t.label} 예약`],
    alternates: { canonical: `/camping/type/${type}` },
  };
}

export default async function CampingTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const t = campTypeFromSlug(type);
  if (!t) notFound();

  const list = [...filterCamps({ type: t.label })].sort((a, b) => (b.image ? 1 : 0) - (a.image ? 1 : 0));
  if (!list.length) notFound();
  const shown = list.slice(0, CAP);
  const areas = campAreaCounts();
  const areaCount = (a: string) => filterCamps({ area: a, type: t.label }).length;

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-[12.5px] text-ink-faint">
          <Link href="/camping" className="hover:text-free">캠핑</Link>
          <span>›</span>
          <span className="text-ink-soft">전국 {t.label}</span>
        </nav>
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">전국 <span className="text-free">{t.label}</span></h1>
        <p className="mt-1 text-[14px] text-ink-soft">전국 {t.label} {list.length.toLocaleString()}곳 · 출처: 한국관광공사 고캠핑</p>
      </Band>

      <div className="bg-panel">
        <Container className="space-y-2.5 py-4">
          <FilterRow label="유형">
            {CAMP_TYPE_SLUG.map((x) => (
              <Chip key={x.slug} href={`/camping/type/${x.slug}`} active={x.slug === type} label={x.label} count={filterCamps({ type: x.label }).length} />
            ))}
          </FilterRow>
        </Container>

        <Container className="pb-12 pt-2">
          <div className="mb-4 flex items-baseline gap-2">
            <h2 className="text-[20px] font-extrabold tracking-tight text-ink sm:text-[22px]">전국 {t.label}</h2>
            <span className="text-[14px] font-bold text-free">{list.length.toLocaleString()}곳</span>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {shown.map((c) => <CampCard key={c.id} camp={c} />)}
          </div>
          <p className="mt-8 text-center text-[13px] text-ink-faint">지역을 선택하면 더 많은 {t.label}을 볼 수 있어요</p>

          {/* 캠핑용품 제휴 배너 (쿠팡 파트너스) — 목록 끝, 광고와 간격 확보 */}
          <div className="mt-8">
            <CoupangBanner />
          </div>

          {/* 지역별 {유형} — 지역 캠핑장 라우트로 내부링크 */}
          <section className="mt-12 border-t border-line pt-6">
            <h2 className="mb-3 text-[15px] font-extrabold text-ink">지역별 {t.label}</h2>
            <div className="flex flex-wrap gap-2">
              {areas.filter((a) => areaCount(a.area) > 0).map((a) => (
                <Link key={a.area} href={`/camping/region/${(SIDO_SLUG as Record<string, string>)[a.area]}`}
                  className="rounded-full border border-line bg-white px-3 py-1 text-[13px] text-ink-soft hover:border-free hover:text-free">
                  {a.area} {t.label} <span className="text-ink-faint">{areaCount(a.area)}</span>
                </Link>
              ))}
            </div>
          </section>
        </Container>
      </div>
    </>
  );
}
