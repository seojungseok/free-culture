import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Band, Container } from "@/components/Band";
import AffiliateNotice from "@/components/AffiliateNotice";
import { FilterRow, Chip } from "@/components/FilterChips";
import DateCourseSections from "@/components/DateCourseSections";
import CoupangBanner from "@/components/CoupangBanner";
import { dateCoursesByArea, dateAreaCounts, dateCityCounts, sidoFromSlug } from "@/lib/dateCourses";
import { SITE } from "@/lib/site";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
  return dateAreaCounts().map(({ slug }) => ({ area: slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ area: string }> }): Promise<Metadata> {
  const { area: slug } = await params;
  const sido = sidoFromSlug(slug);
  if (!sido) return {};
  const list = dateCoursesByArea(sido);
  const cities = dateCityCounts(sido);
  const top = cities.slice(0, 5).map((c) => c.city);
  return {
    title: `${sido} 카페데이트 — 카페·공원·맛집 코스 ${list.length}곳`,
    description: `${sido} 카페데이트 코스 ${list.length}곳. ${top.join("·")} 등 ${cities.length}개 동네에서 카페부터 공원·맛집까지 걸어서 이어지는 반나절 코스를 골라보세요.`,
    keywords: [
      `${sido} 카페데이트`, `${sido} 카페 데이트 코스`, `${sido} 데이트 코스`,
      ...top.map((c) => `${c} 카페데이트`),
    ],
    alternates: { canonical: `/date/${slug}` },
  };
}

export default async function DateAreaPage({ params }: { params: Promise<{ area: string }> }) {
  const { area: slug } = await params;
  const sido = sidoFromSlug(slug);
  if (!sido) notFound();
  const list = dateCoursesByArea(sido);
  if (!list.length) notFound();

  const areas = dateAreaCounts();
  const cities = dateCityCounts(sido);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "카페데이트", item: `${SITE.url}/date` },
      { "@type": "ListItem", position: 2, name: `${sido} 카페데이트`, item: `${SITE.url}/date/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <Band tone="tint" innerClassName="py-4">
        <nav className="mb-1 flex items-center gap-1 text-[12.5px] text-ink-faint">
          <Link href="/date" className="hover:text-free">카페데이트</Link>
          <span>›</span>
          <span>{sido}</span>
        </nav>
        <h1 className="text-[22px] font-black tracking-[-0.02em] text-ink sm:text-[28px]">
          <span className="text-free">{sido} 카페데이트</span>
        </h1>
        <AffiliateNotice className="mt-1.5" partner="coupang" />
        <p className="mt-1 text-[13.5px] text-ink-soft">동네를 고르면 그 동네 코스만 볼 수 있어요</p>
      </Band>

      <div className="bg-panel">
        {/* 지역 · 동네 — 캠핑과 같은 칩 방식 */}
        <Container className="space-y-2.5 py-4">
          <FilterRow label="지역">
            {areas.map((a) => (
              <Chip key={a.area} href={`/date/${a.slug}`} active={a.area === sido} label={a.area} count={a.count} />
            ))}
          </FilterRow>
          <FilterRow label="동네">
            {cities.map((c) => (
              <Chip key={c.city} href={`/date/${slug}/${encodeURIComponent(c.city)}`} active={false} label={c.city} count={c.count} />
            ))}
          </FilterRow>
        </Container>

        <Container className="pb-12 pt-2">
          <DateCourseSections courses={list} />

          <div className="mt-8">
            <CoupangBanner />
          </div>
        </Container>
      </div>
    </>
  );
}
