import type { Metadata } from "next";
import { getCheap } from "@/lib/data";
import CollectionView from "@/components/CollectionView";

export const metadata: Metadata = {
  title: "1만원 이하 전시·공연",
  description:
    "1만원 이하로 부담 없이 즐길 수 있는 전국 전시·공연·문화행사. 가성비 좋은 문화생활을 찾아보세요.",
  alternates: { canonical: "/cheap" },
};

export default function CheapPage() {
  const events = getCheap();
  return (
    <CollectionView
      title={
        <>
          <span className="text-blue-600">1만원 이하</span> 가성비 행사
        </>
      }
      subtitle={`1만원 이하로 즐기는 전국 행사 ${events.length.toLocaleString()}건`}
      events={events}
      hidePriceFilter
    />
  );
}
