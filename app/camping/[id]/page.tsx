import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCamp, type Camp } from "@/lib/camping";
import { campingStory } from "@/lib/campingStory";
import { nearbyPlaces, nearbyRestaurants, distanceLabel, foodTypeLabel } from "@/lib/nearby";
import { SIDO_SLUG } from "@/lib/classify";
import { SITE } from "@/lib/site";
import { Container } from "@/components/Band";
import AffiliateNotice from "@/components/AffiliateNotice";
import TourCard from "@/components/TourCard";
import CoupangDeals from "@/components/CoupangDeals";
import CampEssentialPeek from "@/components/CampEssentialPeek";
import CampNoFireFood from "@/components/CampNoFireFood";

export const dynamicParams = true;
export const revalidate = 2592000; // 30일 — 캠핑장 정보 거의 불변(대역폭 절감)
export function generateStaticParams() { return []; }

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const c = getCamp(id);
  if (!c) return { title: "캠핑장을 찾을 수 없습니다" };
  const type = c.types[0] || "캠핑장";
  const region = [c.area, c.sigungu].filter(Boolean).join(" ");
  const facs = Object.entries(c.facilities).filter(([, v]) => v).map(([k]) => k);
  return {
    title: `${c.name} - ${region} ${type} · ${SITE.name}`,
    description: `${region}의 ${type} 캠핑장 ${c.name}. ${facs.length ? facs.slice(0, 4).join("·") + " 등 시설" : "시설"}${c.pet ? " · 반려동물 동반 가능" : ""}. 요금·예약·지도 정보를 확인하세요.`,
    keywords: [`${c.area} ${type}`, `${c.sigungu} 캠핑장`, `${c.area} 캠핑장`, c.pet ? `${c.area} 반려동물 캠핑장` : "", c.name].filter((k) => k && k.trim()),
    alternates: { canonical: `/camping/${id}` },
    openGraph: { title: `${c.name} - ${region} ${type}`, ...(c.image ? { images: [{ url: c.image }] } : {}) },
  };
}

export default async function CampDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getCamp(id);
  if (!c) notFound();

  const region = [c.area, c.sigungu].filter(Boolean).join(" ");
  const facs = Object.entries(c.facilities).filter(([, v]) => v).map(([k]) => k);
  const hasMap = Boolean(c.mapx && c.mapy);
  const mapUrl = hasMap ? `https://map.kakao.com/link/map/${encodeURIComponent(c.name)},${c.mapy},${c.mapx}` : undefined;
  const areaSlug = (SIDO_SLUG as Record<string, string>)[c.area];
  const spotLike = { id: c.id, area: c.area, mapx: c.mapx, mapy: c.mapy } as unknown as Parameters<typeof nearbyPlaces>[0];
  const nearPlaces = nearbyPlaces(spotLike, 6);
  const nearFood = nearbyRestaurants({ area: c.area, mapx: c.mapx, mapy: c.mapy }, 3);
  const story = campingStory({
    camp: c,
    region,
    facilities: facs,
    nearFood: nearFood.map((r) => r.title),
    nearPlaces: nearPlaces.map((p) => p.title),
  });

  // 본문 중간에 끼울 카드 두 장의 위치. 붙어 나오면 광고 띠처럼 보이므로 사이를 벌린다.
  //  · 생필품(짐 싸기)   — 글을 읽기 시작한 직후
  //  · 발열도시락(먹거리) — 좀 더 내려간 자리
  const peekAfter = story.length >= 4 ? 1 : Math.max(0, Math.floor(story.length / 2) - 1);
  const foodAfter = story.length >= 6 ? story.length - 3 : -1;

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Campground",
    name: c.name,
    ...(c.image ? { image: [c.image] } : {}),
    address: { "@type": "PostalAddress", addressRegion: c.area, addressLocality: c.sigungu, streetAddress: c.addr, addressCountry: "KR" },
    ...(hasMap ? { geo: { "@type": "GeoCoordinates", latitude: c.mapy, longitude: c.mapx } } : {}),
    ...(c.tel ? { telephone: c.tel } : {}),
    ...(c.homepage ? { url: c.homepage } : {}),
    amenityFeature: [
      ...facs.map((f) => ({ "@type": "LocationFeatureSpecification", name: f, value: true })),
      { "@type": "LocationFeatureSpecification", name: "반려동물 동반", value: c.pet },
    ],
  };
  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "캠핑", item: `${SITE.url}/camping` },
      { "@type": "ListItem", position: 2, name: c.area, item: `${SITE.url}/camping?area=${encodeURIComponent(c.area)}` },
      { "@type": "ListItem", position: 3, name: c.name, item: `${SITE.url}/camping/${id}` },
    ],
  };

  return (
    <Container className="max-w-[820px] pb-16 pt-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <nav className="mb-3 flex flex-wrap items-center gap-1 text-[12.5px] text-ink-faint">
        <Link href="/camping" className="hover:text-free">캠핑</Link>
        <span>›</span>
        <Link href={`/camping?area=${encodeURIComponent(c.area)}`} className="hover:text-free">{c.area}</Link>
      </nav>

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {c.types.map((t) => (
          <span key={t} className="rounded-md bg-tint px-2 py-0.5 text-[11px] font-bold text-freedark">⛺ {t}</span>
        ))}
        {c.pet && <span className="rounded-md bg-free/10 px-2 py-0.5 text-[11px] font-bold text-freedark">🐾 반려동물</span>}
      </div>
      <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">{c.name}</h1>
        <AffiliateNotice className="mt-1.5" partner="coupang" />
      <p className="mt-1 text-[13px] text-ink-faint">{region}</p>

      {c.image && (
        <div className="relative mt-4 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/[0.04]">
          <Image src={c.image} alt={c.name} fill sizes="820px" className="object-cover" unoptimized priority />
        </div>
      )}

      {facs.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {facs.map((f) => (
            <span key={f} className="rounded-full border border-line bg-white px-3 py-1 text-[13px] font-semibold text-ink-soft">{f}</span>
          ))}
        </div>
      )}

      {/* 소개글 — 구조화 데이터로 조합한 읽을거리(네이버블로그식 여백) */}
      <section className="mt-6">
        <h2 className="mb-3 flex items-center gap-1.5 text-[17px] font-extrabold text-ink">
          <span>📖</span> 이런 곳이에요
        </h2>
        <div className="space-y-4 text-[15px] leading-[1.85] text-ink-soft">
          {story.map((para, i) => (
            <div key={i}>
              <p>{para}</p>
              {/* 글 "중간"에 생필품 카드 1개 — 맨 아래 배너는 그냥 지나쳐 버리기 때문.
                  읽던 흐름이 끊기지 않게 문단 사이(2번째 문단 뒤)에 딱 한 번만. */}
              {i === peekAfter && <CampEssentialPeek seed={c.id} />}
              {i === foodAfter && <CampNoFireFood seed={c.id} />}
            </div>
          ))}
        </div>
      </section>

      <dl className="mt-7 divide-y divide-line rounded-2xl border border-line bg-white">
        {c.addr && <Row label="주소" value={c.addr} />}
        {c.tel && <Row label="전화" value={c.tel} />}
        {c.operPd && <Row label="운영기간" value={c.operPd} />}
        {c.resve && <Row label="예약" value={c.resve} />}
        <Row label="반려동물" value={c.petRaw || (c.pet ? "가능" : "정보 없음")} />
        {c.homepage && (
          <div className="flex gap-3 px-4 py-3">
            <dt className="w-16 shrink-0 text-[13px] font-bold text-ink-faint">홈페이지</dt>
            <dd className="min-w-0 flex-1 break-all text-[14px]"><a href={c.homepage} target="_blank" rel="noopener noreferrer" className="text-free underline underline-offset-2 hover:text-freedark">{c.homepage}</a></dd>
          </div>
        )}
      </dl>

      <p className="mt-3 rounded-xl bg-tint/60 px-4 py-3 text-[13px] text-ink-soft">⚠️ 시설·요금·운영은 바뀔 수 있어요. 방문 전 예약처·공식 채널에서 다시 확인해 주세요.</p>

      <div className="mt-5 flex flex-wrap gap-2.5">
        {mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-free px-5 py-2.5 text-sm font-bold text-white transition hover:bg-freedark">🗺️ 카카오맵 길찾기</a>}
        <Link href={`/camping?area=${encodeURIComponent(c.area)}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:border-free/40 hover:text-free">{c.area} 다른 캠핑장 →</Link>
      </div>

      {/* 계절별 캠핑용품 추천 (쿠팡 오픈 API 수집) — 상단 AffiliateNotice가 고지 담당 */}
      <CoupangDeals />

      {nearFood.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-[16px] font-extrabold text-ink">🍽️ 주변에서 식사하기</h2>
          <div className="divide-y divide-line rounded-2xl border border-line bg-white">
            {nearFood.map((r) => (
              <Link key={r.id} href={`/food/spot/${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-tint/40">
                <span className="min-w-0 flex-1"><span className="text-[14px] font-bold text-ink">{r.title}</span><span className="ml-1.5 text-[12px] text-ink-faint">{foodTypeLabel(r)}</span></span>
                <span className="shrink-0 text-[12.5px] font-semibold text-free">{distanceLabel(r.dist)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {nearPlaces.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-[16px] font-extrabold text-ink">📍 주변 관광지</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 md:grid-cols-6">
            {nearPlaces.map((p) => <TourCard key={p.id} spot={p} />)}
          </div>
        </section>
      )}

      <p className="mt-8 text-[12px] text-ink-faint">캠핑정보 제공: 한국관광공사 고캠핑</p>
    </Container>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <dt className="w-16 shrink-0 text-[13px] font-bold text-ink-faint">{label}</dt>
      <dd className="min-w-0 flex-1 text-[14px] text-ink">{value}</dd>
    </div>
  );
}

export type { Camp };
