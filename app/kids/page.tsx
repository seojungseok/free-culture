import type { Metadata } from "next";
import Link from "next/link";
import { Band, Container } from "@/components/Band";
import KidCoursesBrowser from "@/components/KidCoursesBrowser";
import { kidCoursesLite, kidAreaCounts } from "@/lib/kidCourses";
import { SITE } from "@/lib/site";
import { getKidTours } from "@/lib/tour";
import { hasSubstantivePlaceInfo } from "@/lib/placeQuality";
import { SIDO_SLUG } from "@/lib/classify";

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  const title = "아이와 가볼 만한 곳 | 지역별 장소와 테마 코스";
  const description = "서울·경기·부산·제주에서 아이와 갈 장소를 지역별로 살펴보세요. 동물·놀이·배움·자연 테마 코스는 하루 일정 후보로 비교할 수 있습니다.";
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
  const courses = kidCoursesLite();
  const areas = kidAreaCounts();
  const featuredRegions = ["서울", "경기", "부산", "제주"].map((area) => ({
    area,
    slug: (SIDO_SLUG as Record<string, string>)[area],
    places: getKidTours(area).filter((place) => place.image && place.addr && hasSubstantivePlaceInfo(place.id)).slice(0, 3),
  })).filter((region) => region.slug && region.places.length === 3);

  const collectionLd = {
    "@context": "https://schema.org", "@type": "CollectionPage",
    name: "아이와 함께 테마별 코스",
    description: `테마·지역별 아이와 함께 코스 ${courses.length}개`,
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
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
          지역별 아이 동반 장소를 먼저 살펴보고, 테마 코스로 하루 일정을 비교해 보세요.
          <br className="hidden sm:block" />
          이동거리와 운영 조건은 각 장소 상세에서 확인하세요.
        </p>
      </Band>

      <div className="bg-panel">
        {featuredRegions.length > 0 && <Container className="pt-6">
          <h2 className="text-xl font-extrabold text-ink">지역별 아이와 가볼 만한 곳</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">방문 정보가 있는 장소를 골랐습니다. 행사와 다른 장소는 지역 페이지에서 함께 볼 수 있어요.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {featuredRegions.map((region) => <section key={region.area} className="rounded-2xl border border-line bg-white p-4">
              <h3 className="font-bold text-ink">{region.area} 아이와 나들이</h3>
              <ul className="mt-2 space-y-2 text-sm">{region.places.map((place) => <li key={place.id}><Link href={`/places/spot/${place.id}`} className="font-semibold text-brandblue hover:underline">{place.title} →</Link><span className="ml-2 text-xs text-ink-faint">{place.addr}</span></li>)}</ul>
              <Link href={`/region/${region.slug}#kids`} className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-brandblue">{region.area} 아이와 장소·행사 더 보기 →</Link>
            </section>)}
          </div>
        </Container>}
        {/* 테마·지역 선택기 (기본 서울) */}
        <Container className="py-6">
          <KidCoursesBrowser courses={courses} areas={areas} />
        </Container>

      </div>
    </>
  );
}
