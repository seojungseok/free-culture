import Link from "next/link";
import { distanceLabel } from "@/lib/nearby";
import type { CourseVisitPlan } from "@/lib/coursePlanning";

function collectedDate(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric" }).format(date)
    : "";
}

export default function CourseVisitPlan({ plan, isList = false }: { plan: CourseVisitPlan; isList?: boolean }) {
  if (!plan.days.length) return null;
  return (
    <section id="course-visit-plan" aria-labelledby="course-visit-plan-title" className="mt-6 rounded-2xl border border-free/20 bg-freelight/50 px-4 py-5 sm:px-5">
      <h2 id="course-visit-plan-title" className="text-[19px] font-extrabold tracking-tight text-ink">
        {isList ? "장소별 이용 조건 비교하기" : "방문 순서와 이용 조건"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-ink-soft">
        {isList ? "관심 있는 장소의 운영시간과 이용 조건을 비교해 골라보세요." : "아래 순서를 출발점으로 삼고, 방문할 날짜의 휴무와 예약 조건에 맞춰 일정을 조정하세요."}
      </p>
      <div className="mt-4 space-y-5">
        {plan.days.map((day, dayIndex) => (
          <div key={dayIndex}>
            {plan.days.length > 1 && <h3 className="mb-2 text-sm font-black text-free">{dayIndex + 1}일차</h3>}
            {day.totalStraightKm !== null && (
              <p className="mb-2 text-xs font-semibold text-ink-soft">장소 간 직선거리 합계 {distanceLabel(day.totalStraightKm)}</p>
            )}
            <ol className="space-y-2">
              {day.stops.map((stop, index) => (
                <li key={`${stop.placeId || stop.name}:${index}`}>
                  <div className="rounded-xl border border-line bg-white p-3.5 sm:p-4">
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-free text-xs font-black text-white">{index + 1}</span>
                      <div className="min-w-0">
                        <h3 className="break-keep text-base font-extrabold leading-6 text-ink">{stop.name}</h3>
                        {stop.address && <p className="mt-1 text-xs leading-5 text-ink-faint">{stop.address}</p>}
                      </div>
                    </div>
                    {stop.facts.length > 0 && (
                      <dl className="mt-3 grid gap-y-2 text-[13px] leading-6 sm:grid-cols-[72px_1fr] sm:gap-x-3">
                        {stop.facts.map((fact) => (
                          <div key={fact.label} className="grid grid-cols-[64px_1fr] gap-x-2 sm:contents">
                            <dt className="font-bold text-ink">{fact.label}</dt>
                            <dd className="min-w-0 whitespace-pre-line break-words text-ink-soft">{fact.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {stop.facts.length > 0 && stop.sourceCollectedAt && collectedDate(stop.sourceCollectedAt) && <p className="mt-2 text-xs text-ink-faint">이용 정보 수집: {collectedDate(stop.sourceCollectedAt)}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {stop.detailHref && <Link prefetch={false} href={stop.detailHref} className="inline-flex min-h-11 items-center rounded-xl bg-tint px-3 text-[13px] font-bold text-freedark">{stop.name} 상세 정보 →</Link>}
                      <a href={stop.mapHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl border border-line px-3 text-[13px] font-bold text-ink-soft">지도에서 위치 확인 ↗</a>
                    </div>
                  </div>
                  {index < day.stops.length - 1 && !isList && (
                    <p className="px-4 py-2 text-xs leading-5 text-ink-soft">
                      ↓ 다음 장소까지 {day.segmentsKm[index] !== null ? `직선거리 ${distanceLabel(day.segmentsKm[index]!)}` : "지도에서 경로 확인"}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      {!isList && <p className="mt-4 text-xs leading-5 text-ink-faint">직선거리는 두 장소의 좌표로 계산한 거리입니다. 도로·도보 경로의 길이와 다르며, 실제 이동시간은 지도에서 교통편을 선택해 확인하세요.</p>}
      {plan.hasVisitFacts && <p className="mt-3 text-xs leading-5 text-ink-faint">이용 정보 출처: 한국관광공사 관광정보. 운영시간·요금·휴무는 변경될 수 있으므로 방문 전 장소의 최신 안내를 확인하세요.</p>}
    </section>
  );
}
