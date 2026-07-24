import type { Metadata } from "next";
import { getEndingSoon } from "@/lib/data";
import CollectionView from "@/components/CollectionView";

export const metadata: Metadata = {
  title: "곧 종료되는 전시·공연",
  description:
    "7일 이내 마감되는 전국 전시·공연·문화행사. 놓치기 전에 지금 확인하세요.",
  alternates: { canonical: "/ending-soon" },
};

export default function EndingSoonPage() {
  const events = getEndingSoon(7);
  return (
    <CollectionView
      title={
        <>
          <span className="text-rose-500">곧 종료</span>되는 행사
        </>
      }
      subtitle={`7일 이내 마감 예정 ${events.length.toLocaleString()}건 — 마감 임박순`}
      events={events}
    />
  );
}
