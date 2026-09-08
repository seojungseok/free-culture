import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TraditionalMarketUnavailable from "@/components/TraditionalMarketUnavailable";
import { MARKET_REGIONS } from "@/lib/traditionalMarkets";
import { SIDO_SLUG } from "@/lib/classify";

const MARKET_SLUG = SIDO_SLUG as Record<string, string>;

export const revalidate = 86400;

export function generateStaticParams() {
  return MARKET_REGIONS.map((region) => ({ region: MARKET_SLUG[region] || region }));
}

function regionFromSlug(slug: string) {
  return MARKET_REGIONS.find((region) => (MARKET_SLUG[region] || region) === slug) || "";
}

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }): Promise<Metadata> {
  const raw = (await params).region;
  const region = regionFromSlug(decodeURIComponent(raw));
  if (!MARKET_REGIONS.includes(region)) return {};
  return {
    title: `${region} · 현재 공개하지 않는 페이지`,
    description: "다른 나들이 장소와 이번 주말 갈 곳을 찾아보세요.",
    robots: { index: false, follow: true },
    alternates: { canonical: `/traditional-market/${raw}` },
  };
}

export default async function TraditionalMarketRegionPage({ params }: { params: Promise<{ region: string }> }) {
  const raw = (await params).region;
  const region = regionFromSlug(decodeURIComponent(raw));
  if (!MARKET_REGIONS.includes(region)) notFound();
  return <TraditionalMarketUnavailable />;
}
