import Link from "next/link";
import type { SavedTrip } from "@/lib/planner";
import { straightKm } from "@/lib/planner";
import TripSave from "./TripSave";
import TripStopPhoto from "./TripStopPhoto";
export default function TripCard({trip}: {trip: SavedTrip}) {
  return <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
    <p className="text-xs font-semibold text-brandblue">{trip.stops[0]?.area} · {trip.stops.length}곳{trip.date ? " · "+trip.date : ""}</p>
    <h3 className="mt-2 break-words text-lg font-bold text-ink">{trip.title}</h3>
    <ol className="mt-3 space-y-3">{trip.stops.map((s,i)=><li key={s.href} className="text-sm">
      {i>0 && Number.isFinite(straightKm(trip.stops[i-1],s)) && <p className="mb-1 text-xs text-ink-soft">앞 장소에서 직선 {straightKm(trip.stops[i-1],s).toFixed(1)}km · 이동시간 아님</p>}
      <Link prefetch={false} href={s.href} className="group flex min-w-0 items-start gap-3 rounded-xl focus-visible:outline focus-visible:outline-brandblue">
        <TripStopPhoto src={s.image} title={s.title}/>
        <span className="min-w-0 flex-1 py-1"><span className="block break-words font-semibold leading-6 text-ink group-hover:text-brandblue">{i+1}. {s.title}</span>
        {s.summary&&<span className="mt-1 line-clamp-3 text-xs font-normal leading-5 text-ink-soft">{s.summary}</span>}
        {s.address&&<span className="mt-1 line-clamp-2 text-xs font-normal leading-5 text-ink-soft">{s.address}</span>}
        <span className="mt-1 block text-xs leading-5 text-ink-soft">{s.kind==="food" ? "식사비 별도" : s.free ? "공개 자료상 무료 입장" : "이용요금 확인 필요"}</span></span>
      </Link>
      {(s.hoursText||s.restText||s.parkingText||s.accessText)&&<details className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-6"><summary className="cursor-pointer font-semibold">운영·주차·이동 편의 안내</summary>{s.hoursText&&<p>이용시간: {s.hoursText}</p>}{s.restText&&<p>휴무: {s.restText}</p>}<p>주차: {s.parkingText||'자료 없음 · 확인 필요'}</p><p>이동 편의: {s.accessText||'자료 없음 · 확인 필요'}</p><p className="text-ink-soft">저장된 공개 안내 기준 · 현재 운영 및 실제 이용 조건은 방문 전 확인하세요.</p></details>}
    </li>)}</ol>
    <TripSave trip={trip}/>
  </article>;
}
