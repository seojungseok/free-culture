// 좌표(mapx=경도, mapy=위도) 거리 계산으로 주변 나들이 장소·맛집 산출 (결정론적, 캐시 서빙).
// 정보 카드형 + 상세페이지 보강용. LLM 없이 사실만.
import { getAllPlaces, tourTypeLabel, type TourSpot } from "@/lib/tour";
import restaurantsData from "@/data/restaurants.json";

export interface Restaurant {
  id: string; title: string; addr: string; area: string;
  image: string; mapx: string; mapy: string; tel: string;
  type: string; cat1?: string; cat2?: string; cat3?: string;
}
const restaurants = (restaurantsData as unknown as { restaurants: Restaurant[] }).restaurants || [];

const rad = (d: number) => (d * Math.PI) / 180;
/** 두 좌표 거리(km). 좌표 없으면 Infinity */
export function distanceKm(
  a: { mapx?: string; mapy?: string }, b: { mapx?: string; mapy?: string }
): number {
  const lon1 = parseFloat(a.mapx || ""), lat1 = parseFloat(a.mapy || "");
  const lon2 = parseFloat(b.mapx || ""), lat2 = parseFloat(b.mapy || "");
  if (![lon1, lat1, lon2, lat2].every(Number.isFinite)) return Infinity;
  const R = 6371;
  const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** 사람이 읽는 거리 표기 */
export function distanceLabel(km: number): string {
  if (!Number.isFinite(km)) return "";
  if (km < 1) return `약 ${Math.max(50, Math.round((km * 1000) / 50) * 50)}m`;
  return `약 ${km.toFixed(1)}km`;
}

// 음식점 cat3 → 업종 라벨 (없으면 "음식점")
const FOOD_CAT: Record<string, string> = {
  A05020100: "한식", A05020200: "서양식", A05020300: "일식", A05020400: "중식",
  A05020700: "이색음식점", A05020900: "카페·찻집", A05021000: "클럽",
};
export function foodTypeLabel(r: Restaurant): string {
  return FOOD_CAT[r.cat3 || ""] || "음식점";
}

/** id로 음식점 1곳 조회 (음식점 상세 페이지용). 없으면 undefined */
export function getRestaurantById(id: string): Restaurant | undefined {
  return restaurants.find((r) => r.id === id);
}

// 주변 계산에 필요한 최소 참조(나들이·음식점 공통)
type NearRef = { id: string; area: string; mapx?: string; mapy?: string };

/** 주변 나들이 장소 n곳 (같은 시도 내, 자기 제외, 가까운 순) */
export function nearbyPlaces(spot: NearRef, n = 5): (TourSpot & { dist: number })[] {
  return getAllPlaces()
    .filter((p) => p.id !== spot.id && p.area === spot.area)
    .map((p) => ({ ...p, dist: distanceKm(spot, p) }))
    .filter((p) => Number.isFinite(p.dist))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n);
}

/** 주변 맛집 n곳 (같은 시도 내, 가까운 순). restaurants.json 비면 [] */
export function nearbyRestaurants(spot: { area: string; mapx?: string; mapy?: string }, n = 3): (Restaurant & { dist: number })[] {
  return restaurants
    .filter((r) => r.area === spot.area)
    .map((r) => ({ ...r, dist: distanceKm(spot, r) }))
    .filter((r) => Number.isFinite(r.dist))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n);
}

export { tourTypeLabel };
