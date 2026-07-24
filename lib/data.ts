// 정적 import: 빌드 산출물/서버리스 함수에 함께 번들되어 ISR·동적 렌더에서도 안전
import eventsData from "@/data/events.json";
import type { CultureEvent, EventsData, PriceType } from "./types";

function load(): EventsData {
  return eventsData as unknown as EventsData;
}

export function getAllEvents(): CultureEvent[] {
  return load().events;
}

export function getGeneratedAt(): string {
  return load().generatedAt;
}

export function getEventById(id: string): CultureEvent | undefined {
  return load().events.find((e) => e.id === id);
}

export function getByRegion(area: string): CultureEvent[] {
  return load().events.filter((e) => e.area === area);
}

/** 시도별 행사 수 */
export function getRegionCounts(): Record<string, number> {
  const c: Record<string, number> = {};
  for (const e of load().events) if (e.area) c[e.area] = (c[e.area] || 0) + 1;
  return c;
}

/** 클라이언트(DateBrowser/검색)로 넘길 최소 필드만 추림 — 페이로드 절약 */
export function slimForClient(events: CultureEvent[]): CultureEvent[] {
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    imgUrl: e.imgUrl,
    priceType: e.priceType,
    priceLabel: e.priceLabel,
    freeCondition: e.freeCondition,
    area: e.area,
    place: e.place,
    startDate: e.startDate,
    endDate: e.endDate,
  })) as unknown as CultureEvent[];
}

export function getByGenre(genreKey: string): CultureEvent[] {
  return load().events.filter((e) => e.genreKey === genreKey);
}

export function getFeatured(limit = 8): CultureEvent[] {
  return load()
    .events.filter((e) => e.featured && e.imgUrl)
    .slice(0, limit);
}

/** 무료 계열: 확정무료 + 무료추정 (조건부무료 포함 여부 선택). 확정무료가 먼저 오도록 정렬 */
export function getFree(includePartial = false): CultureEvent[] {
  const rank = (t: string) => (t === "free" ? 0 : t === "free_estimated" ? 1 : 2);
  return load()
    .events.filter(
      (e) =>
        e.priceType === "free" ||
        e.priceType === "free_estimated" ||
        (includePartial && e.priceType === "partial_free")
    )
    .sort((a, b) => rank(a.priceType) - rank(b.priceType));
}

/** 1만원 이하 (cheap) */
export function getCheap(): CultureEvent[] {
  return load().events.filter((e) => e.priceType === "cheap");
}

/** 대상 태그로 필터 */
export function getByAudience(key: string): CultureEvent[] {
  return load().events.filter((e) => e.audiences?.includes(key));
}

/** 이번 주말(토·일) 열리는 행사 */
export function getWeekend(): CultureEvent[] {
  const { sat, sun } = weekendRange();
  return load().events.filter((e) => e.startDate <= sun && e.endDate >= sat);
}

/** 곧 종료 (오늘 이후 N일 이내 마감, 진행 중인 것) */
export function getEndingSoon(days = 7): CultureEvent[] {
  const today = kstYmd(0);
  const limit = kstYmd(days);
  return load()
    .events.filter(
      (e) => e.startDate <= today && e.endDate >= today && e.endDate <= limit
    )
    .sort((a, b) => a.endDate.localeCompare(b.endDate));
}

/** 곧 시작 (아직 시작 전) */
export function getUpcoming(days = 30): CultureEvent[] {
  const today = kstYmd(0);
  const limit = kstYmd(days);
  return load()
    .events.filter((e) => e.startDate > today && e.startDate <= limit)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/** 현재 진행 중 (오늘 관람 가능) */
export function getNow(): CultureEvent[] {
  const today = kstYmd(0);
  return load().events.filter((e) => e.startDate <= today && e.endDate >= today);
}

export function countByType(events: CultureEvent[]): Record<PriceType, number> {
  const c: Record<PriceType, number> = {
    free: 0,
    free_estimated: 0,
    partial_free: 0,
    cheap: 0,
    paid: 0,
    unknown: 0,
  };
  for (const e of events) c[e.priceType]++;
  return c;
}

function kstYmd(addDays: number): string {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000 + addDays * 86400000);
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
}

function weekendRange() {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000); // KST
  const dow = now.getUTCDay(); // 0=일 .. 6=토
  const toSat = (6 - dow + 7) % 7;
  const sat = new Date(now.getTime() + toSat * 86400000);
  const sun = new Date(sat.getTime() + 86400000);
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(
      d.getUTCDate()
    ).padStart(2, "0")}`;
  return { sat: fmt(sat), sun: fmt(sun) };
}
