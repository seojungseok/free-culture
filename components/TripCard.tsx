import Link from "next/link";
import type { SavedTrip } from "@/lib/planner";
import { straightKm } from "@/lib/planner";
import TripSave from "./TripSave";
export default function TripCard({trip}: {trip: SavedTrip}) {
  return <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
    <p className="text-xs font-semibold text-brandblue">{trip.stops[0]?.area} · {trip.stops.length}곳{trip.date ? " · "+trip.date : ""}</p>
    <h3 className="mt-2 break-words text-lg font-bold text-ink">{trip.title}</h3>
    <ol className="mt-3 space-y-3">{trip.stops.map((s,i)=><li key={s.href} className="text-sm">
      {i>0 && Number.isFinite(straightKm(trip.stops[i-1],s)) && <p className="mb-1 text-xs text-ink-soft">앞 장소에서 직선 {straightKm(trip.stops[i-1],s).toFixed(1)}km · 이동시간 아님</p>}
      <Link prefetch={false} href={s.href} className="font-semibold text-ink underline decoration-slate-300 underline-offset-4">{i+1}. {s.title}</Link>
      <p className="mt-1 text-xs text-ink-soft">{s.kind==="food" ? "식사비 별도" : s.free ? "공개 자료상 무료 입장" : "이용요금 확인 필요"}</p>
    </li>)}</ol>
    <TripSave trip={trip}/>
  </article>;
}
