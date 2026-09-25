import { parkingFor, parkingSnapshot, PARKING_SOURCE } from "@/lib/parking";
import ParkingAvailability from "./ParkingAvailability";

const DAYS: [string, string][] = [
  ["Monday", "월요일"], ["Tuesday", "화요일"], ["Wednesday", "수요일"],
  ["Thursday", "목요일"], ["Friday", "금요일"], ["Saturday", "토요일"],
  ["Sunday", "일요일"], ["Holiday", "공휴일"],
];

export default function NearbyParking({
  lon, lat, area, address, title = "근처 주차장",
}: {
  lon: number; lat: number; area: string; address?: string; title?: string;
}) {
  const lots = parkingFor({ lon, lat, area, address });
  if (!lots.length) return null;

  return (
    <section className="my-7 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5" aria-label={title}>
      <h2 className="text-lg font-extrabold text-ink">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-ink-soft">직선거리 700m 이내의 주차장 정보입니다.</p>
      <div className="mt-3 space-y-3">
        {lots.map((lot) => {
          const facts = [
            lot.spaces !== undefined ? `총 ${lot.spaces}면` : null,
            lot.basicMinutes && lot.basicWon !== undefined
              ? `기본 ${lot.basicMinutes}분 ${lot.basicWon.toLocaleString("ko-KR")}원`
              : null,
            lot.freeMinutes ? `기본 무료시간 ${lot.freeMinutes}분` : null,
          ].filter(Boolean);
          const hours = DAYS.filter(([key]) => lot.hours?.[key]);
          return (
            <article key={lot.id} className="min-w-0 rounded-xl border border-slate-100 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 break-keep text-sm font-bold">{lot.name}</h3>
                <span className="shrink-0 text-xs text-ink-soft">직선 약 {Math.max(1, Math.round(lot.distanceKm * 100)) * 10}m</span>
              </div>
              <p className="mt-1 break-words text-xs leading-5 text-ink-soft">{lot.address}</p>
              {facts.length > 0 && <p className="mt-2 text-xs leading-5 text-ink-soft">{facts.join(" · ")}</p>}
              {hours.length > 0 && (
                <details className="mt-1">
                  <summary className="min-h-11 cursor-pointer py-3 text-xs font-semibold text-ink-soft">운영시간</summary>
                  <ul className="space-y-1 text-xs leading-5 text-ink-soft">
                    {hours.map(([key, label]) => <li key={key}>{label} · {lot.hours?.[key]}</li>)}
                  </ul>
                </details>
              )}
              <a href={`https://map.naver.com/p/search/${encodeURIComponent(lot.address + " " + lot.name)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-xs font-bold text-brandblue">지도에서 위치 보기 ↗</a>
              {lot.realtimePage && <ParkingAvailability id={lot.id} />}
            </article>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] leading-5 text-ink-faint">
        <a href={PARKING_SOURCE} target="_blank" rel="noopener noreferrer" className="underline">한국교통안전공단 주차정보</a>
        {" · "}수집 {parkingSnapshot.collectedAt.slice(0, 10)} · 표시된 주차장은 방문 장소의 전용 주차장이 아닐 수 있습니다.
      </p>
    </section>
  );
}
