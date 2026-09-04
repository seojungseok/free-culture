import type { Metadata } from "next";
import { getFree } from "@/lib/data";
import CollectionView from "@/components/CollectionView";
import { todayYmd } from "@/lib/dates";

export const metadata: Metadata = {
  title: "전국 무료 전시·공연 모음",
  description:
    "입장료 없이 즐길 수 있는 전국의 무료 전시·공연·문화행사. 조건부 무료(어르신·어린이 무료 등)까지 한곳에 모았습니다.",
  alternates: { canonical: "/free" },
};

export default function FreePage() {
  // 완전 무료 + 조건부 무료 포함
  const today = todayYmd();
  const events = getFree(true).filter((event) => event.startDate <= today && event.endDate >= today);
  return (
    <CollectionView
      title={
        <>
        <span className="text-free">오늘 진행 중인 무료</span> 문화행사
        </>
      }
      subtitle={`오늘 실제로 진행 중인 무료 행사 ${events.length.toLocaleString()}건을 모았습니다 (조건부 무료 포함)`}
      events={events}
      hidePriceFilter
    />
  );
}
