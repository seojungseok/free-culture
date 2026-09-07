import Link from "next/link";
import TripCard from "@/components/TripCard";
import { plannerOptions } from "@/lib/plannerData";
import { makePlans } from "@/lib/planner";
import { weekendRangeYmd, ymdToDash } from "@/lib/dates";
export const revalidate = 3600;
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
  const plans = makePlans(plannerOptions(), {area:"",date:ymdToDash(weekendRangeYmd().start),hours:4,kids:false,free:false});
  return (
    <CollectionView
      title={
        <>
          이번 <span className="text-free">주말</span>에 열리는 행사
        </>
      }
      subtitle={`토·일에 관람 가능한 문화행사 ${events.length.toLocaleString()}건`}
      events={events}
    >
      <section className="mb-8"><h2 className="mb-2 text-xl font-bold">행사와 가까운 나들이, 함께 고르기</h2><p className="mb-4 text-sm text-ink-soft">행사 날짜와 직선거리를 기준으로 추린 후보입니다. 이동시간·영업시간·예약은 방문 전에 확인해 주세요.</p><div className="grid gap-4 lg:grid-cols-3">{plans.map(t=><TripCard key={t.id} trip={t}/>)}</div><Link href="/plan" className="mt-4 inline-flex min-h-11 items-center font-bold text-brandblue">내 지역과 날짜로 다시 추천 받기 →</Link></section>
    </CollectionView>
  );
}
