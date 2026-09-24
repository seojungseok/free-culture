import { Suspense } from "react";
import type { Metadata } from "next";
import { Band } from "@/components/Band";
import CourseBrowser from "@/components/CourseBrowser";
import InjeAutumnCourse from "@/components/InjeAutumnCourse";
import { filterCourses, getCourseAreaCounts, getCourseCount, slimCourse } from "@/lib/courses";
import { areaFestivals } from "@/lib/festivals";
import Link from "next/link";
import InitialIndexPreview from "@/components/InitialIndexPreview";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "전국 여행코스 — 당일치기·1박2일·2박3일 국내 여행 코스",
  description: "전국 여행코스를 지역·기간·테마로 골라보세요. 공식 축제 일정이 확인된 지역은 가을여행과 축제를 함께 찾을 수 있는 코스로 안내합니다.",
  keywords: ["국내여행 코스", "당일치기", "1박2일", "여행코스 추천", "가을여행", "가을축제"],
  alternates: { canonical: "/course" },
};

export default function CoursePage() {
  const total = getCourseCount();
  const publishedCourses = filterCourses();
  const courses = publishedCourses.map(slimCourse);
  const preview = publishedCourses.slice(0, 18).map((course) => ({
    href: `/course/c/${course.id}`, title: course.title,
    meta: `${course.area} · ${course.stops.slice(0, 3).map((stop) => stop.name).join(" → ")}`,
  }));
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
      <section className="mx-auto max-w-6xl px-5 py-6 text-sm leading-7 text-ink-soft sm:px-6">
        <h2 className="text-lg font-extrabold text-ink">내 일정에 맞는 코스 고르기</h2>
        <p className="mt-2">당일치기는 이동 시간을 먼저 보고 방문지를 좁혀 보세요. 1박 2일이나 2박 3일 코스는 숙박과 운영일을 함께 확인하면 계획을 세우기 쉽습니다. 아래에서 지역·기간·테마를 고를 수 있으며, 각 코스에 포함된 장소와 이동 순서는 상세페이지에서 확인할 수 있습니다. 행사와 묶어 가려면 날짜가 겹치는지도 따로 살펴보세요.</p>
        <p className="mt-2">지역부터 정했다면 <Link href="/region/seoul" className="font-semibold text-brandblue underline">서울 이번 주말 정보</Link>처럼 지역 페이지를 보고, 캠핑을 포함한 일정은 <Link href="/camping" className="font-semibold text-brandblue underline">캠핑장 조건 검색</Link>에서 시설과 예약 정보를 비교할 수 있습니다.</p>
      </section>
      {injeFestival && <InjeAutumnCourse festival={injeFestival} />}
      <Suspense fallback={<InitialIndexPreview title="등록된 여행코스" items={preview} />}>
        <CourseBrowser courses={courses} areas={getCourseAreaCounts()} total={total} />
      </Suspense>
    </>
  );
}
