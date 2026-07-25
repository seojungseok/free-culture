import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllEvents, slimForClient } from "@/lib/data";
import DateBrowser from "@/components/DateBrowser";
import { Band } from "@/components/Band";

export const metadata: Metadata = {
  title: "전국 문화행사 — 무료·저렴 전시·공연·축제",
  description:
    "전국의 무료·저렴한 전시·공연·축제·체험을 날짜·지역·분야·가격으로 골라보세요. 매일 자동 업데이트됩니다.",
  alternates: { canonical: "/events" },
};

export default function EventsPage() {
  const events = slimForClient(getAllEvents());
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
      <Suspense fallback={null}>
        <DateBrowser events={events} openFilters />
      </Suspense>
    </>
  );
}
