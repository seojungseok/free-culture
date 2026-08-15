import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getTourById, tourTypeLabel, isCampingDupe, campingDupeTarget } from "@/lib/tour";
import { getArticle } from "@/lib/articles";
import { fetchPlaceOverview, fetchPlaceImages, fetchAdmission } from "@/lib/tourDetail";
import { getAdmission } from "@/lib/fees";
import { getIntro, introRows, getInfo } from "@/lib/tourExtra";
import { nearbyPlaces, nearbyRestaurants, distanceLabel, foodTypeLabel, getRestaurantById } from "@/lib/nearby";
import TourCard from "@/components/TourCard";
import { SIDO_SLUG } from "@/lib/classify";
import { SITE } from "@/lib/site";
import { Container } from "@/components/Band";
import PlaceGallery, { type GalleryImage } from "@/components/PlaceGallery";
import ArticleBody from "@/components/ArticleBody";
import SeoulStayBanner from "@/components/SeoulStayBanner";

// 서울 숙소 제휴 배너 노출 조건 — 지역이 서울이거나 주소에 서울이 포함될 때만
const isSeoulPlace = (p: { area?: string; addr?: string }) =>
  p.area === "서울" || (p.addr || "").includes("서울");

// 상세는 방문 시점에 detailCommon2로 overview를 받아 ISR 캐시 (빌드 시 전량 프리렌더 X)
export const dynamicParams = true;
export const revalidate = 2592000; // 30일 — 상세 정보는 거의 안 바뀜(대역폭 절감). 새 글 발행 시 재배포/on-demand로 즉시 갱신

export function generateStaticParams() {
  return []; // 모든 상세는 온디맨드 생성 후 캐시
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const spot = getTourById(id);
  if (!spot) return { title: "장소를 찾을 수 없습니다" }; // 음식점은 /food/spot/[id]로 301
  const type = tourTypeLabel(spot.type);
  // 발행글 있으면 그 도입부, 없으면 TourAPI 소개글, 그것도 없으면 롱테일 템플릿
  const article = getArticle(id);
  // 소제목(##)·목록(-) 줄은 빼고 리드+문단만 → 자연스러운 description
  const articlePlain = article
    ? article.content
        .split(/\r?\n/)
        .filter((l) => l.trim() && !/^#{1,3}\s/.test(l) && !/^\s*[-*]\s/.test(l))
        .join(" ")
        .replace(/[*>`]/g, "")
        .replace(/\s+/g, " ")
        .trim()
    : "";
  const overview = articlePlain ? "" : (await fetchPlaceOverview(id)).overview;
  const base = articlePlain || overview;
  const description = base
    ? base.length > 155
      ? `${base.slice(0, 155)}…`
      : base
    : `${spot.area}에서 가볼만한 ${type}, ${spot.title}. 위치·지도·사진과 방문 정보를 확인하세요.`;
  const title = `${spot.title} — ${spot.area} 나들이·가볼만한 곳`;
  return {
    title,
    description,
    keywords: (() => {
      const gu = (spot.addr.match(/[가-힣]{2,}(?:구|군)/) || [])[0];
      // 장소명에서 구체 유형어 추출(생태공원·박물관·궁궐 등) → 검색 키워드 풍부화
      const tw = (spot.title.match(
        /생태공원|수목원|자연휴양림|박물관|미술관|과학관|기념관|전시관|식물원|동물원|아쿠아리움|테마파크|놀이공원|공원|궁궐|궁|사찰|서원|향교|시장|해수욕장|해변|계곡|폭포|전망대|캠핑장|체험관|문화원|아트센터|도서관|호수|저수지/
      ) || [])[0];
      return [
        `${spot.area} ${tw || type}`,
        ...(tw ? [tw] : []),
        gu ? `${gu} 가볼만한 곳` : `${spot.area} 가볼만한 곳`,
        `${spot.area} 나들이`,
        spot.title,
      ];
    })(),
    alternates: { canonical: `/places/spot/${id}` },
    openGraph: {
      title,
      description,
      ...(spot.image ? { images: [{ url: spot.image }] } : {}),
    },
  };
}

export default async function SpotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // 캠핑으로 분리된 장소 → /camping 상세로 영구 이동(색인 이전)
  if (isCampingDupe(id)) {
    const t = campingDupeTarget(id);
    permanentRedirect(t ? `/camping/${t}` : "/camping");
  }
  const spot = getTourById(id);
  if (!spot) {
    // 음식점은 맛집 탐방으로 이관 → 예전 주소는 새 주소로 영구 이동(색인 이전)
    if (getRestaurantById(id)) permanentRedirect(`/food/spot/${id}`);
    notFound();
  }

  const article = getArticle(id); // 발행된 자체 소개글(있으면 본문으로)

  // 방문 팁·볼거리: 미리 수집한 캐시로만 서빙(런타임 API 호출 없음)
  const tipRows = introRows(id);
  const facilities = getInfo(id);
  // 주변 나들이 장소·맛집: 좌표 거리 계산(결정론적, 사실만)
  const nearPlaces = nearbyPlaces(spot, 5);
  const nearFood = nearbyRestaurants(spot, 3);
  // 입장료: 캐시 우선(intro → fees) → 없을 때만 런타임 조회(ISR 1주 캐시)
  const cachedAdmission = getIntro(id)?.admission ?? getAdmission(id);

  const [detail, extraImages, admission] = await Promise.all([
    fetchPlaceOverview(id),
    fetchPlaceImages(id),
    cachedAdmission ? Promise.resolve(cachedAdmission) : fetchAdmission(id, spot.type),
  ]);
  const overview = detail.overview;
  const homepage = detail.homepage;
  const tel = detail.tel || spot.tel;
  const admissionLabel =
    admission === "free" ? "무료" : admission === "paid" ? "유료" : "정보 없음 — 방문 전 확인 권장";

  // 갤러리 = 대표사진(firstimage) + 추가사진, URL 기준 중복 제거
  const gallery: GalleryImage[] = [];
  const seen = new Set<string>();
  if (spot.image) {
    gallery.push({ full: spot.image, thumb: spot.image });
    seen.add(spot.image);
  }
  for (const img of extraImages) {
    if (seen.has(img.full)) continue;
    seen.add(img.full);
    gallery.push(img);
  }

  const hasMap = Boolean(spot.mapx && spot.mapy);
  const mapUrl = hasMap
    ? `https://map.kakao.com/link/map/${encodeURIComponent(spot.title)},${spot.mapy},${spot.mapx}`
    : undefined;
  const areaSlug = (SIDO_SLUG as Record<string, string>)[spot.area];
  const canonical = `${SITE.url}/places/spot/${id}`;

  // 구조화 데이터 — 관광 명소(TouristAttraction) + 빵부스러기
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: spot.title,
    description:
      (article ? article.content.replace(/[#*>`-]/g, " ").replace(/\s+/g, " ").trim() : overview) ||
      `${spot.area}에서 가볼만한 ${tourTypeLabel(spot.type)}, ${spot.title}`,
    image: gallery.slice(0, 6).map((g) => g.full),
    address: {
      "@type": "PostalAddress",
      addressRegion: spot.area,
      streetAddress: spot.addr,
      addressCountry: "KR",
    },
    ...(hasMap
      ? { geo: { "@type": "GeoCoordinates", latitude: spot.mapy, longitude: spot.mapx } }
      : {}),
    ...(admission === "free" ? { isAccessibleForFree: true } : {}),
    url: canonical,
    ...(homepage ? { sameAs: homepage } : {}),
    ...(tel ? { telephone: tel } : {}),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "나들이", item: `${SITE.url}/places` },
      { "@type": "ListItem", position: 2, name: spot.area, item: `${SITE.url}/places/${areaSlug}` },
      { "@type": "ListItem", position: 3, name: spot.title, item: canonical },
    ],
  };

  return (
    <Container className="max-w-[820px] pb-16 pt-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <nav className="mb-3 flex flex-wrap items-center gap-1 text-[12.5px] text-ink-faint">
        <Link href="/places" className="hover:text-free">나들이</Link>
        <span>›</span>
        {areaSlug ? (
          <Link href={`/places/${areaSlug}`} className="hover:text-free">{spot.area}</Link>
        ) : (
          <span>{spot.area}</span>
        )}
      </nav>

      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md bg-tint px-2 py-0.5 text-[11px] font-bold text-freedark">
          {tourTypeLabel(spot.type)}
        </span>
        <span className="text-[12.5px] text-ink-faint">{spot.area}</span>
      </div>
      <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
        {spot.title}
      </h1>

      {gallery.length > 0 && (
        <div className="mt-4">
          <PlaceGallery images={gallery} title={spot.title} freeBadge={admission === "free"} />
        </div>
      )}

      {article ? (
        // 본문 소제목마다 사진 한 장씩 — 대표사진은 위 갤러리에 이미 크게 있으므로 2번째부터 사용
        <ArticleBody content={article.content} images={gallery.slice(1).map((g) => g.full)} title={spot.title} />
      ) : overview ? (
        <p className="mt-5 whitespace-pre-line text-[15px] leading-[1.8] text-ink-soft">
          {overview}
        </p>
      ) : (
        <p className="mt-5 text-[15px] leading-[1.8] text-ink-faint">
          {spot.area} {spot.addr}에 위치한 {tourTypeLabel(spot.type)}입니다. 방문 전 지도와 홈페이지에서 상세 정보를 확인하세요.
        </p>
      )}

      <dl className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white">
        <div className="flex gap-3 px-4 py-3">
          <dt className="w-14 shrink-0 text-[13px] font-bold text-ink-faint">입장료</dt>
          <dd className="min-w-0 flex-1 text-[14px]">
            {admission === "free" ? (
              <span className="font-bold text-free">무료</span>
            ) : admission === "paid" ? (
              <span className="font-semibold text-ink">유료</span>
            ) : (
              <span className="text-ink-faint">{admissionLabel}</span>
            )}
          </dd>
        </div>
        {spot.addr && <Row label="주소" value={spot.addr} />}
        {tel && <Row label="전화" value={tel} />}
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

      {/* 서울 숙소 제휴 배너 — 서울 장소에서만 (광고, 위아래 여백 확보) */}
      {isSeoulPlace(spot) && (
        <div className="my-8">
          <SeoulStayBanner />
        </div>
      )}

      {/* 방문 정보 (detailIntro2 캐시) — 이용시간·휴무일·주차·요금 등 */}
      {tipRows.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-[16px] font-extrabold text-ink">🧭 방문 정보</h2>
          <dl className="divide-y divide-line rounded-2xl border border-line bg-white">
            {tipRows.map((r) => (
              <div key={r.label} className="flex gap-3 px-4 py-3">
                <dt className="w-16 shrink-0 text-[13px] font-bold text-ink-faint">{r.label}</dt>
                <dd className="min-w-0 flex-1 whitespace-pre-line text-[14px] text-ink">{r.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* 볼거리·시설 (detailInfo2 캐시) — 부대시설·세부 안내 */}
      {facilities.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-[16px] font-extrabold text-ink">🖼️ 볼거리·시설</h2>
          <div className="space-y-2.5">
            {facilities.map((f, i) => (
              <div key={i} className="rounded-2xl border border-line bg-white px-4 py-3">
                {f.name && <div className="text-[14px] font-bold text-ink">{f.name}</div>}
                {f.text && <p className="mt-0.5 whitespace-pre-line text-[13.5px] leading-[1.7] text-ink-soft">{f.text}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 주변에서 식사하기 (좌표 거리 계산, restaurants.json) */}
      {nearFood.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-[16px] font-extrabold text-ink">🍽️ 주변에서 식사하기</h2>
          <div className="divide-y divide-line rounded-2xl border border-line bg-white">
            {nearFood.map((r) => (
              <Link key={r.id} href={`/food/spot/${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-tint/40">
                <span className="min-w-0 flex-1">
                  <span className="text-[14px] font-bold text-ink">{r.title}</span>
                  <span className="ml-1.5 text-[12px] text-ink-faint">{foodTypeLabel(r)}</span>
                </span>
                <span className="shrink-0 text-[12.5px] font-semibold text-free">{distanceLabel(r.dist)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 주변 나들이 장소 (같은 지역, 가까운 순) */}
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
          href={areaSlug ? `/places/${areaSlug}` : "/places"}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:border-free/40 hover:text-free"
        >
          {spot.area} 다른 곳 보기 →
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
