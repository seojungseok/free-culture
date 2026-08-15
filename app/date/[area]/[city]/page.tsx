import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Band, Container } from "@/components/Band";
import CoupangBanner from "@/components/CoupangBanner";
import {
  dateCoursesByCity, dateCityCounts, dateCityParams, distLabel, sidoFromSlug,
} from "@/lib/dateCourses";
import { getRestaurantMenu } from "@/lib/tourExtra";
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

  const siblings = dateCityCounts(sido).filter((c) => c.city !== city).slice(0, 12);

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
        <p className="mt-1 text-[13.5px] text-ink-soft">
          카페를 고르면 공원·맛집까지 이어지는 코스가 나와요 · {list.length}곳
        </p>
      </Band>

      <div className="bg-panel">
        <Container className="pb-12 pt-4">
          {/* 카페 목록 — 모바일에서 한 손으로 고르기 좋게 세로 리스트 */}
          <ul className="space-y-2">
            {list.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/date/c/${c.id}`}
                  className="flex min-h-[76px] items-center gap-3 rounded-2xl border border-line bg-white p-2.5 transition active:scale-[0.99] hover:border-free/50"
                >
                  <span className="relative h-[62px] w-[62px] shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                    {c.cafe.image ? (
                      <Image src={c.cafe.image} alt={`${c.cafe.title} 카페`} fill sizes="62px" className="object-cover" loading="lazy" unoptimized />
                    ) : (
                      <span className="flex h-full items-center justify-center text-xl">☕</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15.5px] font-bold text-ink">{c.cafe.title}</span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-ink-soft">
                      🌳 {c.park.title} · 🍽 {c.food.title}
                      {(() => { const m = getRestaurantMenu(c.food.id); return m ? <span className="text-ink-faint">({m.split(" / ")[0]})</span> : null; })()}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-ink-faint">
                      도보 {c.walkMin}분 · 총 {distLabel(c.totalKm)}
                    </span>
                  </span>
                  <span className="shrink-0 pr-1 text-[18px] leading-none text-ink-faint">›</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* 관심 기반 제휴 배너 (쿠팡 파트너스) */}
          <div className="mt-8">
            <CoupangBanner />
          </div>

          {siblings.length > 0 && (
            <section className="mt-8 border-t border-line pt-5">
              <h2 className="mb-2.5 text-[14px] font-extrabold text-ink">{sido} 다른 동네</h2>
              <div className="flex flex-wrap gap-1.5">
                {siblings.map((s) => (
                  <Link key={s.city} href={`/date/${slug}/${encodeURIComponent(s.city)}`}
                    className="rounded-full border border-line bg-white px-3 py-1.5 text-[12.5px] text-ink-soft hover:border-free hover:text-free">
                    {s.city} <span className="text-ink-faint">{s.count}</span>
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
