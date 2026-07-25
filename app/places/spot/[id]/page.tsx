import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTourById, tourTypeLabel } from "@/lib/tour";
import { getArticle } from "@/lib/articles";
import { fetchPlaceOverview, fetchPlaceImages } from "@/lib/tourDetail";
import { SIDO_SLUG } from "@/lib/classify";
import { SITE } from "@/lib/site";
import { Container } from "@/components/Band";
import PlaceGallery, { type GalleryImage } from "@/components/PlaceGallery";
import ArticleBody from "@/components/ArticleBody";

// 상세는 방문 시점에 detailCommon2로 overview를 받아 ISR 캐시 (빌드 시 전량 프리렌더 X)
export const dynamicParams = true;
export const revalidate = 604800; // 1주

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
  if (!spot) return { title: "장소를 찾을 수 없습니다" };
  const type = tourTypeLabel(spot.type);
  // 발행글 있으면 그 도입부, 없으면 TourAPI 소개글, 그것도 없으면 롱테일 템플릿
  const article = getArticle(id);
  const articlePlain = article
    ? article.content.replace(/[#*>`-]/g, " ").replace(/\s+/g, " ").trim()
    : "";
  const overview = articlePlain ? "" : (await fetchPlaceOverview(id)).overview;
  const base = articlePlain || overview;
  const description = base
    ? base.length > 155
      ? `${base.slice(0, 155)}…`
      : base
    : `${spot.area}에서 가볼만한 ${type}, ${spot.title}. 위치·지도·사진과 방문 정보를 확인하세요.`;
  const title = `${spot.title} — ${spot.area} 가볼만한 곳`;
  return {
    title,
    description,
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
  const spot = getTourById(id);
  if (!spot) notFound();

  const article = getArticle(id); // 발행된 자체 소개글(있으면 본문으로)
  const [detail, extraImages] = await Promise.all([
    fetchPlaceOverview(id),
    fetchPlaceImages(id),
  ]);
  const overview = detail.overview;
  const homepage = detail.homepage;
  const tel = detail.tel || spot.tel;

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
    url: canonical,
    ...(homepage ? { sameAs: homepage } : {}),
    ...(tel ? { telephone: tel } : {}),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "가볼만한 곳", item: `${SITE.url}/places` },
      { "@type": "ListItem", position: 2, name: spot.area, item: `${SITE.url}/places/${areaSlug}` },
      { "@type": "ListItem", position: 3, name: spot.title, item: canonical },
    ],
  };

  return (
    <Container className="max-w-[820px] pb-16 pt-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <nav className="mb-3 flex flex-wrap items-center gap-1 text-[12.5px] text-ink-faint">
        <Link href="/places" className="hover:text-free">가볼만한 곳</Link>
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
          <PlaceGallery images={gallery} title={spot.title} />
        </div>
      )}

      {article ? (
        <ArticleBody content={article.content} />
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

      <div className="mt-5 flex flex-wrap gap-2.5">
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
