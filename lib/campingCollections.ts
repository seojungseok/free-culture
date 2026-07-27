// 캠핑 묶음 큐레이션 — 데이터로 자동 생성(환각 없음, 사실만). 개별 캠핑장 글은 안 씀.
//  예: "경기 반려동물 캠핑장", "강원 오토캠핑장", "제주 글램핑"
import { filterCamps, type Camp, type CampFilter } from "@/lib/camping";
import { SIDO_LIST, SIDO_SLUG } from "@/lib/classify";

interface Theme { key: string; label: string; filter: CampFilter; kw: (a: string) => string[] }
const THEMES: Theme[] = [
  { key: "pet", label: "반려동물 동반 캠핑장", filter: { pet: true }, kw: (a) => [`${a} 반려동물 캠핑장`, `${a} 애견 캠핑장`, `${a} 반려견 동반 캠핑`] },
  { key: "glamp", label: "글램핑", filter: { types: ["글램핑"] }, kw: (a) => [`${a} 글램핑`, `${a} 글램핑 추천`, `${a} 글램핑장`] },
  { key: "auto", label: "오토캠핑장", filter: { types: ["오토캠핑"] }, kw: (a) => [`${a} 오토캠핑`, `${a} 오토캠핑장 추천`, `${a} 자동차 야영장`] },
  { key: "carav", label: "카라반", filter: { types: ["카라반"] }, kw: (a) => [`${a} 카라반`, `${a} 카라반 캠핑`] },
  { key: "elec", label: "전기 되는 캠핑장", filter: { facilities: ["전기"] }, kw: (a) => [`${a} 전기 캠핑장`, `${a} 편의시설 캠핑장`] },
];
const MIN = 5; // 이 미만이면 묶음 페이지 안 만듦

export interface Bundle { slug: string; area: string; themeKey: string; label: string; title: string; count: number; keywords: string[] }

let CACHE: Bundle[] | null = null;
export function getAllBundles(): Bundle[] {
  if (CACHE) return CACHE;
  const out: Bundle[] = [];
  for (const area of SIDO_LIST) {
    const slug0 = (SIDO_SLUG as Record<string, string>)[area];
    if (!slug0) continue;
    for (const t of THEMES) {
      const count = filterCamps({ area, ...t.filter }).length;
      if (count < MIN) continue;
      out.push({
        slug: `${slug0}-${t.key}`, area, themeKey: t.key, label: t.label,
        title: `${area} ${t.label}`, count, keywords: t.kw(area),
      });
    }
  }
  CACHE = out.sort((a, b) => b.count - a.count);
  return CACHE;
}

export function getBundle(slug: string): Bundle | undefined {
  return getAllBundles().find((b) => b.slug === slug);
}

export function bundleCamps(b: Bundle, limit = 40): Camp[] {
  const t = THEMES.find((x) => x.key === b.themeKey)!;
  return filterCamps({ area: b.area, ...t.filter }).slice(0, limit);
}

/** 캠핑장 한 곳을 사실만으로 2~3줄 (주관적 평가 금지) */
export function campBlurb(c: Camp): string {
  const facs = Object.entries(c.facilities).filter(([, v]) => v).map(([k]) => k);
  const parts = [`${c.area} ${c.sigungu}에 있는 ${c.types.join("·")}이에요.`];
  if (facs.length) parts.push(`${facs.slice(0, 4).join("·")} 이용이 가능해요.`);
  if (c.pet) parts.push("반려동물 동반이 가능해요.");
  return parts.join(" ");
}
