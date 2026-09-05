import type { Metadata } from "next";
import ChuseokPlanner, { type ChuseokPlannerEvent } from "@/components/ChuseokPlanner";
import { getAllEvents } from "@/lib/data";
import { getChuseokEvents, CHUSEOK_START, CHUSEOK_END } from "@/lib/chuseok";

export const revalidate = 3600;
export const metadata: Metadata = { title: "2026 추석에 뭐하지? | 전국 추석 행사·가볼만한곳", description: "지역, 동행자, 목적, 날짜로 실제 추석 행사와 가볼 만한 곳을 찾아보세요.", alternates: { canonical: "/chuseok" } };

export default function ChuseokPage() {
  const flags = (text: string, kids = false) => ({ isKids: kids || /어린이|아이|가족/.test(text), isFamily: /가족|어린이|체험/.test(text), isParents: /전통|역사|궁|한옥|국악|전시/.test(text), isCouple: /야간|음악|공연|전시|데이트/.test(text), isFestival: /축제|페스티벌|마당/.test(text), isExperience: /체험|만들기|워크숍|교육/.test(text), isIndoor: /전시|미술관|박물관|공연장|실내/.test(text), isOutdoor: /야외|공원|광장|산책|마당|축제/.test(text) });
  const current: ChuseokPlannerEvent[] = getAllEvents().filter((e) => e.endDate >= CHUSEOK_START && e.startDate <= CHUSEOK_END).map((e) => ({ id: `event-${e.id}`, title: e.title, area: e.area, sigungu: e.sigungu, place: e.place, startDate: e.startDate, endDate: e.endDate, image: e.imgUrl, href: `/event/${e.id}`, priceLabel: e.priceLabel, isFree: e.priceType === "free" || e.priceType === "free_estimated", isTraditional: /전통|한옥|민속|궁궐|역사/.test(`${e.title} ${e.realmName} ${e.contents}`), lat: e.gpsY, lng: e.gpsX, ...flags(`${e.title} ${e.realmName} ${e.contents}`, e.audiences?.includes("kids")) }));
  const official: ChuseokPlannerEvent[] = getChuseokEvents().map((e) => ({ id: e.id, title: e.title, area: e.area, sigungu: e.sigungu, place: e.place, startDate: e.startDate, endDate: e.endDate, image: e.image, href: e.officialUrl || "/events", priceLabel: e.isFree ? "무료" : "공식 안내 확인", isFree: e.isFree, isTraditional: e.isTraditional, lat: e.lat, lng: e.lng, ...flags(`${e.title} ${e.description} ${e.place}`, e.isKids) }));
  const events = [...official, ...current.filter((e) => !official.some((o) => o.title === e.title))];
  return <main><ChuseokPlanner events={events} /></main>;
}
