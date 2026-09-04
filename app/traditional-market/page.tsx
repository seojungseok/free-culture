import type { Metadata } from "next";
import { Band } from "@/components/Band";
import TraditionalMarketBrowser from "@/components/TraditionalMarketBrowser";
import Link from "next/link";
import { MARKET_REGIONS } from "@/lib/traditionalMarkets";
import { SIDO_SLUG } from "@/lib/classify";

const MARKET_SLUG = SIDO_SLUG as Record<string, string>;

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "전국 전통시장 가볼만한곳 | 지역별 시장·주차·먹거리 정보 - 오늘은 뭐하지",
  description: "서울, 경기, 인천, 부산 등 전국 전통시장을 지역별로 찾아보세요. 시장 위치, 주차 여부, 취급품목과 주변 나들이 정보를 함께 확인할 수 있습니다.",
  keywords: ["전통시장", "전통시장 가볼만한곳", "전국 전통시장", "전통시장 먹거리", "주차 가능한 전통시장", "내 주변 전통시장"],
  alternates: { canonical: "/traditional-market" },
};

export default function TraditionalMarketPage() {
  return <><Band tone="tint" innerClassName="py-5"><h1 className="text-[24px] font-black text-ink sm:text-[30px]"><span className="text-free">전국 전통시장</span> 가볼만한곳</h1><p className="mt-1 text-[14px] leading-6 text-ink-soft">시장 위치와 주소, 주차 여부, 취급품목을 지역별로 찾아보고 가까운 전통시장 나들이를 계획해보세요.</p><nav aria-label="지역별 전통시장" className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-[13px] font-bold text-free">{MARKET_REGIONS.map((region) => <Link key={region} href={`/traditional-market/${MARKET_SLUG[region] || region}`}>{region} 전통시장</Link>)}</nav></Band><TraditionalMarketBrowser initial={[]} /></>;
}
