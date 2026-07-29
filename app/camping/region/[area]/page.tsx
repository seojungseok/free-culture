import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { filterCamps, campAreaCounts, CAMP_TYPE_SLUG } from "@/lib/camping";
import { getAllBundles } from "@/lib/campingCollections";
import CampCard from "@/components/CampCard";
import { Band, Container } from "@/components/Band";
import { FilterRow, Chip } from "@/components/FilterChips";
import { SIDO_SLUG, sidoFromSlug } from "@/lib/classify";

export const dynamicParams = false;
export const revalidate = 86400;
const CAP = 60;

export function generateStaticParams() {
  return campAreaCounts().map(({ area }) => ({ area: (SIDO_SLUG as Record<string, string>)[area] })).filter((p) => p.area);
}

export async function generateMetadata({ params }: { params: Promise<{ area: string }> }): Promise<Metadata> {
  const { area } = await params;
  const sido = sidoFromSlug(area);
  if (!sido) return { title: "지역을 찾을 수 없습니다" };
  const n = filterCamps({ area: sido }).length;
  return {
    title: `${sido} 캠핑장 ${n.toLocaleString()}곳 — 글램핑·오토캠핑·카라반`,
    description: `${sido} 캠핑장 ${n.toLocaleString()}곳을 유형(글램핑·오토캠핑·카라반)·반려동물 동반으로 골라보세요. 요금·예약·지도 정보 제공.`,
    keywords: [`${sido} 캠핑장`, `${sido} 글램핑`, `${sido} 오토캠핑`, `${sido} 반려동물 캠핑장`, `${sido} 캠핑`],
    alternates: { canonical: `/camping/region/${area}` },
  };
}

export default async function CampingRegionPage({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  const sido = sidoFromSlug(area);
  if (!sido) notFound();

  const list = [...filterCamps({ area: sido })].sort((a, b) => (b.image ? 1 : 0) - (a.image ? 1 : 0));
  if (!list.length) notFound();
  const shown = list.slice(0, CAP);
  const typeCount = (label: string) => filterCamps({ area: sido, type: label }).length;
  const bundles = getAllBundles().filter((b) => b.area === sido); // 이 지역의 유형·테마 모음(글램핑·반려동물 등)
  const otherAreas = campAreaCounts().filter((a) => a.area !== sido);

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-[12.5px] text-ink-faint">
          <Link href="/camping" className="hover:text-free">캠핑</Link>
          <span>›</span>
          <span className="text-ink-soft">{sido}</span>
        </nav>
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]"><span className="text-free">{sido}</span> 캠핑장</h1>
        <p className="mt-1 text-[14px] text-ink-soft">{sido} 캠핑장 {list.length.toLocaleString()}곳 · 출처: 한국관광공사 고캠핑</p>
      </Band>

      <div className="bg-panel">
        <Container className="space-y-2.5 py-4">
          <FilterRow label="유형">
            {CAMP_TYPE_SLUG.map((t) => (
              <Chip key={t.slug} href={`/camping/type/${t.slug}`} active={false} label={t.label} count={typeCount(t.label)} />
            ))}
          </FilterRow>
          {bundles.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {bundles.map((b) => (
                <Link key={b.slug} href={`/camping/collections/${b.slug}`}
                  className="rounded-full bg-white px-3 py-1 text-[12.5px] text-ink-soft ring-1 ring-line hover:text-free hover:ring-free">
                  {b.label} <span className="text-ink-faint">{b.count}</span>
                </Link>
              ))}
            </div>
          )}
        </Container>

        <Container className="pb-12 pt-2">
          <div className="mb-4 flex items-baseline gap-2">
            <h2 className="text-[20px] font-extrabold tracking-tight text-ink sm:text-[22px]">{sido} 캠핑장</h2>
            <span className="text-[14px] font-bold text-free">{list.length.toLocaleString()}곳</span>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {shown.map((c) => <CampCard key={c.id} camp={c} />)}
          </div>
          {list.length > CAP && <p className="mt-8 text-center text-[13px] text-ink-faint">{sido} 캠핑장 {list.length.toLocaleString()}곳 중 {CAP}곳 표시</p>}

          {otherAreas.length > 0 && (
            <section className="mt-12 border-t border-line pt-6">
              <h2 className="mb-3 text-[15px] font-extrabold text-ink">다른 지역 캠핑장</h2>
              <div className="flex flex-wrap gap-2">
                {otherAreas.map((a) => (
                  <Link key={a.area} href={`/camping/region/${(SIDO_SLUG as Record<string, string>)[a.area]}`}
                    className="rounded-full border border-line bg-white px-3 py-1 text-[13px] text-ink-soft hover:border-free hover:text-free">
                    {a.area} 캠핑장 <span className="text-ink-faint">{a.count}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </Container>
      </div>
    </>
  );
}
