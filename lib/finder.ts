// 홈 "최적의 장소 찾기" 필터 — 실시간 카운트 백엔드(내부 캐시 데이터만, 외부 호출 X).
import { filterCamps, type CampFilter } from "@/lib/camping";
import { getPlaces } from "@/lib/tour";
import { getAdmission } from "@/lib/fees";
import { getAllEvents } from "@/lib/data";
import { todayYmd, weekendRangeYmd, monthRangeYmd, kstNow } from "@/lib/dates";

export type Cat = "camping" | "nadeuli" | "events";

// 인접 시도(0건 대안 제시용)
const ADJ: Record<string, string[]> = {
  서울: ["경기", "인천"], 인천: ["경기", "서울"], 경기: ["서울", "인천", "강원"],
  강원: ["경기", "충북"], 충북: ["충남", "경기", "대전"], 충남: ["충북", "전북", "대전"],
  대전: ["충남", "충북"], 세종: ["대전", "충남"], 전북: ["전남", "충남"], 전남: ["전북", "광주", "경남"],
  광주: ["전남"], 경북: ["대구", "강원", "충북"], 대구: ["경북", "경남"], 경남: ["부산", "경북", "전남"],
  부산: ["경남", "울산"], 울산: ["부산", "경북"], 제주: [],
};

export interface NadeuliF { area?: string; type?: string; who?: string; price?: string }
export interface EventsF { area?: string; genre?: string; price?: string; when?: string }

export function campingCount(f: CampFilter): number { return filterCamps(f).length; }

export function nadeuliCount(f: NadeuliF): number {
  let list = getPlaces({ area: f.area || undefined, type: f.type || undefined });
  if (f.who === "kid") list = list.filter((s) => s.isKid);
  if (f.price === "free") list = list.filter((s) => getAdmission(s.id) === "free");
  return list.length;
}

const FREEISH = new Set(["free", "free_estimated", "partial_free"]);
function overlaps(e: { startDate: string; endDate: string }, start: string, end: string) {
  return e.startDate <= end && e.endDate >= start;
}
export function eventsCount(f: EventsF): number {
  let list = getAllEvents();
  if (f.area) list = list.filter((e) => e.area === f.area);
  if (f.genre) list = list.filter((e) => e.genreKey === f.genre);
  if (f.price === "free") list = list.filter((e) => FREEISH.has(e.priceType));
  else if (f.price === "cheap") list = list.filter((e) => e.priceType === "cheap");
  if (f.when) {
    const t = todayYmd();
    if (f.when === "today") list = list.filter((e) => overlaps(e, t, t));
    else if (f.when === "weekend") { const r = weekendRangeYmd(); list = list.filter((e) => overlaps(e, r.start, r.end)); }
    else if (f.when === "month") { const n = kstNow(); const r = monthRangeYmd(n.getFullYear(), n.getMonth()); list = list.filter((e) => overlaps(e, r.start, r.end)); }
  }
  return list.length;
}

export function countFor(cat: Cat, f: Record<string, string | boolean | undefined>): number {
  if (cat === "camping") return campingCount({ area: f.area as string, sigungu: f.sigungu as string, type: f.type as string, facility: f.facility as string, pet: f.pet === "1" || f.pet === true });
  if (cat === "nadeuli") return nadeuliCount(f as NadeuliF);
  return eventsCount(f as EventsF);
}

/** 0건이면 인접 시도 중 결과 있는 곳 하나 제안 */
export function altRegion(cat: Cat, f: Record<string, string | boolean | undefined>): { area: string; count: number } | null {
  const area = f.area as string;
  if (!area) return null;
  for (const adj of ADJ[area] || []) {
    const c = countFor(cat, { ...f, area: adj });
    if (c > 0) return { area: adj, count: c };
  }
  return null;
}

// ── 계절 자동 판별 ──────────────────────────────────────────────
export function season(now = kstNow()): { key: string; label: string; emoji: string; query: string; terms: string[] } {
  const m = now.getMonth() + 1;
  if (m >= 3 && m <= 5) return { key: "spring", label: "봄", emoji: "🌸", query: "벚꽃", terms: ["벚꽃", "봄꽃", "꽃축제", "수목원"] };
  if (m >= 6 && m <= 8) return { key: "summer", label: "여름", emoji: "🏖️", query: "계곡", terms: ["계곡", "물놀이", "해변", "캠핑"] };
  if (m >= 9 && m <= 11) return { key: "autumn", label: "가을", emoji: "🍁", query: "단풍", terms: ["단풍", "억새", "가을", "수목원"] };
  return { key: "winter", label: "겨울", emoji: "❄️", query: "겨울", terms: ["눈꽃", "얼음", "온천", "실내"] };
}
