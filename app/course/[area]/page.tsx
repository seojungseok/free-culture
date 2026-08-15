import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Band } from "@/components/Band";
import AffiliateNotice from "@/components/AffiliateNotice";
import CourseCard from "@/components/CourseCard";
import SeoulStayBanner from "@/components/SeoulStayBanner";
import { stayLinkFor } from "@/lib/stayLinks";
import {
  filterCourses, getCourseAreaCounts, getDurationCounts, getThemeCounts,
  DURATIONS, THEMES, areaSlug, sidoFromSlug, durationSlug, slimCourse,
} from "@/lib/courses";

export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams() {
  return getCourseAreaCounts().map(({ area }) => ({ area: areaSlug(area) }));
}

export async function generateMetadata({ params }: { params: Promise<{ area: string }> }): Promise<Metadata> {
  const { area: slug } = await params;
  const area = sidoFromSlug(slug);
  if (!area) return {};
  return {
    title: `${area} 여행코스 — 당일치기·1박2일 ${area} 여행 일정 추천`,
    description: `${area} 여행코스를 기간·테마별로 모았어요. ${area} 가볼만한 곳을 이어 하루 동선으로, 밥집까지 함께. 당일치기부터 1박2일까지.`,
    keywords: [`${area} 여행코스`, `${area} 여행`, `${area} 당일치기`, `${area} 1박2일`, `${area} 가볼만한곳`],
    alternates: { canonical: `/course/${slug}` },
  };
}

export default async function CourseAreaPage({ params }: { params: Promise<{ area: string }> }) {
  const { area: slug } = await params;
  const area = sidoFromSlug(slug);
  if (!area) notFound();

  const list = filterCourses({ area }).map(slimCourse);
  if (list.length === 0) notFound();

  const durCounts = getDurationCounts(area);
  const themeCounts = getThemeCounts();
  const otherAreas = getCourseAreaCounts().filter((a) => a.area !== area);

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <nav className="mb-1 flex items-center gap-1 text-[12.5px] text-ink-faint">
          <Link href="/course" className="hover:text-free">여행코스</Link>
          <span>›</span>
          <span>{area}</span>
        </nav>
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          <span className="text-free">{area}</span> 여행코스
        </h1>
        {stayLinkFor(area) && <AffiliateNotice className="mt-1.5" />}
        <p className="mt-1 text-[14px] text-ink-soft">
          {area} 가볼만한 곳을 이어 만든 하루 여행 <span className="whitespace-nowrap">{list.length}개</span> — 밥집까지 함께
        </p>
      </Band>

      <div className="mx-auto w-full max-w-[1280px] px-5 pb-16 pt-4 sm:px-6 lg:px-8">
        {/* 기간 필터 (색인 URL) */}
        <div className="mb-3 flex flex-wrap gap-2">
          {DURATIONS.filter((d) => durCounts[d.key]).map((d) => (
            <Link key={d.slug} href={`/course/${slug}/${d.slug}`}
              className="rounded-full bg-white px-3 py-1.5 text-[13px] font-bold text-ink-soft ring-1 ring-line transition hover:bg-tint hover:text-freedark">
              {d.label} <span className="text-ink-faint">{durCounts[d.key]}</span>
            </Link>
          ))}
        </div>

        {/* 테마 칩 (전국 테마 페이지로) */}
        <div className="mb-5 flex flex-wrap gap-2">
          {THEMES.filter((t) => themeCounts[t.key]).map((t) => (
            <Link key={t.slug} href={`/course/theme/${t.slug}`}
              className="rounded-full bg-panel px-2.5 py-1 text-[12px] font-semibold text-ink-soft transition hover:text-freedark">
              {t.emoji} {t.label}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>

        {/* 숙소 제휴 배너 — 제휴 링크가 등록된 지역에서만 (광고, 위아래 여백 확보) */}
        {stayLinkFor(area) && (
          <div className="my-10">
            <SeoulStayBanner region={stayLinkFor(area)!.region} href={stayLinkFor(area)!.href} />
          </div>
        )}

        {otherAreas.length > 0 && (
          <div className="mt-8 border-t border-line pt-5">
            <h2 className="mb-2 text-[13px] font-bold text-ink-faint">다른 지역 여행코스</h2>
            <div className="flex flex-wrap gap-2">
              {otherAreas.map(({ area: a, count }) => (
                <Link key={a} href={`/course/${areaSlug(a)}`}
                  className="rounded-full bg-white px-3 py-1.5 text-[13px] font-bold text-ink-soft ring-1 ring-line transition hover:bg-tint hover:text-freedark">
                  {a} <span className="text-ink-faint">{count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
