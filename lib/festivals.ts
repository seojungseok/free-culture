// 지역 축제·행사 — data/festivals.json(매일 수집)에서 지역·현재 날짜로 필터.
// 코스 페이지에 "지금 이 지역에서 열리는/곧 열리는 축제"를 날짜 연동으로 노출.
import festivalsData from "@/data/festivals.json";
import { getAllEvents } from "@/lib/data";
import { displayAddress } from "@/lib/address";
import { addDaysYmd, todayYmd } from "@/lib/dates";

export interface Festival {
  id: string; title: string; addr: string; area: string;
  image: string; mapx: string; mapy: string; startDate: string; endDate: string;
  source?: string; description?: string; place?: string; homepage?: string; tel?: string;
  type?: string; images?: string[]; intro?: Record<string, string>;
  info?: { name: string; text: string }[]; enrichedAt?: string;
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
