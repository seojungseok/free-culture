import type { Metadata } from "next";
import ChuseokPlanner, { type ChuseokPlannerEvent } from "@/components/ChuseokPlanner";
import ChuseokGuide, { type GuideItem } from "@/components/ChuseokGuide";
import { getAllEvents } from "@/lib/data";
import { getAllPlaces } from "@/lib/tour";
import { getAllCourses } from "@/lib/courses";
import { getAllRestaurants } from "@/lib/food";
import { getChuseokEvents, CHUSEOK_START, CHUSEOK_END } from "@/lib/chuseok";

export const revalidate = 3600;
export const metadata: Metadata = { title: "2026 추석에 뭐하지? | 연휴 나들이·여행코스 추천", description: "서울, 경기, 인천의 실제 나들이·여행코스·맛집 콘텐츠에서 추석 연휴에 갈 곳을 골라보세요.", alternates: { canonical: "/chuseok" } };

export default function ChuseokPage() {
  const flags = (text: string, kids = false) => ({ isKids: kids || /어린이|아이|가족/.test(text), isFamily: /가족|어린이|체험/.test(text), isParents: /전통|역사|궁|한옥|국악|전시/.test(text), isCouple: /야간|음악|공연|전시|데이트/.test(text), isFestival: /축제|페스티벌|마당/.test(text), isExperience: /체험|만들기|워크숍|교육/.test(text), isIndoor: /전시|미술관|박물관|공연장|실내/.test(text), isOutdoor: /야외|공원|광장|산책|마당|축제/.test(text) });
  const current: ChuseokPlannerEvent[] = getAllEvents().filter((e) => e.endDate >= CHUSEOK_START && e.startDate <= CHUSEOK_END).map((e) => ({ id: `event-${e.id}`, title: e.title, area: e.area, sigungu: e.sigungu, place: e.place, startDate: e.startDate, endDate: e.endDate, image: e.imgUrl, href: `/event/${e.id}`, priceLabel: e.priceLabel, isFree: e.priceType === "free" || e.priceType === "free_estimated", isTraditional: /전통|한옥|민속|궁궐|역사/.test(`${e.title} ${e.realmName} ${e.contents}`), lat: e.gpsY, lng: e.gpsX, ...flags(`${e.title} ${e.realmName} ${e.contents}`, e.audiences?.includes("kids")) }));
  const official: ChuseokPlannerEvent[] = getChuseokEvents().map((e) => ({ id: e.id, title: e.title, area: e.area, sigungu: e.sigungu, place: e.place, startDate: e.startDate, endDate: e.endDate, image: e.image, href: e.officialUrl || "/events", priceLabel: e.isFree ? "무료" : "공식 안내 확인", isFree: e.isFree, isTraditional: e.isTraditional, lat: e.lat, lng: e.lng, ...flags(`${e.title} ${e.description} ${e.place}`, e.isKids) }));
  const events = [...official, ...current.filter((e) => !official.some((o) => o.title === e.title))];
  const guideItems: GuideItem[] = [
    ...getAllPlaces().filter((p) => ["서울", "경기", "인천"].includes(p.area) && p.image).slice(0, 48).map((p) => ({ id: `place-${p.id}`, title: p.title, area: p.area, kind: "나들이", image: p.image, href: `/places/spot/${p.id}`, summary: p.overview || p.addr, tags: ["가족", ...(p.isKid ? ["아이와"] : []), ...(/공원|산책|야외|정원|호수/.test(`${p.title} ${p.addr}`) ? ["데이트"] : []), ...(/반려|애견/.test(`${p.title} ${p.overview || ""}`) ? ["반려동물"] : [])] })),
    ...getAllCourses().filter((c) => ["서울", "경기", "인천"].includes(c.area) && c.image).slice(0, 18).map((c) => ({ id: `course-${c.id}`, title: c.title, area: c.area, kind: "여행코스", image: c.image, href: `/course/c/${c.id}`, summary: c.overview, tags: ["가족", "데이트", ...((c.themes || []).includes("가족체험") ? ["아이와"] : [])] })),
    ...getAllRestaurants().filter((r) => ["서울", "경기", "인천"].includes(r.area) && r.image).slice(0, 18).map((r) => ({ id: `food-${r.id}`, title: r.title, area: r.area, kind: "맛집탐방", image: r.image, href: `/food/spot/${r.id}`, summary: r.addr, tags: ["가족", "데이트"] })),
  ];
  return <main><ChuseokGuide items={guideItems} /><details className="mx-auto mb-8 max-w-[1180px] px-5 sm:px-6"><summary className="cursor-pointer rounded-xl border border-line bg-white px-4 py-3 text-sm font-black text-ink">행사 날짜·지역으로 더 자세히 찾기</summary><ChuseokPlanner events={events} /></details></main>;
}
