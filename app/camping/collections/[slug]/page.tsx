import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllBundles, getBundle, bundleCamps, campBlurb } from "@/lib/campingCollections";
import { SITE } from "@/lib/site";
import { SIDO_SLUG } from "@/lib/classify";
import { Container } from "@/components/Band";
import AffiliateNotice from "@/components/AffiliateNotice";
import CampCard from "@/components/CampCard";
import CoupangBanner from "@/components/CoupangBanner";

export const dynamicParams = false;
export function generateStaticParams() {
  return getAllBundles().map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const b = getBundle(slug);
  if (!b) return { title: "캠핑 모음을 찾을 수 없습니다" };
  return {
    title: `${b.title} ${b.count}곳 · ${SITE.name}`,
    description: `${b.title} ${b.count}곳을 한눈에. 유형·편의시설·반려동물 동반 여부와 요금·예약·지도 정보를 데이터로 정리했어요.`,
    keywords: b.keywords,
    alternates: { canonical: `/camping/collections/${b.slug}` },
  };
}

export default async function BundlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = getBundle(slug);
  if (!b) notFound();
  const camps = bundleCamps(b, 40);

  const itemListLd = {
    "@context": "https://schema.org", "@type": "ItemList",
    name: b.title, numberOfItems: b.count,
    itemListElement: camps.map((c, i) => ({
      "@type": "ListItem", position: i + 1,
      item: { "@type": "Campground", name: c.name, url: `${SITE.url}/camping/${c.id}`, address: { "@type": "PostalAddress", addressRegion: c.area, addressLocality: c.sigungu } },
    })),
  };

  return (
    <Container className="max-w-[900px] pb-16 pt-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <nav className="mb-3 flex flex-wrap items-center gap-1 text-[12.5px] text-ink-faint">
        <Link href="/camping" className="hover:text-free">캠핑</Link><span>›</span>
        <Link href="/camping/collections" className="hover:text-free">모음</Link>
      </nav>

      <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">{b.title} <span className="text-free">{b.count}곳</span></h1>
        <AffiliateNotice className="mt-1.5" />
      <p className="mt-1.5 text-[14px] leading-[1.7] text-ink-soft">
        {b.area}의 {b.label} {b.count}곳을 데이터로 추렸어요. 아래 목록에서 유형·편의시설·반려동물 동반 여부를 확인하고, 각 캠핑장 페이지에서 요금·예약·지도를 볼 수 있어요.
      </p>

      {/* 데이터 기반 목록(사실만) */}
      <ol className="mt-5 space-y-2.5">
        {camps.map((c, i) => (
          <li key={c.id}>
            <Link href={`/camping/${c.id}`} className="flex gap-3 rounded-2xl border border-line bg-white p-3.5 transition hover:border-free/40 hover:shadow-card">
              <span className="mt-0.5 text-[15px] font-black text-free">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[15px] font-bold text-ink">{c.name}</span>
                  {c.types.map((t) => <span key={t} className="rounded bg-tint px-1.5 py-0.5 text-[10.5px] font-bold text-freedark">{t}</span>)}
                  {c.pet && <span className="rounded bg-free/10 px-1.5 py-0.5 text-[10.5px] font-bold text-freedark">🐾</span>}
                </span>
                <span className="mt-0.5 block text-[13px] leading-[1.6] text-ink-soft">{campBlurb(c)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {/* 사진 그리드(추가 탐색) */}
      <h2 className="mb-3 mt-10 text-[16px] font-extrabold text-ink">사진으로 보기</h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 md:grid-cols-4">
        {camps.filter((c) => c.image).slice(0, 12).map((c) => <CampCard key={c.id} camp={c} />)}
      </div>

      {/* 캠핑용품 제휴 배너 (쿠팡 파트너스) — 본문 끝, 광고와 간격 확보 */}
      <div className="mt-8">
        <CoupangBanner />
      </div>

      <div className="mt-8">
        <Link href={`/camping/region/${(SIDO_SLUG as Record<string, string>)[b.area]}`} className="inline-flex rounded-full border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:border-free/40 hover:text-free">{b.area} 캠핑장 전체 보기 →</Link>
      </div>
      <p className="mt-6 text-[12px] text-ink-faint">캠핑정보 제공: 한국관광공사 고캠핑 · 목록은 데이터 기준으로 자동 정리되며 주관적 평가를 담지 않습니다.</p>
    </Container>
  );
}
