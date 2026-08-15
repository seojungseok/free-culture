import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Band, Container } from "@/components/Band";
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
  const cities = dateCityCounts(sido);
  const top = cities.slice(0, 5).map((c) => c.city);
  return {
    title: `${sido} 카페데이트 — 지역별 카페·공원·맛집 코스 ${list.length}곳`,
    description: `${sido} 카페데이트 코스 ${list.length}곳을 ${cities.length}개 지역으로 정리했어요. ${top.join("·")} 등 원하는 동네를 골라 카페부터 공원·맛집까지 이어지는 반나절 코스를 확인하세요.`,
    keywords: [
      `${sido} 카페데이트`,
      `${sido} 카페 데이트 코스`,
      `${sido} 데이트 코스`,
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

  const cities = dateCityCounts(sido);
  const others = dateAreaCounts().filter((a) => a.area !== sido);

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
        <p className="mt-1 text-[13.5px] text-ink-soft">
          동네를 고르면 그 지역 카페 목록이 나와요 · 코스 {list.length}곳
        </p>
      </Band>

      <div className="bg-panel">
        <Container className="pb-12 pt-4">
          <h2 className="mb-3 text-[16px] font-extrabold text-ink">어느 동네로 가시나요?</h2>

          {/* 모바일 우선 — 한 줄에 하나(작은 화면), 넓어지면 2~3열. 터치 영역 크게 */}
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((c) => (
              <li key={c.city}>
                <Link
                  href={`/date/${slug}/${encodeURIComponent(c.city)}`}
                  className="flex min-h-[56px] items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 transition active:scale-[0.99] hover:border-free/50"
                >
                  <span className="min-w-0">
                    <span className="block text-[15.5px] font-bold text-ink">{c.city}</span>
                    <span className="block text-[12.5px] text-ink-faint">카페데이트 {c.count}곳</span>
                  </span>
                  <span className="shrink-0 text-[18px] leading-none text-ink-faint">›</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* 관심 기반 제휴 배너 (쿠팡 파트너스) */}
          <div className="mt-8">
            <CoupangBanner />
          </div>

          {others.length > 0 && (
            <section className="mt-8 border-t border-line pt-5">
              <h2 className="mb-2.5 text-[14px] font-extrabold text-ink">다른 지역</h2>
              <div className="flex flex-wrap gap-1.5">
                {others.map((a) => (
                  <Link key={a.area} href={`/date/${(SIDO_SLUG as Record<string, string>)[a.area]}`}
                    className="rounded-full border border-line bg-white px-3 py-1.5 text-[12.5px] text-ink-soft hover:border-free hover:text-free">
                    {a.area} <span className="text-ink-faint">{a.count}</span>
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
