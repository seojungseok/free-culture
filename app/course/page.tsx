import { Suspense } from "react";
import type { Metadata } from "next";
import { Band } from "@/components/Band";
import CourseBrowser from "@/components/CourseBrowser";
import { filterCourses, getCourseAreaCounts, getCourseCount, slimCourse } from "@/lib/courses";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "전국 여행코스 — 당일치기·1박2일·2박3일 국내 여행 코스",
  description: "전국 여행코스를 지역·기간·테마로 골라보세요. 가볼만한 곳을 이어 만든 하루 동선부터 1박2일·2박3일까지, 해수욕장 베스트까지.",
  keywords: ["국내여행 코스", "당일치기", "1박2일", "여행코스 추천"],
  alternates: { canonical: "/course" },
};

export default function CoursePage() {
  const total = getCourseCount();
  const courses = filterCourses().map(slimCourse);

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
      <Suspense fallback={null}>
        <CourseBrowser courses={courses} areas={getCourseAreaCounts()} total={total} />
      </Suspense>
    </>
  );
}
