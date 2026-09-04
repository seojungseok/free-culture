import type { Metadata } from "next";
import Link from "next/link";
import ChuseokPlanner, { type ChuseokPlannerEvent } from "@/components/ChuseokPlanner";
import { getAllEvents } from "@/lib/data";
import { getChuseokEvents } from "@/lib/chuseok";
import { todayYmd } from "@/lib/dates";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "2026 추석에 뭐하지? | 가까운 문화행사·가족 나들이 빠른 찾기",
  description: "2026 추석 연휴에 내 주변 문화행사, 가족과 함께 갈 곳, 무료 행사와 전통문화를 빠르게 골라보세요.",
  keywords: ["2026 추석에 뭐하지", "추석 연휴 가볼만한곳", "추석 문화행사", "추석 가족 나들이", "추석 무료 행사"],
  alternates: { canonical: "/chuseok" },
};

const START = "20260901";
const END = "20260930";

export default function ChuseokPage() {
  const current = getAllEvents().filter((event) => event.endDate >= START && event.startDate <= END).map((event) => ({
    id: `event-${event.id}`, title: event.title, area: event.area, sigungu: event.sigungu, place: event.place,
    startDate: event.startDate, endDate: event.endDate, image: event.imgUrl, href: `/event/${event.id}`,
    priceLabel: event.priceLabel, isFree: event.priceType === "free" || event.priceType === "free_estimated", isKids: event.audiences?.includes("kids") || false,
    isTraditional: /전통|한옥|민속|궁궐|역사/.test(`${event.title} ${event.realmName} ${event.contents}`), lat: event.gpsY, lng: event.gpsX,
  } satisfies ChuseokPlannerEvent));
  const official = getChuseokEvents().map((event) => ({
    id: event.id, title: event.title, area: event.area, sigungu: event.sigungu, place: event.place,
    startDate: event.startDate, endDate: event.endDate, image: event.image, href: event.officialUrl || "/events",
    priceLabel: event.isFree ? "무료" : "공식 안내 확인", isFree: event.isFree, isKids: event.isKids, isTraditional: event.isTraditional, lat: event.lat, lng: event.lng,
  } satisfies ChuseokPlannerEvent));
  const events = [...official, ...current.filter((event) => !official.some((item) => item.title === event.title))].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const ended = todayYmd() > END;
  return ended ? <main className="mx-auto max-w-[1180px] px-5 py-12 text-center sm:px-6 lg:px-8"><h1 className="text-2xl font-black text-ink">2026 추석 연휴가 종료되었습니다.</h1><p className="mt-3 text-sm text-ink-soft">이번 주말 문화행사와 가을 나들이 정보를 확인해 보세요.</p><div className="mt-6 flex justify-center gap-3"><Link href="/events" className="rounded-lg bg-ink px-4 py-2.5 text-sm font-bold text-white">문화행사 보기</Link><Link href="/season" className="rounded-lg border border-line px-4 py-2.5 text-sm font-bold text-ink">가을나들이 보기</Link></div></main> : <main><ChuseokPlanner events={events} /></main>;
}
