import type { Metadata } from "next";
import Link from "next/link";
import { Band, Container } from "@/components/Band";
import AffiliateNotice from "@/components/AffiliateNotice";
import DateRegionBrowser from "@/components/DateRegionBrowser";
import NearbyDateCourses from "@/components/NearbyDateCourses";
import CoupangBanner from "@/components/CoupangBanner";
import { SITE } from "@/lib/site";
import { getDateCourses, dateAreaCounts, dateCourseGeo } from "@/lib/dateCourses";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const n = getDateCourses().length;
  const title = `내 주변 카페데이트 코스 ${n}곳 — 카페·공원·맛집 반나절 코스`;
  const description = `내 위치에서 가까운 카페데이트 코스를 걸어서·차로 나눠 찾아보세요. 카페에서 시작해 공원과 맛집까지 이어지는 반나절 데이트 코스 ${n}곳, 지역별로도 볼 수 있어요.`;
  return {
    title,
    description,
    keywords: [
      "카페데이트", "내 주변 카페데이트", "카페데이트 코스", "전국 카페데이트",
      "카페 공원 맛집 코스", "반나절 데이트 코스", "가까운 카페데이트", "지역별 카페데이트",
    ],
    alternates: { canonical: "/date" },
    openGraph: { title, description, url: `${SITE.url}/date`, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default function DateHubPage() {
  const all = getDateCourses();
  const areas = dateAreaCounts();
  const geo = dateCourseGeo();

  // SEO 구조화 데이터 — 카페데이트 코스 모음(CollectionPage) + 지역 목록(ItemList) + 이동경로(Breadcrumb)
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "전국 카페데이트 코스",
    description: `카페·공원·맛집이 가까이 이어지는 반나절 카페데이트 코스 ${all.length}곳`,
    url: `${SITE.url}/date`,
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    about: { "@type": "Thing", name: "카페데이트 코스" },
  };
  const regionsLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "지역별 카페데이트 코스",
    itemListElement: areas.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${a.area} 카페데이트`,
      url: `${SITE.url}/date/${a.slug}`,
    })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "카페데이트", item: `${SITE.url}/date` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(regionsLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <Band tone="tint" innerClassName="py-4">
        <h1 className="text-[22px] font-black tracking-[-0.02em] text-ink sm:text-[28px]">
          ☕ <span className="text-free">전국 카페데이트</span>
        </h1>
        <AffiliateNotice className="mt-1.5" partner="coupang" />
        <p className="mt-1 text-[13.5px] text-ink-soft">
          카페 → 공원 → 맛집으로 이어지는 반나절 데이트 코스 {all.length}곳
        </p>
      </Band>

      <div className="bg-panel">
        {/* 지역 선택기 — 전국 + 시도. 기본 서울, 걸어서/차량 데이트로 나눠 미리보기 */}
        <Container className="py-6">
          <DateRegionBrowser courses={geo} areas={areas} />
        </Container>

        {/* 위치기반 — 버튼을 누르면 내 위치 기준 걷기/차량 코스 */}
        <Container className="pb-10">
          <NearbyDateCourses courses={geo} />
        </Container>

        <Container className="pb-8">
          <CoupangBanner />
        </Container>

        {/* SEO — 지역별 페이지 크롤 링크 */}
        <Container className="pb-12">
          <p className="mb-2 text-[12.5px] font-bold text-ink-faint">지역별 카페데이트</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {areas.map((a) => (
              <Link key={a.slug} href={`/date/${a.slug}`} className="text-[13px] text-ink-soft hover:text-free">
                {a.area} 카페데이트
              </Link>
            ))}
          </div>
        </Container>
      </div>
    </>
  );
}
