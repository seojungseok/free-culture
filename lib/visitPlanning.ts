import { isUsefulDisplayValue } from "@/lib/displayValue";

export interface VisitCheck { id: string; title: string; detail: string }
export interface VisitFacts {
  kind: "place" | "food" | "camp";
  hours?: string; closed?: string; fee?: string; parking?: string; parkingFee?: string;
  reservation?: string; menu?: string; pet?: string; stroller?: string;
  season?: string; facilities?: string[];
}
const useful = (value?: string) => isUsefulDisplayValue(value) ? value!.trim() : "";
export function visitChecks(facts: VisitFacts): VisitCheck[] {
  const checks: VisitCheck[] = [];
  const hours = useful(facts.hours), closed = useful(facts.closed), season = useful(facts.season);
  checks.push({
    id: "schedule", title: facts.kind === "camp" ? "이용 날짜와 운영기간 확인" : "방문 날짜와 운영시간 맞추기",
    detail: [hours && `안내 시간: ${hours}`, closed && `휴무 안내: ${closed}`, season && `운영기간: ${season}`].filter(Boolean).join(" · ")
      || "운영시간과 휴무일 안내가 없습니다. 방문 날짜에 이용 가능한지 운영처에 확인해 주세요.",
  });
  if (facts.kind === "food") {
    const menu = useful(facts.menu);
    if (menu) checks.push({ id: "menu", title: "먹을 메뉴와 주문 조건 확인", detail: `안내 메뉴: ${menu}. 메뉴별 가격과 주문 가능 여부는 매장에서 확인해 주세요.` });
  } else if (facts.kind === "camp") {
    checks.push({ id: "reservation", title: "예약 방법과 이용 구역 확인", detail: useful(facts.reservation) ? `예약 안내: ${useful(facts.reservation)}. 선택한 구역의 입실·퇴실 시간과 취소 조건을 확인해 주세요.` : "예약 방법 안내가 없습니다. 운영처에 빈자리, 이용 구역, 입실·퇴실 시간과 취소 조건을 확인해 주세요." });
    const facilities = facts.facilities || [];
    checks.push({ id: "facilities", title: "필요한 시설과 준비물 맞추기", detail: facilities.length ? `등록 시설: ${facilities.join(" · ")}. 이용 위치와 운영 여부를 확인해 필요한 준비물을 챙겨 주세요.` : "등록된 시설 안내가 부족합니다. 전기·화장실·샤워실 등 필요한 시설의 제공 여부를 확인해 주세요." });
  } else {
    checks.push({ id: "fee", title: "이용 범위와 요금 확인", detail: useful(facts.fee) ? `요금 안내: ${useful(facts.fee)}` : "세부 요금 안내가 없습니다. 입장과 체험·주차 등의 비용이 별도인지 확인해 주세요." });
    if (useful(facts.reservation)) checks.push({ id: "reservation", title: "예약 조건 확인", detail: `예약 안내: ${useful(facts.reservation)}` });
  }
  if (useful(facts.parking)) checks.push({ id: "parking", title: "주차 안내와 접근 경로 확인", detail: [`주차 안내: ${useful(facts.parking)}`, useful(facts.parkingFee) && `주차요금: ${useful(facts.parkingFee)}`].filter(Boolean).join(" · ") });
  if (useful(facts.pet)) checks.push({ id: "pet", title: "반려동물 동반 조건 확인", detail: `동반 안내: ${useful(facts.pet)}. 출입 구역과 추가 조건은 운영처 안내를 확인해 주세요.` });
  else if (useful(facts.stroller)) checks.push({ id: "stroller", title: "유모차 대여 조건 확인", detail: `대여 안내: ${useful(facts.stroller)}. 유모차로 이동할 수 있는 구역을 뜻하는 정보는 아닙니다.` });
  return checks.slice(0, 5);
}
