import { Suspense } from "react";
import type { Metadata } from "next";
import type { CultureEvent } from "@/lib/types";
import { getByAudience, slimForClient } from "@/lib/data";
import { getKidTours } from "@/lib/tour";
import FilterableGrid from "@/components/FilterableGrid";
import TourCard from "@/components/TourCard";
import { Band, Container } from "@/components/Band";

export const metadata: Metadata = {
  title: "아이와 갈만한 곳 — 문화행사 + 가볼만한 명소",
  description:
    "아동·가족·체험 문화행사와 전국 박물관·과학관·테마파크 등 아이와 나들이하기 좋은 곳을 한곳에. 무료 행사만 골라 볼 수도 있어요.",
  alternates: { canonical: "/kids" },
};

export default function KidsPage() {
  const events = getByAudience("kids");
  const tours = getKidTours(undefined, 24);

  return (
    <>
      <Band tone="tint" innerClassName="py-6">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          아이와 <span className="text-free">함께</span>
        </h1>
        <p className="mt-1 text-[14px] text-ink-soft">
          가족·체험 문화행사 {events.length.toLocaleString()}건과 아이와 가볼만한 전국 명소
        </p>
      </Band>

      <div className="bg-panel">
        <Container className="pb-12 pt-6">
          {/* 문화행사 */}
          <div className="mb-4 flex items-baseline gap-2">
            <h2 className="text-[18px] font-extrabold text-ink">🎪 아이와 함께 가는 문화행사</h2>
            <span className="text-[13px] font-bold text-free">{events.length.toLocaleString()}건</span>
          </div>
          <Suspense fallback={null}>
            <FilterableGrid events={slimForClient(events) as CultureEvent[]} />
          </Suspense>

          {/* 관광지 (TourAPI) — 문화행사와 구분 */}
          {tours.length > 0 && (
            <section className="mt-14 border-t border-line pt-8">
              <h2 className="text-[18px] font-extrabold text-ink">🏞️ 아이와 나들이</h2>
              <p className="mt-1 text-[13px] text-ink-faint">
                박물관·과학관·수목원·테마파크 등 아이와 나들이하기 좋은 전국 명소 (지도 링크 제공)
              </p>
              <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {tours.map((t) => (
                  <TourCard key={t.id} spot={t} />
                ))}
              </div>
              <p className="mt-6 text-[12px] text-ink-faint">
                관광정보 제공: 한국관광공사 (TourAPI)
              </p>
            </section>
          )}
        </Container>
      </div>
    </>
  );
}
