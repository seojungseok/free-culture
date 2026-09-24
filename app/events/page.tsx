import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllEvents, slimForClient } from "@/lib/data";
import DateBrowser from "@/components/DateBrowser";
import { Band } from "@/components/Band";
import InitialIndexPreview from "@/components/InitialIndexPreview";
import { todayYmd } from "@/lib/dates";
import { fmtRange } from "@/lib/format";

// 목록은 하루 1회 재생성 → 새 행사 하루 내 반영
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "전국 문화행사 — 무료·저렴 전시·공연·축제",
  description:
    "전국의 무료·저렴한 전시·공연·축제·체험을 날짜·지역·분야·가격으로 골라보세요. 매일 자동 업데이트됩니다.",
  alternates: { canonical: "/events" },
};

export default function EventsPage() {
  const events = slimForClient(getAllEvents());
  const preview = events.filter((event) => event.endDate >= todayYmd()).slice(0, 18)
    .map((event) => ({ href: `/event/${event.id}`, title: event.title, meta: `${event.area} · ${fmtRange(event.startDate, event.endDate)} · ${event.place || "장소 확인 필요"}` }));
  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          전국 <span className="text-free">문화행사</span>
        </h1>
        <p className="mt-1 text-[14px] text-ink-soft">
          무료·저렴 전시·공연·축제를 날짜·지역·분야·가격으로 골라보세요
        </p>
      </Band>
      <Suspense fallback={<InitialIndexPreview title="현재 등록된 문화행사" items={preview} />}>
        <DateBrowser events={events} openFilters />
      </Suspense>
    </>
  );
}
