import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPlaceOverview, fetchPlaceImages } from "@/lib/tourDetail";
import {
  restaurantIntroRows, getRestaurantPhone, getRestaurantMenu, restaurantOpeningSpec, restaurantSummary,
} from "@/lib/tourExtra";
import { nearbyPlaces, foodTypeLabel, getRestaurantById, type Restaurant } from "@/lib/nearby";
import TourCard from "@/components/TourCard";
import { SIDO_SLUG } from "@/lib/classify";
import { SITE } from "@/lib/site";
import { Container } from "@/components/Band";
import DetailGuidance from "@/components/DetailGuidance";
import PlaceGallery, { type GalleryImage } from "@/components/PlaceGallery";

// 음식점 상세 — 맛집 탐방(/food) 소속. 예전 주소(/places/spot/[id])는 여기로 301.
export const dynamicParams = true;
export const revalidate = 2592000; // 30일 — 음식점 정보는 거의 안 바뀜(대역폭 절감)

export function generateStaticParams() {
  return []; // 모든 상세는 온디맨드 생성 후 캐시
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const r = getRestaurantById(id);
  if (!r) return { title: "맛집을 찾을 수 없습니다" };
  const food = foodTypeLabel(r);
  const gu = (r.addr.match(/[가-힣]{2,}(?:구|군)/) || [])[0];
  const title = `${r.title} — ${r.area} ${food} 맛집`;
  // 수집된 영업정보(영업시간·메뉴 등)가 있으면 메타 설명에 그대로 반영 → 롱테일 키워드·정보성 강화
  const summary = restaurantSummary(id);
  const description = summary
    ? `${gu ? `${r.area} ${gu}` : r.area} ${food} ${r.title}. ${summary}. 위치·지도·연락처를 확인하세요.`
    : `${r.area} ${r.addr}에 위치한 ${food} ${r.title}. 위치·지도·연락처와 주변 나들이 장소를 확인하세요.`;
  return {
    title,
    description,
    keywords: [
      `${r.area} ${food}`,
      gu ? `${gu} 맛집` : `${r.area} 맛집`,
      `${r.title}`,
      `${r.area} 맛집`,
    ],
    alternates: { canonical: `/food/spot/${id}` },
    openGraph: { title, description, ...(r.image ? { images: [{ url: r.image }] } : {}) },
  };
}

export default async function FoodSpotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = getRestaurantById(id);
  if (!r) notFound();
  return <RestaurantDetail r={r} />;
}

// 나들이 상세와 동일 톤. overview·사진만 런타임(detailCommon2/detailImage2, ISR 캐시) 조회.
async function RestaurantDetail({ r }: { r: Restaurant }) {
  const food = foodTypeLabel(r);
  const [detail, extraImages] = await Promise.all([
    fetchPlaceOverview(r.id),
    fetchPlaceImages(r.id),
  ]);
  const overview = detail.overview;
  const homepage = detail.homepage;
  // 전화: detailCommon2 → 목록 tel → detailIntro 문의처(infocenterfood) 순
  const tel = detail.tel || r.tel || getRestaurantPhone(r.id);
  const telHref = tel ? (tel.match(/[\d+][\d\-]+\d/) || [])[0]?.replace(/-/g, "") : undefined;
  // 영업정보(수집분만) — 영업시간·휴무·주차·대표메뉴. 없으면 표 자체 숨김
  const bizRows = restaurantIntroRows(r.id);

  // 갤러리 = 대표사진 + 추가사진(중복 제거)
  const gallery: GalleryImage[] = [];
  const seen = new Set<string>();
  if (r.image) { gallery.push({ full: r.image, thumb: r.image }); seen.add(r.image); }
  for (const img of extraImages) {
    if (seen.has(img.full)) continue;
    seen.add(img.full);
    gallery.push(img);
  }

  const hasMap = Boolean(r.mapx && r.mapy);
  const mapUrl = hasMap
    ? `https://map.kakao.com/link/map/${encodeURIComponent(r.title)},${r.mapy},${r.mapx}`
    : undefined;
  const areaSlug = (SIDO_SLUG as Record<string, string>)[r.area];
  const canonical = `${SITE.url}/food/spot/${r.id}`;
  const nearPlaces = nearbyPlaces(r, 5);

  const openingHoursSpec = restaurantOpeningSpec(r.id);
  const menu = getRestaurantMenu(r.id);
  const bizSummary = restaurantSummary(r.id);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: r.title,
    servesCuisine: food,
    description: overview || `${r.area}에 위치한 ${food} ${r.title}`,
    image: gallery.slice(0, 6).map((g) => g.full),
    address: {
      "@type": "PostalAddress",
      addressRegion: r.area,
      streetAddress: r.addr,
      addressCountry: "KR",
    },
    ...(hasMap ? { geo: { "@type": "GeoCoordinates", latitude: r.mapy, longitude: r.mapx } } : {}),
    url: canonical,
    ...(homepage ? { sameAs: homepage } : {}),
    ...(tel ? { telephone: tel } : {}),
    ...(openingHoursSpec ? { openingHoursSpecification: openingHoursSpec } : {}),
    ...(menu ? { hasMenu: { "@type": "Menu", name: `${r.title} 대표메뉴`, description: menu } } : {}),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "맛집 탐방", item: `${SITE.url}/food` },
      { "@type": "ListItem", position: 2, name: r.area, item: `${SITE.url}/food/${areaSlug}` },
      { "@type": "ListItem", position: 3, name: r.title, item: canonical },
    ],
  };

  return (
    <Container className="max-w-[820px] pb-16 pt-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <nav className="mb-3 flex flex-wrap items-center gap-1 text-[12.5px] text-ink-faint">
        <Link href="/food" className="hover:text-free">맛집 탐방</Link>
        <span>›</span>
        {areaSlug ? (
          <Link href={`/food/${areaSlug}`} className="hover:text-free">{r.area}</Link>
        ) : (
          <span>{r.area}</span>
        )}
      </nav>

      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md bg-tint px-2 py-0.5 text-[11px] font-bold text-freedark">🍽️ {food}</span>
        <span className="text-[12.5px] text-ink-faint">{r.area}</span>
      </div>
      <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">{r.title}</h1>

      {gallery.length > 0 && (
        <div className="mt-4">
          <PlaceGallery images={gallery} title={r.title} />
        </div>
      )}

      {overview ? (
        <p className="mt-5 whitespace-pre-line text-[15px] leading-[1.8] text-ink-soft">{overview}</p>
      ) : (
        <p className="mt-5 text-[15px] leading-[1.8] text-ink-soft">
          {r.area} {r.addr}에 위치한 {food} <b className="font-bold text-ink">{r.title}</b>입니다.
          {bizSummary && <> {bizSummary}.</>}{" "}
          방문 전 지도와 연락처로 영업 여부를 확인하세요.
        </p>
      )}

      <dl className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white">
        <Row label="업종" value={food} />
        {r.addr && <Row label="주소" value={r.addr} />}
        {tel && (
          <div className="flex gap-3 px-4 py-3">
            <dt className="w-14 shrink-0 text-[13px] font-bold text-ink-faint">전화</dt>
            <dd className="min-w-0 flex-1 text-[14px]">
              {telHref ? (
                <a href={`tel:${telHref}`} className="font-semibold text-free underline underline-offset-2 hover:text-freedark">
                  {tel}
                </a>
              ) : (
                <span className="text-ink">{tel}</span>
              )}
            </dd>
          </div>
        )}
        {homepage && (
          <div className="flex gap-3 px-4 py-3">
            <dt className="w-14 shrink-0 text-[13px] font-bold text-ink-faint">홈페이지</dt>
            <dd className="min-w-0 flex-1 break-all text-[14px]">
              <a href={homepage} target="_blank" rel="noopener noreferrer" className="text-free underline underline-offset-2 hover:text-freedark">
                {homepage}
              </a>
            </dd>
          </div>
        )}
      </dl>

      {/* 영업 정보 (detailIntro2 수집분) — 값 있는 항목만 */}
      {bizRows.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-[16px] font-extrabold text-ink">🕒 영업 정보</h2>
          <dl className="divide-y divide-line rounded-2xl border border-line bg-white">
            {bizRows.map((row) => (
              <div key={row.label} className="flex gap-3 px-4 py-3">
                <dt className="w-16 shrink-0 text-[13px] font-bold text-ink-faint">{row.label}</dt>
                <dd className="min-w-0 flex-1 whitespace-pre-line text-[14px] text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <p className="mt-3 rounded-xl bg-tint/50 px-4 py-3 text-[13px] leading-[1.6] text-ink-soft">
        영업시간·휴무는 바뀔 수 있어요. 방문 전 전화나 지도로 <b className="font-bold text-ink">영업 여부를 확인</b>하시길 권해요.
      </p>

      <DetailGuidance
        recommended={[`${r.area}에서 ${food} 정보를 찾는 분`, "메뉴와 영업정보를 확인한 뒤 방문하려는 분"]}
        checks={["영업시간·휴무는 바뀔 수 있으니 방문 전 전화나 공식 안내를 확인해 주세요.", homepage ? "메뉴와 운영 정보는 안내된 홈페이지에서 최신 내용을 확인해 주세요." : "대표 메뉴와 가격은 매장이나 공식 안내에서 확인해 주세요.", tel ? `문의가 필요하면 안내된 전화번호(${tel})로 확인해 주세요.` : "전화번호가 없으면 지도에 표시된 최신 정보를 확인해 주세요."]}
        tips={["주소를 지도에 저장하고 주차·대중교통 이용 방법을 출발 전에 확인해 주세요.", "방문 시점에 따라 대표 메뉴와 제공 여부가 달라질 수 있습니다."]}
      />

      {nearPlaces.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-[16px] font-extrabold text-ink">📍 주변 나들이 장소</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 md:grid-cols-5">
            {nearPlaces.map((p) => (
              <TourCard key={p.id} spot={p} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-2.5">
        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-free px-5 py-2.5 text-sm font-bold text-white transition hover:bg-freedark"
          >
            🗺️ 카카오맵 길찾기
          </a>
        )}
        <Link
          href={areaSlug ? `/food/${areaSlug}` : "/food"}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:border-free/40 hover:text-free"
        >
          {r.area} 맛집 더 보기 →
        </Link>
      </div>

      <p className="mt-8 text-[12px] text-ink-faint">관광정보 제공: 한국관광공사 (TourAPI)</p>
    </Container>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <dt className="w-14 shrink-0 text-[13px] font-bold text-ink-faint">{label}</dt>
      <dd className="min-w-0 flex-1 text-[14px] text-ink">{value}</dd>
    </div>
  );
}
