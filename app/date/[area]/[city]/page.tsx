import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Band, Container } from "@/components/Band";
import AffiliateNotice from "@/components/AffiliateNotice";
import { FilterRow, Chip } from "@/components/FilterChips";
import DateCourseSections from "@/components/DateCourseSections";
import CoupangBanner from "@/components/CoupangBanner";
import {
  dateCoursesByCity, dateCityCounts, dateAreaCounts, dateCityParams, sidoFromSlug,
} from "@/lib/dateCourses";
import { SITE } from "@/lib/site";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
  return dateCityParams();
}

export async function generateMetadata({
  params,
}: { params: Promise<{ area: string; city: string }> }): Promise<Metadata> {
  const { area: slug, city: rawCity } = await params;
  const sido = sidoFromSlug(slug);
  const city = decodeURIComponent(rawCity);
  if (!sido) return {};
  const list = dateCoursesByCity(sido, city);
  if (!list.length) return {};
  const names = list.slice(0, 5).map((c) => c.cafe.title);
  return {
    title: `${city} 카페데이트 — 카페 ${list.length}곳과 산책·맛집 코스`,
    description: `${sido} ${city} 카페데이트 코스 ${list.length}곳. ${names.join(", ")} 등 카페에서 시작해 가까운 공원을 걷고 맛집에서 마무리하는 반나절 동선을 모았어요.`,
    keywords: [
      `${city} 카페데이트`,
      `${city} 카페`,
      `${city} 데이트 코스`,
      `${sido} ${city} 카페`,
      `${city} 카페 추천`,
      ...names.slice(0, 3),
    ],
    alternates: { canonical: `/date/${slug}/${encodeURIComponent(city)}` },
  };
}

export default async function DateCityPage({
  params,
}: { params: Promise<{ area: string; city: string }> }) {
  const { area: slug, city: rawCity } = await params;
  const sido = sidoFromSlug(slug);
  const city = decodeURIComponent(rawCity);
  if (!sido) notFound();
  const list = dateCoursesByCity(sido, city);
  if (!list.length) notFound();

  const areas = dateAreaCounts();
  const cities = dateCityCounts(sido);

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${city} 카페데이트 코스`,
    numberOfItems: list.length,
    itemListElement: list.map((c, i) => ({
      "@type": "ListItem", position: i + 1, name: `${c.cafe.title} 카페데이트 코스`,
      url: `${SITE.url}/date/c/${c.id}`,
    })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "카페데이트", item: `${SITE.url}/date` },
      { "@type": "ListItem", position: 2, name: `${sido} 카페데이트`, item: `${SITE.url}/date/${slug}` },
      { "@type": "ListItem", position: 3, name: `${city} 카페데이트`, item: `${SITE.url}/date/${slug}/${encodeURIComponent(city)}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <Band tone="tint" innerClassName="py-4">
        <nav className="mb-1 flex flex-wrap items-center gap-1 text-[12.5px] text-ink-faint">
          <Link href="/date" className="hover:text-free">카페데이트</Link>
          <span>›</span>
          <Link href={`/date/${slug}`} className="hover:text-free">{sido}</Link>
          <span>›</span>
          <span>{city}</span>
        </nav>
        <h1 className="text-[22px] font-black tracking-[-0.02em] text-ink sm:text-[28px]">
          <span className="text-free">{city} 카페데이트</span>
        </h1>
        <AffiliateNotice className="mt-1.5" partner="coupang" />
        <p className="mt-1 text-[13.5px] text-ink-soft">
          카페를 고르면 공원·맛집까지 이어지는 코스가 나와요 · {list.length}곳
        </p>
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
              <Chip key={c.city} href={`/date/${slug}/${encodeURIComponent(c.city)}`} active={c.city === city} label={c.city} count={c.count} />
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
