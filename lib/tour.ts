// 캐시된 TourAPI "아이와 가볼만한 곳" 데이터 접근 (빌드 시 정적 사용)
import tourData from "@/data/tour-kids.json";

export interface TourSpot {
  id: string;
  title: string;
  addr: string;
  area: string;
  image: string;
  mapx: string;
  mapy: string;
  tel: string;
  type: string; // 12=관광지, 14=문화시설
  keyword: string;
}

const data = tourData as unknown as { generatedAt: string; count: number; spots: TourSpot[] };

export function getKidTours(area?: string, limit?: number): TourSpot[] {
  let list = data.spots || [];
  if (area) list = list.filter((s) => s.area === area);
  return typeof limit === "number" ? list.slice(0, limit) : list;
}

export function tourTypeLabel(type: string): string {
  return type === "14" ? "문화시설" : "관광지";
}
