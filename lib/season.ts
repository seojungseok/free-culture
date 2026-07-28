// 계절 나들이 필터 — 지역 + 계절 키워드(계곡·해변 등). 계절 자동 전환.
import { getAllPlaces, type TourSpot } from "@/lib/tour";
import { season } from "@/lib/finder";
import { SIDO_LIST } from "@/lib/classify";

// 계절별 나들이 키워드(제목·주소에 포함되면 매칭)
export const SEASON_KEYWORDS: Record<string, string[]> = {
  spring: ["벚꽃", "봄꽃", "유채", "튤립", "수목원", "꽃"],
  summer: ["계곡", "해변", "해수욕장", "물놀이", "수영장", "워터파크", "폭포"],
  autumn: ["단풍", "억새", "수목원", "국화", "코스모스", "자연휴양림"],
  winter: ["온천", "눈꽃", "얼음", "스키", "빙어", "전망대"],
};

export function seasonKey(): string { return season().key; }
export function seasonKeywords(): string[] { return SEASON_KEYWORDS[season().key] || SEASON_KEYWORDS.summer; }

/** 계절 나들이 필터 결과(이미지 있는 것만). kw 없으면 그 계절 전체 키워드 OR */
export function filterSeasonPlaces({ area, kw }: { area?: string; kw?: string } = {}): TourSpot[] {
  const kws = kw ? [kw] : seasonKeywords();
  return getAllPlaces().filter(
    (p) => p.image && (!area || p.area === area) && kws.some((k) => `${p.title} ${p.addr}`.includes(k))
  );
}

/** 데이터 있는 시도 목록 */
export function seasonAreas(): string[] {
  const set = new Set(filterSeasonPlaces({}).map((p) => p.area));
  return SIDO_LIST.filter((s) => set.has(s));
}

/** 특정 키워드의 전국 개수(빈손 방지용) */
export function seasonKwCount(kw: string, area?: string): number {
  return filterSeasonPlaces({ area, kw }).length;
}
