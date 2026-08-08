import type { Metadata } from "next";
import Link from "next/link";
import { Band } from "@/components/Band";
import CourseCard from "@/components/CourseCard";
import {
  getAllCourses, getCourseCount, getCourseAreaCounts, getThemeCounts,
  THEMES, DURATIONS, areaSlug, slimCourse, filterCourses, themeEmoji,
} from "@/lib/courses";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "여행코스 — 지역별 당일치기·1박2일 국내 여행 코스 추천",
  description:
    "전국 여행코스를 지역·기간·테마로 골라보세요. 여름 바다·피서 코스부터 문화유적·자연 힐링까지, 여기 들렀다 밥 먹고 다음 코스로 이어지는 하루 여행 일정.",
  keywords: ["여행코스", "국내여행 코스", "당일치기 여행", "1박2일 코스", "여름 여행코스", "가볼만한곳 코스"],
  alternates: { canonical: "/course" },
};

export default function CoursePage() {
  const total = getCourseCount();
  const areas = getCourseAreaCounts();
  const themeCounts = getThemeCounts();
  const beach = filterCourses({ theme: "바다피서", limit: 8 }).map(slimCourse);
  const all = getAllCourses().slice(0, 60).map(slimCourse);

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          <span className="text-free">여행코스</span>
        </h1>
        <p className="mt-1 text-[14px] text-ink-soft">
          여기 들렀다 밥 먹고 다음 코스로 — 지역·기간·테마로 고르는 하루 여행 <span className="whitespace-nowrap">{total.toLocaleString()}개</span>
        </p>
      </Band>

      <div className="mx-auto w-full max-w-[1280px] px-5 pb-16 pt-4 sm:px-6 lg:px-8">
        {/* 여름 피서 피처 */}
        {beach.length > 0 && (
          <section className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[17px] font-extrabold text-ink">🌊 여름 바다·피서 코스</h2>
              <Link href="/course/theme/beach" className="text-[12.5px] font-bold text-free hover:underline">더보기 ›</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {beach.map((c) => <CourseCard key={c.id} course={c} />)}
            </div>
          </section>
        )}

        {/* 테마 칩 */}
        <section className="mb-4">
          <h2 className="mb-2 text-[13px] font-bold text-ink-faint">테마별</h2>
          <div className="flex flex-wrap gap-2">
            {THEMES.filter((t) => themeCounts[t.key]).map((t) => (
              <Link key={t.slug} href={`/course/theme/${t.slug}`}
                className="rounded-full bg-white px-3 py-1.5 text-[13px] font-bold text-ink-soft ring-1 ring-line transition hover:bg-tint hover:text-freedark">
                {t.emoji} {t.label} <span className="text-ink-faint">{themeCounts[t.key]}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 지역 칩 */}
        <section className="mb-6">
          <h2 className="mb-2 text-[13px] font-bold text-ink-faint">지역별</h2>
          <div className="flex flex-wrap gap-2">
            {areas.map(({ area, count }) => (
              <Link key={area} href={`/course/${areaSlug(area)}`}
                className="rounded-full bg-white px-3 py-1.5 text-[13px] font-bold text-ink-soft ring-1 ring-line transition hover:bg-tint hover:text-freedark">
                {area} <span className="text-ink-faint">{count}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 전체 그리드 */}
        <section>
          <h2 className="mb-2 text-[17px] font-extrabold text-ink">전체 코스</h2>
          {all.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {all.map((c) => <CourseCard key={c.id} course={c} />)}
            </div>
          ) : (
            <p className="rounded-2xl bg-panel px-4 py-10 text-center text-[14px] text-ink-faint">
              코스 글을 준비 중이에요. 곧 지역별 여행 코스가 올라옵니다 🧭
            </p>
          )}
        </section>
      </div>
    </>
  );
}
