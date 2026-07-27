import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCamp, type Camp } from "@/lib/camping";
import { nearbyPlaces, nearbyRestaurants, distanceLabel, foodTypeLabel } from "@/lib/nearby";
import { SIDO_SLUG } from "@/lib/classify";
import { SITE } from "@/lib/site";
import { Container } from "@/components/Band";
import TourCard from "@/components/TourCard";

export const dynamicParams = true;
export const revalidate = 604800;
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

      <dl className="mt-5 divide-y divide-line rounded-2xl border border-line bg-white">
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

      {nearFood.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-[16px] font-extrabold text-ink">🍽️ 주변에서 식사하기</h2>
          <div className="divide-y divide-line rounded-2xl border border-line bg-white">
            {nearFood.map((r) => (
              <Link key={r.id} href={`/places/spot/${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-tint/40">
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
