// 지역 축제·행사 — data/festivals.json(매일 수집)에서 지역·현재 날짜로 필터.
// 코스 페이지에 "지금 이 지역에서 열리는/곧 열리는 축제"를 날짜 연동으로 노출.
import festivalsData from "@/data/festivals.json";
import { getAllEvents } from "@/lib/data";
import { displayAddress } from "@/lib/address";
import { addDaysYmd, todayYmd } from "@/lib/dates";
import { eventContentsText } from "@/lib/eventContents";
import { isUsefulDisplayValue } from "@/lib/displayValue";
import type { VisitCheck } from "@/lib/visitPlanning";

export interface Festival {
  id: string; title: string; addr: string; area: string;
  image: string; mapx: string; mapy: string; startDate: string; endDate: string;
  source?: string; description?: string; place?: string; homepage?: string; tel?: string;
  type?: string; images?: string[]; intro?: Record<string, string>;
  info?: { name: string; text: string }[]; enrichedAt?: string;
  checkedAt?: string; collectedAt?: string;
}

const COLLECTED = ((festivalsData as unknown as { festivals?: Festival[] }).festivals || [])
  .map((festival) => ({ ...festival, addr: displayAddress(festival.addr, festival.area) }));
const ALL = [
  ...COLLECTED,
  ...getAllEvents()
    .filter((event) => event.genreKey === "festival")
    .map((event) => ({
      id: `event-${event.id}`, title: event.title, addr: event.address || event.place || "", area: event.area,
      image: event.imgUrl || "", mapx: event.gpsX || "", mapy: event.gpsY || "", startDate: event.startDate, endDate: event.endDate,
      description: event.contents || "", place: event.place, homepage: event.officialUrl, tel: event.phone,
      source: "공공 문화행사 데이터",
    } as Festival)),
].filter((festival, index, all) => all.findIndex((item) => item.title === festival.title && item.startDate === festival.startDate) === index);
/** 해당 지역에서 지금 열리는/곧(기본 60일 내) 열리는 축제. 시작일 순. */
export function areaFestivals(area: string, { withinDays = 60, limit = 4 } = {}): (Festival & { ongoing: boolean })[] {
  const today = todayYmd();
  const soon = addDaysYmd(today, withinDays);
  return ALL
    .filter((f) => f.area === area && f.endDate >= today && f.startDate <= soon)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, limit)
    .map((f) => ({ ...f, ongoing: f.startDate <= today && f.endDate >= today }));
}

export function upcomingFestivals(limit = 12): Festival[] {
  const today = todayYmd();
  return ALL.filter((f) => f.endDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(0, limit);
}

export function getAllFestivals(): Festival[] {
  return ALL.filter((festival) => festival.endDate >= todayYmd()).sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function getFestivalById(id: string): Festival | undefined {
  return ALL.find((festival) => festival.id === id);
}

/** Culture events already have their own detail URL; avoid linking a duplicate. */
export function festivalHref(festival: Festival): string {
  return festival.id.startsWith("event-") ? `/event/${festival.id.slice(6)}` : `/festivals/${festival.id}`;
}

/** YYYYMMDD → "10.22" */
export function fmtMd(ymdStr: string): string {
  const s = String(ymdStr || "");
  return s.length === 8 ? `${s.slice(4, 6)}.${s.slice(6, 8)}` : s;
}

function validFestivalDate(value: string): boolean {
  if (!/^\d{8}$/.test(value)) return false;
  const date = new Date(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10).replaceAll("-", "") === value;
}

export function festivalStatus(festival: Festival, today = todayYmd()): "ended" | "upcoming" | "ongoing" | "unknown" {
  if (!validFestivalDate(festival.startDate) || !validFestivalDate(festival.endDate) || festival.startDate > festival.endDate) return "unknown";
  if (festival.endDate < today) return "ended";
  return festival.startDate > today ? "upcoming" : "ongoing";
}

export function festivalDateLabel(value: string): string {
  if (!validFestivalDate(value)) return "일정 미확인";
  const date = new Date(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T00:00:00Z`);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getUTCDay()];
  return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)} (${weekday})`;
}

/** Preserve actual festival fee text: TourAPI usetimefestival is a fee field,
 * while playtime describes the event hours. Never infer age or free admission. */
export function festivalVisitInfo(festival: Festival): { hours: string; fee: string; age: string; reservation: string } {
  const clean = (value?: string) => {
    const text = eventContentsText(value || "");
    return isUsefulDisplayValue(text) ? text : "";
  };
  const intro = festival.intro || {};
  const reservationItem = festival.info?.find((item) => /예약|예매|사전\s*신청/.test(item.name) && isUsefulDisplayValue(item.text));
  return {
    hours: clean(intro.playtime),
    fee: clean(intro.fee || intro.usetime),
    age: clean(intro.agelimit),
    reservation: clean(intro.reservation || reservationItem?.text),
  };
}

export function festivalVisitChecks(festival: Festival): VisitCheck[] {
  const info = festivalVisitInfo(festival);
  const period = `${festivalDateLabel(festival.startDate)} ~ ${festivalDateLabel(festival.endDate)}`;
  const checks: VisitCheck[] = [
    { id: "schedule", title: "방문 날짜와 행사 시간 맞추기", detail: `행사 기간: ${period}${info.hours ? ` · 행사 시간: ${info.hours}` : ". 세부 행사 시간은 주최 측 안내를 확인해 주세요."} 기간 안에서도 프로그램별 운영일은 다를 수 있습니다.` },
    { id: "admission", title: "입장과 프로그램 이용 조건 확인", detail: [
      info.fee ? `이용요금 안내: ${info.fee}` : "요금 안내가 없습니다. 입장과 개별 프로그램의 비용을 주최 측에 확인해 주세요.",
      info.reservation ? `예약 안내: ${info.reservation}` : "예약 안내가 없습니다. 참여할 프로그램에 사전 신청이 필요한지 확인해 주세요.",
    ].join("\n") },
  ];
  if (info.age) checks.push({ id: "age", title: "관람 연령 조건 확인", detail: `안내된 관람 연령: ${info.age}` });
  if (festival.addr || festival.place) checks.push({ id: "location", title: "행사장 위치와 도착 경로 확인", detail: `행사장: ${festival.place || festival.title}${festival.addr ? ` · ${festival.addr}` : ""}. 지도에서 도착 지점을 확인하고, 입구와 주차·대중교통 안내를 함께 살펴보세요.` });
  return checks;
}
