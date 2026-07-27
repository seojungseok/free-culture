// 캐시된 방문 팁(detailIntro2)·볼거리(detailInfo2) 접근 — 상세 페이지 서빙용.
// 수집: scripts/collectIntro.mjs → data/place-intro.json / collectInfo.mjs → data/place-info.json
// 미리 저장 → 서빙(런타임 API 호출 없음, 방문 증가와 무관).
import introData from "@/data/place-intro.json";
import infoData from "@/data/place-info.json";
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

export function getIntro(id: string): PlaceIntro | undefined {
  return intro[id];
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

/** 화면에 뿌릴 {label,value} 목록 (값 있는 것만) */
export function introRows(id: string): { label: string; value: string }[] {
  const it = intro[id];
  if (!it) return [];
  const rows: { label: string; value: string }[] = [];
  for (const f of INTRO_FIELDS) {
    const v = it[f.key];
    if (v && String(v).trim()) rows.push({ label: f.label, value: String(v) });
  }
  return rows;
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
