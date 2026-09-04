import { Suspense } from "react";
import type { Metadata } from "next";
import { Band } from "@/components/Band";
import CourseBrowser from "@/components/CourseBrowser";
import InjeAutumnCourse from "@/components/InjeAutumnCourse";
import { filterCourses, getCourseAreaCounts, getCourseCount, slimCourse } from "@/lib/courses";
import { areaFestivals } from "@/lib/festivals";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "전국 여행코스 — 당일치기·1박2일·2박3일 국내 여행 코스",
  description: "전국 여행코스를 지역·기간·테마로 골라보세요. 공식 축제 일정이 확인된 지역은 가을여행과 축제를 함께 찾을 수 있는 코스로 안내합니다.",
  keywords: ["국내여행 코스", "당일치기", "1박2일", "여행코스 추천", "가을여행", "가을축제"],
  alternates: { canonical: "/course" },
};

export default function CoursePage() {
  const total = getCourseCount();
  const courses = filterCourses().map(slimCourse);
  const injeFestival = areaFestivals("강원", { withinDays: 120, limit: 20 })
    .find((festival) => /인제/.test(`${festival.title} ${festival.addr}`));

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          <span className="text-free">🧭 여행코스</span>
        </h1>
        <p className="mt-1 text-[14px] text-ink-soft">
          전국 여행코스 <span className="whitespace-nowrap">{total.toLocaleString()}개</span> — 기간·테마·지역으로 골라보세요
        </p>
      </Band>
      {injeFestival && <InjeAutumnCourse festival={injeFestival} />}
      <Suspense fallback={null}>
        <CourseBrowser courses={courses} areas={getCourseAreaCounts()} total={total} />
      </Suspense>
    </>
  );
}
