// 카페 데이트 코스 — 카페를 기준으로 걸어갈 만한 공원·맛집을 묶어 반나절 코스를 만든다.
// 원칙: 새 데이터 수집 없이 기존 restaurants.json + places.json의 좌표만으로 결정론적으로 생성.
//       (LLM 없음 → 환각 없음, 비용 0)
import restaurantsData from "@/data/restaurants.json";
import placesData from "@/data/places.json";
import { SIDO_SLUG, sidoFromSlug } from "@/lib/classify";

const CAFE_CAT = "A05020900"; // TourAPI 음식점 분류: 카페·찻집
const RADIUS_KM = 3; // 카페 기준 반경 — 이 안에서만 공원·맛집을 묶는다
const WALK_MIN_PER_KM = 15; // 도보 4km/h 기준

// 공원·산책류 판별 — 데이트 코스의 "걷는 구간"에 해당하는 장소만
const PARK_RE = /공원|수목원|정원|호수|산책로|둘레길|해변|해수욕장|전망대|숲길|생태|저수지/;

interface Row {
  id: string; title: string; addr: string; area: string;
  image: string; mapx: string; mapy: string; cat3?: string;
}

export interface CourseStop {
  id: string; title: string; addr: string; image: string;
  mapx: string; mapy: string;
  kind: "cafe" | "park" | "food";
  href: string;
  /** 직전 지점에서의 거리(km). 첫 지점은 0 */
  distKm: number;
}

export interface DateCourse {
  id: string;          // = 카페 id (안정적)
  slug: string;        // URL: /date/c/{id}
  title: string;       // "○○ 카페 데이트 코스"
  area: string;        // 시도
  city: string;        // 시군구 (롱테일 키워드용)
  cafe: CourseStop;
  park: CourseStop;
  food: CourseStop;
  totalKm: number;     // 카페→공원→맛집 합계
  walkMin: number;     // 도보 환산(분)
  image: string;       // 대표 이미지
}

const num = (v: unknown) => Number(v) || 0;
function distanceKm(a: { mapx: string; mapy: string }, b: { mapx: string; mapy: string }): number {
  const R = 6371, t = Math.PI / 180;
  const dLat = (num(b.mapy) - num(a.mapy)) * t;
  const dLon = (num(b.mapx) - num(a.mapx)) * t;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(num(a.mapy) * t) * Math.cos(num(b.mapy) * t) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** 주소에서 시군구 추출 — "서울특별시 강남구" → "강남구" (광역시는 두 번째 토큰이 구) */
export function cityOf(addr: string): string {
  const parts = String(addr || "").trim().split(/\s+/);
  for (const p of parts.slice(1, 3)) if (/(시|군|구)$/.test(p)) return p;
  return parts[0] || "";
}

/** 거리 표기 — 1km 미만은 m 단위 */
export function distLabel(km: number): string {
  return km < 1 ? `${Math.round(km * 100) * 10}m` : `${km.toFixed(1)}km`;
}
/** 도보 소요(분) */
export function walkMinutes(km: number): number {
  return Math.max(1, Math.round(km * WALK_MIN_PER_KM));
}

function build(): DateCourse[] {
  const restaurants = (restaurantsData as unknown as { restaurants: Row[] }).restaurants;
  const places = (placesData as unknown as { spots: Row[] }).spots;

  const hasGeo = (r: Row) => Boolean(r.mapx && r.mapy);
  const cafes = restaurants.filter((r) => r.cat3 === CAFE_CAT && hasGeo(r));
  const foods = restaurants.filter((r) => r.cat3 !== CAFE_CAT && hasGeo(r));
  const parks = places.filter((p) => PARK_RE.test(p.title) && hasGeo(p));

  // 지역별로 미리 나눠 탐색 비용을 줄인다
  const byArea = <T extends Row>(list: T[]) => {
    const m = new Map<string, T[]>();
    for (const x of list) {
      if (!m.has(x.area)) m.set(x.area, []);
      m.get(x.area)!.push(x);
    }
    return m;
  };
  const foodsBy = byArea(foods);
  const parksBy = byArea(parks);

  const out: DateCourse[] = [];
  // 같은 (공원, 맛집) 조합이 반복되면 카페만 다른 중복 페이지가 된다 → 가장 가까운 카페 하나만 남긴다
  const bestByPair = new Map<string, { course: DateCourse; score: number }>();

  for (const cafe of cafes) {
    const nearParks = (parksBy.get(cafe.area) || [])
      .map((p) => ({ p, d: distanceKm(cafe, p) }))
      .filter((x) => x.d <= RADIUS_KM)
      .sort((a, b) => a.d - b.d);
    if (!nearParks.length) continue;
    const { p: park, d: dCafePark } = nearParks[0];

    const nearFoods = (foodsBy.get(cafe.area) || [])
      .filter((f) => f.id !== cafe.id)
      .map((f) => ({ f, d: distanceKm(park, f) }))
      .filter((x) => x.d <= RADIUS_KM)
      .sort((a, b) => a.d - b.d);
    if (!nearFoods.length) continue;
    const { f: food, d: dParkFood } = nearFoods[0];

    const totalKm = dCafePark + dParkFood;
    const city = cityOf(cafe.addr);
    const course: DateCourse = {
      id: cafe.id,
      slug: cafe.id,
      title: `${cafe.title} 카페 데이트 코스`,
      area: cafe.area,
      city,
      cafe: { ...pick(cafe), kind: "cafe", href: `/food/spot/${cafe.id}`, distKm: 0 },
      park: { ...pick(park), kind: "park", href: `/places/spot/${park.id}`, distKm: dCafePark },
      food: { ...pick(food), kind: "food", href: `/food/spot/${food.id}`, distKm: dParkFood },
      totalKm,
      walkMin: walkMinutes(totalKm),
      image: cafe.image || park.image || food.image || "",
    };

    const key = `${park.id}|${food.id}`;
    const prev = bestByPair.get(key);
    // 총 이동거리가 짧은 코스를 대표로 (걷기 좋은 조합 우선)
    if (!prev || totalKm < prev.score) bestByPair.set(key, { course, score: totalKm });
  }

  for (const { course } of bestByPair.values()) out.push(course);
  // 이동거리가 짧은 순 = 걷기 좋은 순
  out.sort((a, b) => a.totalKm - b.totalKm);
  return out;
}

function pick(r: Row) {
  return { id: r.id, title: r.title, addr: r.addr, image: r.image || "", mapx: r.mapx, mapy: r.mapy };
}

let cache: DateCourse[] | null = null;
export function getDateCourses(): DateCourse[] {
  if (!cache) cache = build();
  return cache;
}

export function getDateCourse(id: string): DateCourse | undefined {
  return getDateCourses().find((c) => c.id === id);
}

export function dateCoursesByArea(area: string): DateCourse[] {
  return getDateCourses().filter((c) => c.area === area);
}

/** 지역별 코스 수 (많은 순) */
export function dateAreaCounts(): { area: string; slug: string; count: number }[] {
  const m: Record<string, number> = {};
  for (const c of getDateCourses()) m[c.area] = (m[c.area] || 0) + 1;
  return Object.entries(m)
    .map(([area, count]) => ({ area, slug: (SIDO_SLUG as Record<string, string>)[area] || "", count }))
    .filter((x) => x.slug)
    .sort((a, b) => b.count - a.count);
}

/** 시군구별 코스 수 — "해운대구 카페데이트" 같은 롱테일 내부링크용 */
export function dateCityCounts(area: string): { city: string; count: number }[] {
  const m: Record<string, number> = {};
  for (const c of dateCoursesByArea(area)) if (c.city) m[c.city] = (m[c.city] || 0) + 1;
  return Object.entries(m).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count);
}

export { sidoFromSlug };
