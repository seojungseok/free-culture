import type { Metadata } from "next";
import { Band, Container } from "@/components/Band";
import AffiliateNotice from "@/components/AffiliateNotice";
import { FilterRow, Chip } from "@/components/FilterChips";
import ScrollRail from "@/components/ScrollRail";
import DateCourseCard from "@/components/DateCourseCard";
import NearbyDateCourses from "@/components/NearbyDateCourses";
import CoupangBanner from "@/components/CoupangBanner";
import { getDateCourses, dateAreaCounts, walkCourses, driveCourses, dateCourseGeo } from "@/lib/dateCourses";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const n = getDateCourses().length;
  return {
    title: `전국 카페데이트 — 카페·공원·맛집 반나절 코스 ${n}곳`,
    description: `카페에서 시작해 공원과 맛집까지, 반나절이면 충분한 카페데이트 코스 ${n}곳. 걸어서 도는 코스와 차로 도는 코스, 내 위치에서 가까운 코스까지 골라보세요.`,
    keywords: ["카페데이트", "전국 카페데이트", "카페 데이트 코스", "반나절 데이트 코스", "카페 공원 맛집 코스", "내 주변 카페데이트"],
    alternates: { canonical: "/date" },
  };
}

export default function DateHubPage() {
  const all = getDateCourses();
  const areas = dateAreaCounts();
  const walk = walkCourses().slice(0, 12);
  const drive = driveCourses().slice(0, 12);
  const geo = dateCourseGeo();

  return (
    <>
      <Band tone="tint" innerClassName="py-4">
        <h1 className="text-[22px] font-black tracking-[-0.02em] text-ink sm:text-[28px]">
          ☕ <span className="text-free">전국 카페데이트</span>
        </h1>
        <AffiliateNotice className="mt-1.5" partner="coupang" />
        <p className="mt-1 text-[13.5px] text-ink-soft">
          카페 → 공원 → 맛집으로 이어지는 반나절 데이트 코스 {all.length}곳
        </p>
      </Band>

      <div className="bg-panel">
        {/* 안내 글 — 무엇을·어떻게 (읽기 편한 여백) */}
        <Container className="pt-5">
          <div className="space-y-3.5 text-[14.5px] leading-[1.8] text-ink-soft">
            <p>
              어디서 만나 뭘 할지 고민되는 날, 동선까지 짜인 코스가 있으면 한결 편해요.
              분위기 좋은 <b className="font-bold text-ink">카페</b>에서 시작해, 걷기 좋은{" "}
              <b className="font-bold text-ink">공원·산책길</b>을 지나, 근처{" "}
              <b className="font-bold text-ink">맛집</b>에서 마무리하는 반나절 코스만 모았어요.
            </p>
            <p>
              세 곳이 실제 지도상 가까이 붙어 있는 조합만 골랐기 때문에, 이동에 힘 빼지 않고
              데이트에 집중할 수 있어요. 아래에서 <b className="font-bold text-ink">걸어서 도는 코스</b>와{" "}
              <b className="font-bold text-ink">차로 도는 코스</b> 중 취향에 맞게 골라보세요.
            </p>
          </div>
        </Container>

        {/* 위치기반 — 내 위치에서 가까운 코스 */}
        <Container className="pt-5">
          <NearbyDateCourses courses={geo} />
        </Container>

        {/* 지역 선택 */}
        <Container className="space-y-2.5 py-5">
          <FilterRow label="지역">
            {areas.map((a) => (
              <Chip key={a.area} href={`/date/${a.slug}`} active={false} label={a.area} count={a.count} />
            ))}
          </FilterRow>
          <p className="pl-11 text-[12.5px] text-ink-faint">지역을 고르면 동네별 코스가 나와요</p>
        </Container>

        {/* 걸어서 도는 코스 */}
        {walk.length > 0 && (
          <Container className="pb-2 pt-2">
            <div className="mb-1 flex items-baseline gap-2">
              <h2 className="text-[18px] font-extrabold tracking-tight text-ink sm:text-[20px]">🚶 걸어서 도는 코스</h2>
              <span className="text-[13.5px] font-bold text-free">{walk.length}곳</span>
            </div>
            <p className="mb-3 text-[12.5px] text-ink-faint">카페·공원·맛집이 걸어서 이어지는 코스예요 · 옆으로 넘겨보세요</p>
            <ScrollRail ariaLabel="걸어서 도는 카페데이트 코스">
              {walk.map((c) => <DateCourseCard key={c.id} course={c} rail mode="walk" />)}
            </ScrollRail>
          </Container>
        )}

        {/* 차로 도는 코스 */}
        {drive.length > 0 && (
          <Container className="pb-2 pt-6">
            <div className="mb-1 flex items-baseline gap-2">
              <h2 className="text-[18px] font-extrabold tracking-tight text-ink sm:text-[20px]">🚗 차로 도는 코스</h2>
              <span className="text-[13.5px] font-bold text-free">{drive.length}곳</span>
            </div>
            <p className="mb-3 text-[12.5px] text-ink-faint">조금 떨어져 있어 차로 움직이면 편한 코스예요 · 옆으로 넘겨보세요</p>
            <ScrollRail ariaLabel="차로 도는 카페데이트 코스">
              {drive.map((c) => <DateCourseCard key={c.id} course={c} rail mode="drive" />)}
            </ScrollRail>
          </Container>
        )}

        <Container className="pb-12 pt-2">
          <div className="mt-8">
            <CoupangBanner />
          </div>
        </Container>
      </div>
    </>
  );
}
