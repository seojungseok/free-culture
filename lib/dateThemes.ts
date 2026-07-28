// 데이트 테마 — 실제 검색 결과가 "지역별로" 풍부한 것만 노출(빈손 방지).
//  게이트를 전국이 아니라 지역별로 계산 → "서울 전망대 1개" 류 원천 차단.
import { search } from "@/lib/search";
import { SIDO_LIST } from "@/lib/classify";

export interface DateTheme {
  label: string;   // 칩에 보일 이름
  term: string;    // 검색어(지역과 결합해 /search?q=지역 term)
  emoji: string;
  regions: string[]; // 이 테마가 풍부한(≥DATE_MIN) 시도 목록
  national: number;  // 전국 검색 결과 수
}

// 데이트 적합 + 데이터 풍부. 전망대·야경·테마파크·드라이브는 데이터 희소/미수집이라 제외.
const DEFS: { label: string; term: string; emoji: string }[] = [
  { label: "공원·산책", term: "공원", emoji: "🌳" },
  { label: "미술관·전시", term: "미술관", emoji: "🎨" },
  { label: "수목원·정원", term: "수목원", emoji: "🌿" },
  { label: "강변·호수", term: "호수", emoji: "🌊" },
  { label: "맛집", term: "맛집", emoji: "🍽️" },
  { label: "카페", term: "카페", emoji: "☕" },
];

// 지역당 이 개수 이상이어야 그 지역에서 노출(빈손 방지). 데이트는 "풍부"가 원칙.
export const DATE_MIN = 8;

/** 각 테마의 풍부한 지역 목록을 실제 검색으로 산출. 어느 지역도 풍부하지 않으면 항목 제외. */
export function buildDateThemes(min = DATE_MIN): DateTheme[] {
  return DEFS.map((d) => {
    const regions = SIDO_LIST.filter((s) => search(`${s} ${d.term}`).total >= min);
    return { ...d, regions, national: search(d.term).total };
  }).filter((t) => t.regions.length > 0);
}
