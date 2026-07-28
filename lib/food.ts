// 맛집(음식점) 필터 — 지역(시도)·업종(cat3). data/restaurants.json 기반.
import restaurantsData from "@/data/restaurants.json";
import { SIDO_LIST } from "@/lib/classify";

export interface Restaurant {
  id: string; title: string; addr: string; area: string;
  image: string; mapx: string; mapy: string; tel: string; cat3?: string;
}
const restaurants = (restaurantsData as unknown as { restaurants: Restaurant[] }).restaurants || [];

// 업종(cat3) — TourAPI 음식점 분류
export const FOOD_CATS: { code: string; label: string }[] = [
  { code: "A05020100", label: "한식" },
  { code: "A05020200", label: "서양식" },
  { code: "A05020300", label: "일식" },
  { code: "A05020400", label: "중식" },
  { code: "A05020900", label: "카페·찻집" },
  { code: "A05020700", label: "이색" },
];
export function foodCatLabel(cat3?: string): string {
  return FOOD_CATS.find((c) => c.code === cat3)?.label || "음식점";
}

export function getAllRestaurants(): Restaurant[] { return restaurants; }

export function filterRestaurants({ area, cat3 }: { area?: string; cat3?: string } = {}): Restaurant[] {
  return restaurants.filter((r) => (!area || r.area === area) && (!cat3 || r.cat3 === cat3));
}

/** 데이터 있는 시도 목록(개수 순 아님, 시도 순) */
export function foodAreas(): string[] {
  const set = new Set(restaurants.map((r) => r.area));
  return SIDO_LIST.filter((s) => set.has(s));
}
