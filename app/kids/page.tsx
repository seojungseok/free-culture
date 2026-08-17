import type { Metadata } from "next";
import { Band, Container } from "@/components/Band";
import AffiliateNotice from "@/components/AffiliateNotice";
import KidCoursesBrowser from "@/components/KidCoursesBrowser";
import KidCoupangDeals from "@/components/KidCoupangDeals";
import { getKidSpots, kidSpotsLite, kidAreaCounts } from "@/lib/kidCourses";
import { SITE } from "@/lib/site";

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  const n = getKidSpots().length;
  const title = `아이와 함께 — 테마·지역별 아이와 갈만한 곳 ${n.toLocaleString()}곳`;
  const description = `동물원·과학관·수목원·놀이공원부터 아이 공연·전시까지, 테마와 지역으로 골라보는 아이와 함께 나들이 ${n.toLocaleString()}곳. 비 오는 날 실내 코스도 한 번에.`;
  return {
    title,
    description,
    keywords: ["아이와 갈만한 곳", "아이랑 가볼만한 곳", "아이와 함께", "실내 아이와", "비오는날 아이와", "가족 나들이", "아이 체험", "키즈 나들이", "아이 데리고 갈만한 곳"],
    alternates: { canonical: "/kids" },
    openGraph: { title, description, url: `${SITE.url}/kids`, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default function KidsPage() {
  const spots = kidSpotsLite();
  const areas = kidAreaCounts();

  const collectionLd = {
    "@context": "https://schema.org", "@type": "CollectionPage",
    name: "아이와 함께 갈만한 곳",
    description: `테마·지역별 아이와 나들이 명소 ${spots.length}곳`,
    url: `${SITE.url}/kids`,
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "아이와 함께", item: `${SITE.url}/kids` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* 히어로 */}
      <Band tone="tint" innerClassName="py-6">
        <div className="flex items-center gap-1.5 text-[22px]">
          <span>🦁</span><span>🎡</span><span>🔬</span><span>🌳</span><span>🎪</span>
        </div>
        <h1 className="mt-2 text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[32px]">
          아이와 <span className="text-free">함께</span>
        </h1>
        <AffiliateNotice className="mt-1.5" partner="coupang" />
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
          동물원·과학관·수목원·놀이공원부터 아이 공연·전시까지.
          <br className="hidden sm:block" />
          테마와 지역을 골라 오늘 아이와 어디 갈지 정해보세요.
        </p>
      </Band>

      <div className="bg-panel">
        {/* 테마·지역 선택기 (기본 서울) */}
        <Container className="py-6">
          <KidCoursesBrowser spots={spots} areas={areas} />
        </Container>

        {/* 쿠팡 4줄 — 장난감·피크닉·특가·생활용품 */}
        <Container className="pb-12 pt-2">
          <div className="mb-4 border-t border-line pt-8">
            <h2 className="text-[19px] font-extrabold text-ink">🛒 아이와 나들이, 이런 것도 챙겨요</h2>
            <p className="mt-1 text-[13px] text-ink-faint">장난감부터 피크닉·생활용품까지</p>
          </div>
          <KidCoupangDeals />
        </Container>
      </div>
    </>
  );
}
