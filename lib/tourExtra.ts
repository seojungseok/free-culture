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

/** 대표/취급 메뉴 문자열 (JSON-LD·본문용) — 없으면 undefined */
export function getRestaurantMenu(id: string): string | undefined {
  const it = restaurantIntro[id];
  if (!it) return undefined;
  const v = [it.firstmenu, it.treatmenu].filter((s) => s && String(s).trim()).join(" / ");
  return v || undefined;
}

const DAY_KO: Record<string, string> = {
  월: "Monday", 화: "Tuesday", 수: "Wednesday", 목: "Thursday",
  금: "Friday", 토: "Saturday", 일: "Sunday",
};
const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * schema.org openingHoursSpecification 배열 — usetime에서 HH:MM~HH:MM 추출,
 * restdate에서 정기 휴무 요일 제외. 시간 패턴이 확실할 때만 반환(불명확하면 undefined).
 */
export function restaurantOpeningSpec(id: string):
  | { "@type": "OpeningHoursSpecification"; dayOfWeek: string[]; opens: string; closes: string }[]
  | undefined {
  const it = restaurantIntro[id];
  if (!it?.usetime) return undefined;
  const m = String(it.usetime).match(/(\d{1,2}):(\d{2})\s*[~\-–]\s*(\d{1,2}):(\d{2})/);
  if (!m) return undefined;
  const pad = (h: string, mm: string) => `${String(Number(h)).padStart(2, "0")}:${mm}`;
  const opens = pad(m[1], m[2]);
  const closes = pad(m[3], m[4]);

  // 휴무 요일 파싱 — "매주 토요일", "토,일요일" 등. 24시간/연중무휴면 전체 유지.
  // 주의: "토요일"의 "요일"에 든 "일"을 일요일로 오인하면 안 됨 → 요일 글자 바로 앞/구분자 앞만 인정.
  const rest = String(it.restdate || "");
  const closed = new Set<string>();
  if (!/무휴|없음|24시간|연중/.test(rest)) {
    for (const mm of rest.matchAll(/([월화수목금토일])(?=\s*요일|\s*[,·/])/g)) {
      closed.add(DAY_KO[mm[1]]);
    }
    // 요일·구분자가 전혀 없는 축약형("화 휴무")만 단일 글자 스캔
    if (!closed.size && !/요일|[,·/]/.test(rest)) {
      for (const [ko, en] of Object.entries(DAY_KO)) {
        if (rest.includes(ko)) closed.add(en);
      }
    }
  }
  const dayOfWeek = ALL_DAYS.filter((d) => !closed.has(d));
  if (!dayOfWeek.length) return undefined;
  return [{ "@type": "OpeningHoursSpecification", dayOfWeek, opens, closes }];
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
