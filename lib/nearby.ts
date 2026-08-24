// 좌표(mapx=경도, mapy=위도) 거리 계산으로 주변 나들이 장소·맛집 산출 (결정론적, 캐시 서빙).
// 정보 카드형 + 상세페이지 보강용. LLM 없이 사실만.
import { getAllPlaces, tourTypeLabel, type TourSpot } from "@/lib/tour";
import restaurantsData from "@/data/restaurants.json";
import articlesData from "@/data/place-articles.json";

// 글이 발행된 장소 id — "주변 나들이 장소"를 고를 때 읽을거리가 있는 곳을 앞세우는 데 쓴다.
const ARTICLE_IDS: Set<string> = new Set(
  Object.entries(((articlesData as unknown as { articles?: Record<string, { status?: string }> }).articles) || {})
    .filter(([, a]) => a?.status === "published")
    .map(([id]) => id)
);

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

/**
 * 주변 나들이 장소 n곳 (같은 시도 내, 자기 제외).
 *
 * 가장 가까운 2곳은 거리순 그대로 두고(안내 정확도), 남은 칸은 "읽을 글이 있는 곳"을 앞세운다.
 *  순수 거리순이면 5칸 중 글이 있는 칸이 8%뿐이라, 눌러도 정보 카드만 나와 바로 이탈한다.
 *  재정렬하면 46%로 오른다(발행글 100곳 표본 실측, 평균거리 1.6km→4.3km).
 *  → 다음 페이지에도 읽을 게 있으니 방문이 이어진다. 순수 정렬 순서만 바뀔 뿐 없는 곳을 지어내지 않는다.
 */
const KEEP_NEAREST = 2; // 이 칸수만큼은 무조건 최근접 유지
const REORDER_MAX_KM = 20; // 재정렬로 끌어올릴 수 있는 최대 거리(너무 먼 곳 추천 방지)
export function nearbyPlaces(spot: NearRef, n = 5): (TourSpot & { dist: number })[] {
  const near = getAllPlaces()
    .filter((p) => p.id !== spot.id && p.area === spot.area)
    .map((p) => ({ ...p, dist: distanceKm(spot, p) }))
    .filter((p) => Number.isFinite(p.dist))
    .sort((a, b) => a.dist - b.dist);
  const head = near.slice(0, KEEP_NEAREST);
  const rest = near
    .slice(KEEP_NEAREST)
    .filter((p) => p.dist <= REORDER_MAX_KM)
    .sort(
      (a, b) =>
        Number(ARTICLE_IDS.has(b.id)) - Number(ARTICLE_IDS.has(a.id)) || a.dist - b.dist
    );
  const picked = [...head, ...rest].slice(0, n);
  // 반경 안에 후보가 모자라면 기존(순수 거리순)으로 채운다.
  if (picked.length < n) {
    const seen = new Set(picked.map((p) => p.id));
    for (const p of near) { if (picked.length >= n) break; if (!seen.has(p.id)) picked.push(p); }
  }
  return picked;
}

/** (레거시) 순수 거리순 주변 장소 — 재정렬이 부적절한 곳에서 쓸 수 있게 남겨둔다 */
export function nearbyPlacesByDistance(spot: NearRef, n = 5): (TourSpot & { dist: number })[] {
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

/**
 * 코스용 근처 맛집 — 좌표 있으면 거리순, 없으면 주소(시/군)로 필터. (공식 코스는 좌표가 없어 주소 기반)
 * 반환에 dist(있을 때만)·addr 포함 → 카드에 거리 또는 주소 표기.
 */
export function coursesNearbyFood(
  { area, city, mapx, mapy }: { area: string; city?: string; mapx?: string; mapy?: string },
  n = 6
): (Restaurant & { dist?: number })[] {
  const inArea = restaurants.filter((r) => r.area === area);
  const lon = parseFloat(mapx || ""), lat = parseFloat(mapy || "");
  const hasCoord = Number.isFinite(lon) && Number.isFinite(lat) && lon > 120 && lon < 132 && lat > 32 && lat < 40;
  if (hasCoord) {
    return inArea
      .map((r) => ({ ...r, dist: distanceKm({ mapx, mapy }, r) }))
      .filter((r) => Number.isFinite(r.dist!))
      .sort((a, b) => a.dist! - b.dist!)
      .slice(0, n);
  }
  // 좌표 없음 → 같은 시/군 주소로 필터
  const byCity = city ? inArea.filter((r) => r.addr.includes(city)) : [];
  return (byCity.length ? byCity : inArea).slice(0, n);
}

export { tourTypeLabel };
