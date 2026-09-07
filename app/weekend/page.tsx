import type { Metadata } from "next";
import { getWeekend } from "@/lib/data";
import CollectionView from "@/components/CollectionView";

export const metadata: Metadata = {
  title: "이번 주말 전시·공연",
  description:
    "이번 주 토·일에 열리는 전국 전시·공연·문화행사. 무료 행사만 골라 주말 나들이를 계획하세요.",
  alternates: { canonical: "/weekend" },
};

export default function WeekendPage() {
  const events = getWeekend();
  return (
    <CollectionView
      title={
        <>
          이번 <span className="text-free">주말</span>에 열리는 행사
        </>
      }
      subtitle={`토·일에 관람 가능한 문화행사 ${events.length.toLocaleString()}건`}
      events={events}
    />
  );
}
