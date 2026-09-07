import TripCard from "./TripCard";
import { plannerOptions } from "@/lib/plannerData";
import { makePlans } from "@/lib/planner";
import { weekendRangeYmd, ymdToDash } from "@/lib/dates";
export default function WeekendPicks() {
  const plans = makePlans(plannerOptions(), {area:"",date:ymdToDash(weekendRangeYmd().start),hours:4,kids:false,free:false});
  return <><p className="mb-4 text-sm leading-6 text-ink-soft">행사와 관광지를 가까운 나들이 후보로 연결했습니다. 실제 이동·운영시간은 방문 전 확인하세요.</p><div className="grid gap-4 lg:grid-cols-3">{plans.map(t=><TripCard key={t.id} trip={t}/>)}</div></>;
}
