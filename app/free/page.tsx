import type { Metadata } from "next";
import { getFree } from "@/lib/data";
import CollectionView from "@/components/CollectionView";
import { todayYmd } from "@/lib/dates";

export const metadata: Metadata = {
  title: "전국 무료·일부 무료 전시·공연 모음",
  description:
    "무료로 확인된 전시·공연과 일부 대상에게 무료인 문화행사를 구분해 보여드립니다. 대상·예약 조건은 상세 안내에서 확인하세요.",
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
      subtitle={`오늘 일정에 포함된 무료·일부 무료 행사 ${events.length.toLocaleString()}건을 모았습니다. 각 행사 적용 조건을 확인하세요.`}
      events={events}
      hidePriceFilter
    />
  );
}
