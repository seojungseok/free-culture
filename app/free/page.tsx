import type { Metadata } from "next";
import { getFree } from "@/lib/data";
import CollectionView from "@/components/CollectionView";

export const metadata: Metadata = {
  title: "전국 무료 전시·공연 모음",
  description:
    "입장료 없이 즐길 수 있는 전국의 무료 전시·공연·문화행사. 조건부 무료(어르신·어린이 무료 등)까지 한곳에 모았습니다.",
  alternates: { canonical: "/free" },
};

export default function FreePage() {
  // 완전 무료 + 조건부 무료 포함
  const events = getFree(true);
  return (
    <CollectionView
      title={
        <>
          <span className="text-free">무료</span>로 즐기는 문화행사
        </>
      }
      subtitle={`입장료 없이 갈 수 있는 전국 행사 ${events.length.toLocaleString()}건 (조건부 무료 포함)`}
      events={events}
      hidePriceFilter
    />
  );
}
