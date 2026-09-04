// 지역 축제·행사 — data/festivals.json(매일 수집)에서 지역·현재 날짜로 필터.
// 코스 페이지에 "지금 이 지역에서 열리는/곧 열리는 축제"를 날짜 연동으로 노출.
import festivalsData from "@/data/festivals.json";

export interface Festival {
  id: string; title: string; addr: string; area: string;
  image: string; mapx: string; mapy: string; startDate: string; endDate: string;
  source?: string; description?: string; place?: string; homepage?: string; tel?: string;
}

const ALL = (festivalsData as unknown as { festivals?: Festival[] }).festivals || [];
const ymd = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

/** 해당 지역에서 지금 열리는/곧(기본 60일 내) 열리는 축제. 시작일 순. */
export function areaFestivals(area: string, { withinDays = 60, limit = 4 } = {}): (Festival & { ongoing: boolean })[] {
  const now = new Date();
  const today = ymd(now);
  const soon = ymd(new Date(now.getTime() + withinDays * 86400000));
  return ALL
    .filter((f) => f.area === area && f.endDate >= today && f.startDate <= soon)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, limit)
    .map((f) => ({ ...f, ongoing: f.startDate <= today && f.endDate >= today }));
}

export function upcomingFestivals(limit = 12): Festival[] {
  const today = ymd(new Date());
  return ALL.filter((f) => f.endDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(0, limit);
}

/** YYYYMMDD → "10.22" */
export function fmtMd(ymdStr: string): string {
  const s = String(ymdStr || "");
  return s.length === 8 ? `${s.slice(4, 6)}.${s.slice(6, 8)}` : s;
}
