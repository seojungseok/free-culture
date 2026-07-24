import type { Metadata } from "next";
import { getByAudience } from "@/lib/data";
import CollectionView from "@/components/CollectionView";

export const metadata: Metadata = {
  title: "아이와 갈만한 문화행사",
  description:
    "아동·가족·체험 등 아이와 함께 즐길 수 있는 전국 문화행사. 무료 행사만 골라 볼 수도 있어요.",
  alternates: { canonical: "/kids" },
};

export default function KidsPage() {
  const events = getByAudience("kids");
  return (
    <CollectionView
      title={
        <>
          아이와 <span className="text-free">함께</span> 갈만한 곳
        </>
      }
      subtitle={`아동·가족·체험 문화행사 ${events.length.toLocaleString()}건`}
      events={events}
    />
  );
}
