// lib/kidCourses.ts
// "아이와 함께" — 아이 친화 명소(관광공사)를 6개 테마로 분류하고 지역별로 묶는다.
//  · 명소(놀거리) + 근처 아이 먹기 좋은 식당(밥집)을 붙여 미니 코스로.
//  · 공연·전시 테마는 아이 대상 문화행사(audiences=kids)를 사용.
// 새 데이터 수집 없이 기존 places/restaurants/events 로만 결정론적 생성(비용 0).

import { getKidTours } from "@/lib/tour";
import { getByAudience } from "@/lib/data";
import restaurantsData from "@/data/restaurants.json";
import { SIDO_SLUG, SIDO_LIST } from "@/lib/classify";
import { cityOf } from "@/lib/dateCourses";

export type KidTheme = "animal" | "play" | "learn" | "nature" | "show";

export const KID_THEMES: { key: KidTheme; label: string; emoji: string }[] = [
  { key: "animal", label: "동물 친구", emoji: "🦁" },
  { key: "play", label: "신나는 놀이", emoji: "🎡" },
  { key: "learn", label: "배우는 나들이", emoji: "🔬" },
  { key: "nature", label: "자연 탐험", emoji: "🌳" },
  { key: "show", label: "공연·전시", emoji: "🎪" },
];
// 실내(비 오는 날)는 테마와 교차하는 속성이라 indoor 플래그로 별도 필터.
export const INDOOR_META = { label: "비 오는 날 실내", emoji: "🌧️" };

const ANIMAL_RE = /아쿠아리움|아쿠아플라넷|동물원|수족관|목장|아쿠아|동물/;
const PLAY_RE = /테마파크|놀이공원|유원지|워터파크|키즈|놀이동산|어드벤처|랜드파크/;
const LEARN_RE = /과학관|박물관|미술관|기념관|전시관|천문대|역사관|체험관|문학관|도서관|교육관/;
const NATURE_RE = /수목원|식물원|생태|자연휴양림|숲|정원|공원|해수욕장|계곡|둘레길|산림/;
const INDOOR_RE = /과학관|박물관|미술관|기념관|전시관|아쿠아리움|아쿠아플라넷|천문대|도서관|체험관|키즈|실내|아트센터|문학관|수족관/;

function classify(title: string): KidTheme | null {
  const t = title || "";
  if (ANIMAL_RE.test(t)) return "animal";
  if (PLAY_RE.test(t)) return "play";
  if (LEARN_RE.test(t)) return "learn";
  if (NATURE_RE.test(t)) return "nature";
  return null;
}

export interface KidSpot {
  id: string;
  title: string;
  image: string;
  area: string;
  city: string;
  theme: KidTheme;
  indoor: boolean;
  food: string; // 근처 아이 먹기 좋은 식당(없으면 "")
  href: string;
  isEvent: boolean;
}

const num = (v: unknown) => Number(v) || 0;
function distKm(a: { mapx: string; mapy: string }, b: { mapx: string; mapy: string }): number {
  const R = 6371, t = Math.PI / 180;
  const dLat = (num(b.mapy) - num(a.mapy)) * t, dLon = (num(b.mapx) - num(a.mapx)) * t;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(num(a.mapy) * t) * Math.cos(num(b.mapy) * t) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

interface Rest { id: string; title: string; area: string; mapx: string; mapy: string }

function build(): KidSpot[] {
  const out: KidSpot[] = [];

  // 식당을 지역별로 미리 그룹핑(근처 밥집 탐색 비용 절감)
  const restaurants = (restaurantsData as unknown as { restaurants: Rest[] }).restaurants;
  const restByArea = new Map<string, Rest[]>();
  for (const r of restaurants) {
    if (!r.mapx || !r.mapy) continue;
    if (!restByArea.has(r.area)) restByArea.set(r.area, []);
    restByArea.get(r.area)!.push(r);
  }
  const nearestFood = (area: string, mapx: string, mapy: string): string => {
    const list = restByArea.get(area);
    if (!list || !mapx || !mapy) return "";
    let best = "", bestD = Infinity;
    for (const r of list) {
      const d = distKm({ mapx, mapy }, r);
      if (d < bestD) { bestD = d; best = r.title; }
    }
    return bestD <= 5 ? best : ""; // 5km 이내만
  };

  // 1) 아이 친화 명소 — 테마 분류 + 근처 밥집
  for (const s of getKidTours(undefined, undefined)) {
    const theme = classify(s.title);
    if (!theme) continue;
    out.push({
      id: s.id,
      title: s.title,
      image: s.image || "",
      area: s.area,
      city: cityOf(s.addr) || s.area,
      theme,
      indoor: INDOOR_RE.test(s.title),
      food: nearestFood(s.area, s.mapx, s.mapy),
      href: `/places/spot/${s.id}`,
      isEvent: false,
    });
  }

  // 2) 공연·전시 테마 — 아이 대상 문화행사
  for (const e of getByAudience("kids")) {
    if (!e.imgUrl) continue;
    out.push({
      id: e.id,
      title: e.title,
      image: e.imgUrl,
      area: e.area,
      city: e.sigungu || e.area,
      theme: "show",
      indoor: !/축제|행사/.test(e.realmName || ""),
      food: "",
      href: `/event/${e.id}`,
      isEvent: true,
    });
  }

  return out;
}

let cache: KidSpot[] | null = null;
export function getKidSpots(): KidSpot[] {
  if (!cache) cache = build();
  return cache;
}

/** 지역별 개수 (SIDO 순, 있는 지역만) */
export function kidAreaCounts(): { area: string; slug: string; count: number }[] {
  const c: Record<string, number> = {};
  for (const s of getKidSpots()) c[s.area] = (c[s.area] || 0) + 1;
  return SIDO_LIST.filter((a) => c[a] > 0).map((area) => ({
    area, slug: (SIDO_SLUG as Record<string, string>)[area] || "", count: c[area],
  }));
}

/** 클라이언트 전달용 (필드 그대로 슬림) */
export function kidSpotsLite(): KidSpot[] {
  return getKidSpots();
}
