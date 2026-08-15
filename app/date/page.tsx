import type { Metadata } from "next";
import Link from "next/link";
import { Band, Container } from "@/components/Band";
import DateCourseCard from "@/components/DateCourseCard";
import { getDateCourses, dateAreaCounts } from "@/lib/dateCourses";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const n = getDateCourses().length;
  return {
    title: `전국 카페데이트 — 카페·공원·맛집 반나절 코스 ${n}곳`,
    description: `카페에서 시작해 걸어서 닿는 공원과 맛집까지, 반나절이면 충분한 카페데이트 코스 ${n}곳. 지역별로 골라보세요.`,
    keywords: ["카페데이트", "전국 카페데이트", "카페 데이트 코스", "반나절 데이트 코스", "카페 공원 맛집 코스"],
    alternates: { canonical: "/date" },
  };
}

export default function DateHubPage() {
  const all = getDateCourses();
  const areas = dateAreaCounts();
  const featured = all.slice(0, 12); // 이동거리 짧은 순 = 걷기 좋은 순

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          ☕ <span className="text-free">전국 카페데이트</span>
        </h1>
        <p className="mt-1 text-[14px] text-ink-soft">
          카페 → 공원 → 맛집, 걸어서 이어지는 반나절 코스 {all.length}곳 — 하루를 통째로 비우지 않아도 되는 동선이에요
        </p>
      </Band>

      <div className="bg-panel">
        <Container className="py-5">
          <h2 className="mb-3 text-[17px] font-extrabold text-ink">지역별 카페데이트</h2>
          <div className="flex flex-wrap gap-2">
            {areas.map((a) => (
              <Link key={a.area} href={`/date/${a.slug}`}
                className="rounded-full border border-line bg-white px-3.5 py-2 text-[13.5px] font-bold text-ink-soft transition hover:border-free hover:text-free">
                {a.area} 카페데이트 <span className="text-[12px] font-black text-free">{a.count}</span>
              </Link>
            ))}
          </div>
        </Container>

        <Container className="pb-12 pt-2">
          <div className="mb-1 flex items-baseline gap-2">
            <h2 className="text-[20px] font-extrabold tracking-tight text-ink sm:text-[22px]">가장 걷기 좋은 코스</h2>
            <span className="text-[14px] font-bold text-free">{featured.length}곳</span>
          </div>
          <p className="mb-4 text-[13px] text-ink-faint">세 곳 사이 이동거리가 가장 짧은 순서예요</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => <DateCourseCard key={c.id} course={c} />)}
          </div>

          <p className="mt-8 text-[12px] text-ink-faint">
            코스는 카페를 기준으로 반경 3km 안의 공원·맛집을 좌표로 묶어 자동 구성했어요 · 정보 제공: 한국관광공사
          </p>
        </Container>
      </div>
    </>
  );
}
