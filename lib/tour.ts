// 캐시된 TourAPI "가볼만한 곳" 데이터 접근 (빌드 시 정적 사용)
// 수집: scripts/collectTour.mjs (areaBasedList2 지역×유형 전체) → data/places.json
import placesData from "@/data/places.json";
import { SIDO_LIST } from "@/lib/classify";

export interface TourSpot {
  id: string;
  title: string;
  addr: string;
  area: string;
  image: string;
  mapx: string;
  mapy: string;
  tel: string;
  type: string; // 12=관광지, 14=문화시설, 28=체험·레포츠
  cat1?: string;
  cat2?: string;
  cat3?: string;
  isKid?: boolean;
  overview?: string; // 상세 페이지에서 detailCommon2로 주입 (목록엔 없음)
  homepage?: string;
}

const data = placesData as unknown as { generatedAt: string; count: number; spots: TourSpot[] };

export function getAllPlaces(): TourSpot[] {
  return data.spots || [];
}

export function getPlaceCount(): number {
  return data.count ?? (data.spots || []).length;
}

export function getPlaces(
  opts: { area?: string; type?: string; kidOnly?: boolean; limit?: number } = {}
): TourSpot[] {
  let list = data.spots || [];
  if (opts.area) list = list.filter((s) => s.area === opts.area);
  if (opts.type) list = list.filter((s) => s.type === opts.type);
  if (opts.kidOnly) list = list.filter((s) => s.isKid);
  return typeof opts.limit === "number" ? list.slice(0, opts.limit) : list;
}

/** 하위호환: 아이 친화 장소만 (/kids, 지역페이지, 홈) */
export function getKidTours(area?: string, limit?: number): TourSpot[] {
  return getPlaces({ area, kidOnly: true, limit });
}

export function getTourById(id: string): TourSpot | undefined {
  return (data.spots || []).find((s) => s.id === id);
}

/** 유형별 개수 (전체 데이터 기준). area 주면 그 지역 안에서 집계. 합 = 전체/그 지역 전체와 일치 */
export function getTypeCounts(area?: string): { all: number; "12": number; "14": number; "28": number } {
  const list = area ? (data.spots || []).filter((s) => s.area === area) : (data.spots || []);
  const c = { all: list.length, "12": 0, "14": 0, "28": 0 };
  for (const s of list) if (s.type === "12" || s.type === "14" || s.type === "28") c[s.type]++;
  return c;
}

/** 관광지가 있는 시도 목록 + 각 지역 개수 (전체) */
export function getTourAreaCounts(): { area: string; count: number }[] {
  const c: Record<string, number> = {};
  for (const s of data.spots || []) c[s.area] = (c[s.area] || 0) + 1;
  return SIDO_LIST.filter((a) => c[a] > 0).map((area) => ({ area, count: c[area] }));
}

/** 전국 미리보기 샘플 — 아이친화(박물관·체험 등 이미지 좋은 곳) 우선 */
export function getPlacesSample(limit = 300): TourSpot[] {
  const list = data.spots || [];
  const kids: TourSpot[] = [];
  const rest: TourSpot[] = [];
  for (const s of list) (s.isKid ? kids : rest).push(s);
  return [...kids, ...rest].slice(0, limit);
}

export function getTourGeneratedAt(): string {
  return data.generatedAt;
}

export function tourTypeLabel(type: string): string {
  return type === "14" ? "문화시설" : type === "28" ? "체험·레포츠" : "관광지";
}

/** 목록(클라이언트)로 넘길 최소 필드 — overview는 상세에서만 로드 */
export function slimTours(spots: TourSpot[]): TourSpot[] {
  return spots.map((s) => ({
    id: s.id,
    title: s.title,
    addr: s.addr,
    area: s.area,
    image: s.image,
    mapx: "",
    mapy: "",
    tel: "",
    type: s.type,
    isKid: s.isKid,
  }));
}
