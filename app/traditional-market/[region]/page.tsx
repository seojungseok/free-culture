import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TraditionalMarketBrowser from "@/components/TraditionalMarketBrowser";
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
    title: `${region} 전통시장 가볼만한곳 | 주차·먹거리·시장 정보 - 오늘은 뭐하지`,
    description: `${region} 전통시장을 지역별로 찾아보세요. 시장 주소, 전화번호, 주차장, 상품권, 취급품목과 주변 여행 정보를 확인할 수 있습니다.`,
    alternates: { canonical: `/traditional-market/${raw}` },
  };
}

export default async function TraditionalMarketRegionPage({ params }: { params: Promise<{ region: string }> }) {
  const raw = (await params).region;
  const region = regionFromSlug(decodeURIComponent(raw));
  if (!MARKET_REGIONS.includes(region)) notFound();
  return <><section className="border-b border-line bg-tint"><div className="mx-auto max-w-[1180px] px-5 py-6 sm:px-6 lg:px-8"><p className="text-[13px] font-bold text-free">지역별 전통시장</p><h1 className="mt-1 text-[25px] font-black text-ink sm:text-[32px]">{region} 전통시장 가볼만한곳</h1><p className="mt-2 max-w-2xl text-[14px] leading-6 text-ink-soft">{region} 지역 전통시장의 위치, 주차, 상품권, 취급품목을 비교하고 주변 맛집과 여행코스까지 이어서 찾아보세요.</p></div></section><TraditionalMarketBrowser initial={[]} initialRegion={region} /></>;
}
