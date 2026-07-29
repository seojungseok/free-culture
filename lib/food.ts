// 맛집(음식점) 필터 — 지역(시도)·업종(cat3). data/restaurants.json 기반.
import restaurantsData from "@/data/restaurants.json";
import restaurantIntroData from "@/data/restaurant-intro.json";
import { SIDO_LIST } from "@/lib/classify";

export interface Restaurant {
  id: string; title: string; addr: string; area: string;
  image: string; mapx: string; mapy: string; tel: string; cat3?: string;
  phone?: string; // restaurant-intro.json infocenter(문의처) — 목록·카드 노출용
}

// 수집된 영업정보(restaurant-intro)의 전화(infocenter)를 id→전화 맵으로
const introMap = (restaurantIntroData as unknown as { intro?: Record<string, { infocenter?: string }> }).intro || {};
function phoneOf(id: string): string | undefined {
  const v = introMap[id]?.infocenter;
  return v && String(v).trim() ? String(v).trim() : undefined;
}

// 목록의 tel은 전량 빈값 → 수집된 문의처 전화를 phone으로 병합(한 번만)
const restaurants: Restaurant[] = ((restaurantsData as unknown as { restaurants: Restaurant[] }).restaurants || [])
  .map((r) => {
    const phone = phoneOf(r.id);
    return phone ? { ...r, phone } : r;
  });

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
