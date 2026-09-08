import type { Metadata } from "next";
import TraditionalMarketUnavailable from "@/components/TraditionalMarketUnavailable";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "현재 공개하지 않는 페이지",
  description: "다른 나들이 장소와 이번 주말 갈 곳을 찾아보세요.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/traditional-market" },
};

export default function TraditionalMarketPage() {
  return <TraditionalMarketUnavailable />;
}
