import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Band, Container } from "@/components/Band";
import DateCourseCard from "@/components/DateCourseCard";
import CoupangBanner from "@/components/CoupangBanner";
import { dateCoursesByArea, dateAreaCounts, dateCityCounts, sidoFromSlug } from "@/lib/dateCourses";
import { SIDO_SLUG } from "@/lib/classify";
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
  const cities = dateCityCounts(sido).slice(0, 4).map((c) => c.city);
  return {
    title: `${sido} 카페데이트 — 카페·공원·맛집 코스 ${list.length}곳`,
    description: `${sido} 카페데이트 코스 ${list.length}곳. 카페에서 시작해 걸어서 닿는 공원과 맛집까지 이어지는 반나절 동선을 ${cities.join("·")} 등 지역별로 모았어요.`,
    keywords: [
      `${sido} 카페데이트`,
      `${sido} 카페 데이트 코스`,
      `${sido} 데이트 코스`,
      ...cities.map((c) => `${c} 카페데이트`),
      `${sido} 카페 추천`,
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

  const cities = dateCityCounts(sido);
  const others = dateAreaCounts().filter((a) => a.area !== sido);

  // 구조화 데이터 — 코스 목록
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${sido} 카페데이트 코스`,
    numberOfItems: list.length,
    itemListElement: list.slice(0, 30).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${c.cafe.title} 카페데이트 코스`,
      url: `${SITE.url}/date/c/${c.id}`,
    })),
  };
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <Band tone="tint" innerClassName="py-5">
        <nav className="mb-1 flex items-center gap-1 text-[12.5px] text-ink-faint">
          <Link href="/date" className="hover:text-free">카페데이트</Link>
          <span>›</span>
          <span>{sido}</span>
        </nav>
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          <span className="text-free">{sido} 카페데이트</span>
        </h1>
        <p className="mt-1 text-[14px] text-ink-soft">
          카페 → 공원 → 맛집으로 이어지는 {sido} 반나절 코스 {list.length}곳 — 세 곳이 걸어서 닿는 거리예요
        </p>
      </Band>

      <div className="bg-panel">
        {cities.length > 1 && (
          <Container className="pt-4">
            <div className="flex flex-wrap gap-2">
              {cities.map((c) => (
                <span key={c.city} className="rounded-full bg-white px-3 py-1.5 text-[12.5px] font-semibold text-ink-soft ring-1 ring-line">
                  {c.city} 카페데이트 <span className="text-[11px] font-black text-free">{c.count}</span>
                </span>
              ))}
            </div>
          </Container>
        )}

        <Container className="pb-12 pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => <DateCourseCard key={c.id} course={c} />)}
          </div>

          {/* 관심 기반 제휴 배너 (쿠팡 파트너스) */}
          <div className="mt-8">
            <CoupangBanner />
          </div>

          {others.length > 0 && (
            <section className="mt-10 border-t border-line pt-6">
              <h2 className="mb-3 text-[15px] font-extrabold text-ink">다른 지역 카페데이트</h2>
              <div className="flex flex-wrap gap-2">
                {others.map((a) => (
                  <Link key={a.area} href={`/date/${(SIDO_SLUG as Record<string, string>)[a.area]}`}
                    className="rounded-full border border-line bg-white px-3 py-1 text-[13px] text-ink-soft hover:border-free hover:text-free">
                    {a.area} 카페데이트 <span className="text-ink-faint">{a.count}</span>
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
