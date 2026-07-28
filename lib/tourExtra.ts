// 캐시된 방문 팁(detailIntro2)·볼거리(detailInfo2) 접근 — 상세 페이지 서빙용.
// 수집: scripts/collectIntro.mjs → data/place-intro.json / collectInfo.mjs → data/place-info.json
// 미리 저장 → 서빙(런타임 API 호출 없음, 방문 증가와 무관).
import introData from "@/data/place-intro.json";
import infoData from "@/data/place-info.json";
import restaurantIntroData from "@/data/restaurant-intro.json";
import type { Admission } from "@/lib/fees";

export interface PlaceIntro {
  type?: string;
  admission?: Admission;
  fee?: string;
  usetime?: string;
  restdate?: string;
  parking?: string;
  parkingfee?: string;
  infocenter?: string;
  babycarriage?: string;
  pet?: string;
  creditcard?: string;
  discountinfo?: string;
  scale?: string;
  openperiod?: string;
  reservation?: string;
  expguide?: string;
  firstmenu?: string;
  treatmenu?: string;
  packing?: string;
  kidsfacility?: string;
  seat?: string;
  smoking?: string;
  [k: string]: string | undefined;
}
export interface InfoItem { name: string; text: string }

const intro = (introData as unknown as { intro: Record<string, PlaceIntro> }).intro || {};
const info = (infoData as unknown as { info: Record<string, InfoItem[]> }).info || {};
const restaurantIntro = (restaurantIntroData as unknown as { intro: Record<string, PlaceIntro> }).intro || {};

export function getIntro(id: string): PlaceIntro | undefined {
  return intro[id];
}
/** 음식점(39) 방문정보 — restaurant-intro.json (수집분만) */
export function getRestaurantIntro(id: string): PlaceIntro | undefined {
  return restaurantIntro[id];
}
export function getInfo(id: string): InfoItem[] {
  return info[id] || [];
}

// 방문 정보 표시 순서 + 라벨 (값 있는 것만 화면에 노출)
export const INTRO_FIELDS: { key: keyof PlaceIntro; label: string }[] = [
  { key: "usetime", label: "이용시간" },
  { key: "restdate", label: "휴무일" },
  { key: "fee", label: "이용요금" },
  { key: "discountinfo", label: "할인정보" },
  { key: "parking", label: "주차" },
  { key: "parkingfee", label: "주차요금" },
  { key: "firstmenu", label: "대표메뉴" },
  { key: "treatmenu", label: "취급메뉴" },
  { key: "packing", label: "포장" },
  { key: "kidsfacility", label: "어린이 시설" },
  { key: "reservation", label: "예약" },
  { key: "openperiod", label: "운영기간" },
  { key: "babycarriage", label: "유모차 대여" },
  { key: "pet", label: "반려동물" },
  { key: "creditcard", label: "신용카드" },
  { key: "seat", label: "좌석" },
  { key: "smoking", label: "흡연" },
  { key: "infocenter", label: "문의처" },
];

// 음식점(39) 방문정보 표시 순서 + 라벨 (전화는 상세 페이지에서 tel: 링크로 별도 처리)
export const FOOD_INTRO_FIELDS: { key: keyof PlaceIntro; label: string }[] = [
  { key: "usetime", label: "영업시간" },
  { key: "restdate", label: "휴무일" },
  { key: "parking", label: "주차" },
  { key: "firstmenu", label: "대표메뉴" },
  { key: "treatmenu", label: "취급메뉴" },
];

function rowsFrom(it: PlaceIntro | undefined, fields: typeof INTRO_FIELDS): { label: string; value: string }[] {
  if (!it) return [];
  const rows: { label: string; value: string }[] = [];
  for (const f of fields) {
    const v = it[f.key];
    if (v && String(v).trim()) rows.push({ label: f.label, value: String(v) });
  }
  return rows;
}

/** 화면에 뿌릴 {label,value} 목록 (값 있는 것만) */
export function introRows(id: string): { label: string; value: string }[] {
  return rowsFrom(intro[id], INTRO_FIELDS);
}

/** 음식점 영업정보 rows (값 있는 것만). 전화(infocenter)는 제외 — 상세에서 tel: 링크로 표시 */
export function restaurantIntroRows(id: string): { label: string; value: string }[] {
  return rowsFrom(restaurantIntro[id], FOOD_INTRO_FIELDS);
}

/** 음식점 문의 전화 (infocenter) — 없으면 undefined */
export function getRestaurantPhone(id: string): string | undefined {
  const v = restaurantIntro[id]?.infocenter;
  return v && String(v).trim() ? String(v) : undefined;
}

// ── 리포트용 통계 ───────────────────────────────────────────────
export function introStats() {
  const ids = Object.keys(intro);
  const withData = ids.filter(
    (id) => Object.keys(intro[id]).filter((k) => k !== "type").length > 0
  ).length;
  return { collected: ids.length, withData };
}
export function infoStats() {
  const ids = Object.keys(info);
  const withData = ids.filter((id) => (info[id] || []).length > 0).length;
  return { collected: ids.length, withData };
}
