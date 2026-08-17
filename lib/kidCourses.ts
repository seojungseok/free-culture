// lib/kidCourses.ts
// "아이와 함께" 테마별 코스 — 카페데이트 엔진을 아이용으로.
//   [테마 명소(놀거리)] → [근처 공원(산책)] → [아이가 좋아하는 음식]
//   차량 이동거리로 가까운 것끼리 좌표로 자동 구성(비용 0, 환각 없음).
// 테마: 동물/놀이/배우는/자연/공연(문화행사). 실내는 indoor 플래그로 교차 필터.

import { getKidTours } from "@/lib/tour";
import { getByAudience } from "@/lib/data";
import restaurantsData from "@/data/restaurants.json";
import placesData from "@/data/places.json";
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
export const THEME_LABEL_MAP: Record<KidTheme, string> = {
  animal: "동물 친구", play: "신나는 놀이", learn: "배우는 나들이", nature: "자연 탐험", show: "공연·전시",
};
export const THEME_EMOJI_MAP: Record<KidTheme, string> = { animal: "🦁", play: "🎡", learn: "🔬", nature: "🌳", show: "🎪" };
// 코스별 "의미"가 담긴 제목 — 테마에 따라 다르게 (카드·상세·SEO 공통)
const THEME_HEADLINE: Record<KidTheme, (spot: string) => string> = {
  animal: (s) => `${s}에서 동물 친구 만나기`,
  play: (s) => `${s}에서 신나게 놀기`,
  learn: (s) => `${s}에서 보고 배우기`,
  nature: (s) => `${s} 자연 나들이`,
  show: (s) => `${s} 공연·전시 나들이`,
};
export function kidHeadline(theme: KidTheme, spot: string): string {
  return THEME_HEADLINE[theme](spot);
}

const RADIUS_KM = 8; // 차량으로 가까운 범위
const ANIMAL_RE = /아쿠아리움|아쿠아플라넷|동물원|수족관|목장|아쿠아|동물/;
const PLAY_RE = /테마파크|놀이공원|유원지|워터파크|키즈|놀이동산|어드벤처|랜드파크/;
const LEARN_RE = /과학관|박물관|미술관|기념관|전시관|천문대|역사관|체험관|문학관|도서관|교육관/;
const NATURE_RE = /수목원|식물원|생태|자연휴양림|숲|정원|공원|해수욕장|계곡|둘레길|산림/;
const INDOOR_RE = /과학관|박물관|미술관|기념관|전시관|아쿠아리움|아쿠아플라넷|천문대|도서관|체험관|키즈|실내|아트센터|문학관|수족관/;
const PARK_RE = /공원|수목원|정원|호수|산책로|둘레길|숲|생태|놀이터|어린이|해변/;
// 아이가 좋아하는 음식
const KID_FOOD_RE = /돈까스|돈가스|피자|햄버거|버거|파스타|스파게티|떡볶이|분식|치킨|김밥|국수|칼국수|우동|라멘|라면|짜장|짬뽕|탕수육|중화|카레|오므라이스|스테이크|뷔페|갈비|삼겹|고기|쌀국수|샤브|만두|왕돈까스|경양식/;

function classify(title: string, type: string): KidTheme {
  const t = title || "";
  if (ANIMAL_RE.test(t)) return "animal";
  if (PLAY_RE.test(t)) return "play";
  if (LEARN_RE.test(t)) return "learn";
  if (NATURE_RE.test(t)) return "nature";
  if (type === "14") return "learn";
  if (type === "28") return "play";
  return "nature";
}

export interface KidStop { id: string; title: string; image: string; addr: string; mapx: string; mapy: string; href: string; distKm: number }
export interface KidCourse {
  id: string; slug: string; theme: KidTheme; area: string; city: string;
  indoor: boolean;
  spot: KidStop;         // 테마 명소 (출발)
  park: KidStop | null;  // 근처 공원
  food: KidStop | null;  // 아이 좋아하는 음식
  totalKm: number; driveMin: number;
  image: string;
}

const num = (v: unknown) => Number(v) || 0;
function distKm(a: { mapx: string; mapy: string }, b: { mapx: string; mapy: string }): number {
  const R = 6371, t = Math.PI / 180;
  const dLat = (num(b.mapy) - num(a.mapy)) * t, dLon = (num(b.mapx) - num(a.mapx)) * t;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(num(a.mapy) * t) * Math.cos(num(b.mapy) * t) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
export function driveMinutes(km: number): number { return Math.max(1, Math.round((km / 22) * 60)); }
export function kmLabel(km: number): string { return km < 1 ? `${Math.round(km * 10) * 100}m` : `${km.toFixed(1)}km`; }

interface Row { id: string; title: string; addr: string; area: string; image?: string; mapx: string; mapy: string; cat3?: string }

function build(): KidCourse[] {
  const restaurants = (restaurantsData as unknown as { restaurants: Row[] }).restaurants.filter((r) => r.mapx && r.mapy);
  const places = (placesData as unknown as { spots: Row[] }).spots.filter((p) => p.mapx && p.mapy);

  const byArea = <T extends Row>(list: T[]) => {
    const m = new Map<string, T[]>();
    for (const x of list) { if (!m.has(x.area)) m.set(x.area, []); m.get(x.area)!.push(x); }
    return m;
  };
  const parksBy = byArea(places.filter((p) => PARK_RE.test(p.title)));
  const foodsBy = byArea(restaurants);

  const nearest = <T extends Row>(from: { mapx: string; mapy: string }, list: T[] | undefined, pref?: RegExp, excludeId?: string) => {
    if (!list) return null as (T & { d: number }) | null;
    let best: (T & { d: number }) | null = null, bestPref: (T & { d: number }) | null = null;
    for (const x of list) {
      if (excludeId && x.id === excludeId) continue;
      const d = distKm(from, x);
      if (d > RADIUS_KM) continue;
      if (!best || d < best.d) best = { ...x, d };
      if (pref && pref.test(x.title) && (!bestPref || d < bestPref.d)) bestPref = { ...x, d };
    }
    return bestPref || best;
  };

  const out: KidCourse[] = [];
  const push = (anchor: { id: string; title: string; image: string; addr: string; area: string; mapx: string; mapy: string; href: string }, theme: KidTheme, indoor: boolean) => {
    const park = nearest(anchor, parksBy.get(anchor.area), undefined, anchor.id);
    const foodFrom = park || anchor;
    const food = nearest(foodFrom, foodsBy.get(anchor.area), KID_FOOD_RE, anchor.id);
    if (!food) return; // 밥(마무리)이 없으면 코스 아님
    const dPark = park ? distKm(anchor, park) : 0;
    const dFood = distKm(foodFrom, food);
    const totalKm = dPark + dFood;
    out.push({
      id: anchor.id, slug: anchor.id, theme, area: anchor.area, city: cityOf(anchor.addr) || anchor.area, indoor,
      spot: { id: anchor.id, title: anchor.title, image: anchor.image, addr: anchor.addr, mapx: anchor.mapx, mapy: anchor.mapy, href: anchor.href, distKm: 0 },
      park: park ? { id: park.id, title: park.title, image: park.image || "", addr: park.addr, mapx: park.mapx, mapy: park.mapy, href: `/places/spot/${park.id}`, distKm: dPark } : null,
      food: { id: food.id, title: food.title, image: food.image || "", addr: food.addr, mapx: food.mapx, mapy: food.mapy, href: `/food/spot/${food.id}`, distKm: dFood },
      totalKm, driveMin: driveMinutes(totalKm),
      image: anchor.image || (park?.image || "") || food.image || "",
    });
  };

  // 명소 앵커 (관광공사 아이 명소)
  for (const s of getKidTours(undefined, undefined)) {
    if (!s.mapx || !s.mapy) continue;
    push({ id: s.id, title: s.title, image: s.image || "", addr: s.addr, area: s.area, mapx: s.mapx, mapy: s.mapy, href: `/places/spot/${s.id}` },
      classify(s.title, s.type), INDOOR_RE.test(s.title) || s.type === "14");
  }
  // 공연·전시 앵커 (아이 대상 문화행사)
  for (const e of getByAudience("kids")) {
    if (!e.gpsX || !e.gpsY || !e.imgUrl) continue;
    push({ id: `ev-${e.id}`, title: e.title, image: e.imgUrl, addr: e.address || `${e.area} ${e.sigungu}`, area: e.area, mapx: String(e.gpsX), mapy: String(e.gpsY), href: `/event/${e.id}` },
      "show", !/축제|행사/.test(e.realmName || ""));
  }

  // 총 이동거리 짧은 순(차로 가까운 순)
  out.sort((a, b) => a.totalKm - b.totalKm);
  return out;
}

let cache: KidCourse[] | null = null;
export function getKidCourses(): KidCourse[] { if (!cache) cache = build(); return cache; }
export function getKidCourse(id: string): KidCourse | undefined { return getKidCourses().find((c) => c.id === id || c.slug === id); }

export function kidAreaCounts(): { area: string; slug: string; count: number }[] {
  const c: Record<string, number> = {};
  for (const s of getKidCourses()) c[s.area] = (c[s.area] || 0) + 1;
  return SIDO_LIST.filter((a) => c[a] > 0).map((area) => ({ area, slug: (SIDO_SLUG as Record<string, string>)[area] || "", count: c[area] }));
}

/** 클라이언트 브라우저용 슬림 코스 */
export interface KidCourseLite {
  id: string; theme: KidTheme; themeLabel: string; headline: string;
  area: string; city: string; indoor: boolean;
  image: string; spot: string; park: string; food: string; totalKm: number; driveMin: number;
}
export function kidCoursesLite(): KidCourseLite[] {
  return getKidCourses().map((c) => ({
    id: c.id, theme: c.theme, themeLabel: THEME_LABEL_MAP[c.theme], headline: kidHeadline(c.theme, c.spot.title),
    area: c.area, city: c.city, indoor: c.indoor,
    image: c.image, spot: c.spot.title, park: c.park?.title || "", food: c.food?.title || "",
    totalKm: c.totalKm, driveMin: c.driveMin,
  }));
}
export function kidCoursesByArea(area: string): KidCourse[] { return getKidCourses().filter((c) => c.area === area); }
