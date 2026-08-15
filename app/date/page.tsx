import type { Metadata } from "next";
import { Band, Container } from "@/components/Band";
import AffiliateNotice from "@/components/AffiliateNotice";
import { FilterRow, Chip } from "@/components/FilterChips";
import ScrollRail from "@/components/ScrollRail";
import DateCourseCard from "@/components/DateCourseCard";
import CoupangBanner from "@/components/CoupangBanner";
import { getDateCourses, dateAreaCounts } from "@/lib/dateCourses";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const n = getDateCourses().length;
  return {
    title: `전국 카페데이트 — 카페·공원·맛집 반나절 코스 ${n}곳`,
    description: `카페에서 시작해 걸어서 닿는 공원과 맛집까지, 반나절이면 충분한 카페데이트 코스 ${n}곳. 지역과 동네를 골라 바로 확인하세요.`,
    keywords: ["카페데이트", "전국 카페데이트", "카페 데이트 코스", "반나절 데이트 코스", "카페 공원 맛집 코스"],
    alternates: { canonical: "/date" },
  };
}

export default function DateHubPage() {
  const all = getDateCourses();
  const areas = dateAreaCounts();
  const preview = all.slice(0, 12); // 이동거리 짧은 순

  return (
    <>
      <Band tone="tint" innerClassName="py-4">
        <h1 className="text-[22px] font-black tracking-[-0.02em] text-ink sm:text-[28px]">
          ☕ <span className="text-free">전국 카페데이트</span>
        </h1>
        <AffiliateNotice className="mt-1.5" partner="coupang" />
        <p className="mt-1 text-[13.5px] text-ink-soft">
          카페 → 공원 → 맛집이 서로 가까이 붙어 있는 반나절 코스 {all.length}곳
        </p>
      </Band>

      <div className="bg-panel">
        {/* 지역 선택 — 캠핑과 같은 칩 방식(가로 스크롤 한 줄) */}
        <Container className="space-y-2.5 py-4">
          <FilterRow label="지역">
            {areas.map((a) => (
              <Chip key={a.area} href={`/date/${a.slug}`} active={false} label={a.area} count={a.count} />
            ))}
          </FilterRow>
          <p className="pl-11 text-[12.5px] text-ink-faint">지역을 고르면 동네가 나와요</p>
        </Container>

        <Container className="pb-12 pt-2">
          <div className="mb-1 flex items-baseline gap-2">
            <h2 className="text-[18px] font-extrabold tracking-tight text-ink sm:text-[20px]">가장 가까운 코스</h2>
            <span className="text-[13.5px] font-bold text-free">{preview.length}곳</span>
          </div>
          <p className="mb-3 text-[12.5px] text-ink-faint">세 곳이 서로 가장 가까운 순서예요 · 옆으로 넘겨보세요</p>
          <ScrollRail ariaLabel="가장 가까운 카페데이트 코스">
            {preview.map((c) => <DateCourseCard key={c.id} course={c} rail />)}
          </ScrollRail>

          <div className="mt-8">
            <CoupangBanner />
          </div>
        </Container>
      </div>
    </>
  );
}
