// 캠핑(고캠핑) 데이터 접근 — data/camping.json (scripts/collectCamping.mjs)
import campingData from "@/data/camping.json";
import { SIDO_LIST } from "@/lib/classify";

export interface Camp {
  id: string; name: string; area: string; sigungu: string; addr: string;
  mapx: string; mapy: string;
  types: string[]; facilities: Record<string, boolean>;
  pet: boolean; petRaw: string; lctCl: string;
  resve: string; operPd: string; tel: string; homepage: string; image: string; intro: string;
}
const data = campingData as unknown as { count: number; camps: Camp[] };

export const CAMP_TYPES = ["일반야영장", "오토캠핑", "글램핑", "카라반"] as const;
export const CAMP_FACILITIES = ["전기", "샤워실", "화장실", "와이파이", "온수", "마트"] as const;

export function getAllCamps(): Camp[] { return data.camps || []; }
export function getCampCount(): number { return data.count ?? (data.camps || []).length; }
export function getCamp(id: string): Camp | undefined { return (data.camps || []).find((c) => c.id === id); }

export interface CampFilter { area?: string; sigungu?: string; type?: string; types?: string[]; facility?: string; facilities?: string[]; pet?: boolean }
export function filterCamps(f: CampFilter = {}): Camp[] {
  let list = data.camps || [];
  if (f.area) list = list.filter((c) => c.area === f.area);
  if (f.sigungu) list = list.filter((c) => c.sigungu === f.sigungu);
  if (f.type) list = list.filter((c) => c.types.includes(f.type!));
  if (f.types && f.types.length) list = list.filter((c) => f.types!.every((t) => c.types.includes(t))); // 다중 유형 AND
  if (f.facility) list = list.filter((c) => c.facilities[f.facility!]);
  if (f.facilities && f.facilities.length) list = list.filter((c) => f.facilities!.every((fa) => c.facilities[fa])); // 다중 시설 AND
  if (f.pet) list = list.filter((c) => c.pet);
  return list;
}

/** 지역별 개수 (SIDO 순서, 캠핑 있는 지역만) */
export function campAreaCounts(): { area: string; count: number }[] {
  const c: Record<string, number> = {};
  for (const x of data.camps || []) c[x.area] = (c[x.area] || 0) + 1;
  return SIDO_LIST.filter((a) => c[a] > 0).map((area) => ({ area, count: c[area] }));
}
export function campTypeCounts(list = data.camps || []): Record<string, number> {
  const c: Record<string, number> = { 일반야영장: 0, 오토캠핑: 0, 글램핑: 0, 카라반: 0 };
  for (const x of list) for (const t of x.types) if (t in c) c[t]++;
  return c;
}
export function campFacilityCounts(list = data.camps || []): Record<string, number> {
  const c: Record<string, number> = {};
  for (const f of CAMP_FACILITIES) c[f] = 0;
  for (const x of list) for (const f of CAMP_FACILITIES) if (x.facilities[f]) c[f]++;
  return c;
}
export function petCount(list = data.camps || []): number {
  return list.filter((x) => x.pet).length;
}
