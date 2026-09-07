import Link from "next/link";
import TripSave from "./TripSave";
import TripCard from "./TripCard";
import { nearbyStops } from "@/lib/plannerData";
import type { TripStop } from "@/lib/planner";
export default function NextStop({anchor,camping=false}: {anchor:TripStop;camping?:boolean}) {
  const candidates=nearbyStops(anchor).filter(s=>s.kind==="place").slice(0,2);
  return <section className="my-7 rounded-2xl bg-slate-50 p-4 sm:p-6" aria-label="일정 만들기">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{camping ? "캠핑 전후, 가까운 한 곳" : "여기까지 왔는데 한 곳 더"}</h2><p className="mt-2 text-sm leading-6 text-ink-soft">{camping ? "체크인 전이나 체크아웃 후 방문 후보입니다. 캠핑장 입퇴실 시간과 장소 운영시간을 먼저 확인하세요." : "직선 3km 안의 방문 후보입니다. 도로·물길·운영시간에 따라 실제 이동은 달라집니다."}</p></div><TripSave trip={{id:anchor.id,title:anchor.title,stops:[anchor]}}/></div>
    {candidates.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2">{candidates.map(s=><TripCard key={s.id} trip={{id:"around:"+anchor.id+":"+s.id,title:s.title+" 함께 보기",stops:[anchor,s]}}/>)}</div> : <p className="mt-4 text-sm text-ink-soft">확인된 좌표에서 가까운 후보가 없습니다. 지역과 날짜로 다른 장소를 찾아보세요.</p>}
    <div className="mt-4 flex flex-wrap gap-5 text-sm font-bold text-brandblue"><Link href="/plan" className="inline-flex min-h-11 items-center">날짜·조건으로 추천 받기 →</Link><Link href="/saved" className="inline-flex min-h-11 items-center">보관함 보기 →</Link></div>
  </section>;
}
