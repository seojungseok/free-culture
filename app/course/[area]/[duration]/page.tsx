import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Band } from "@/components/Band";
import CourseCard from "@/components/CourseCard";
import {
  filterCourses, getCourseAreaCounts, getDurationCounts,
  DURATIONS, durationFromSlug, durationLabel, areaSlug, sidoFromSlug, slimCourse,
} from "@/lib/courses";

export const revalidate = 86400;
export const dynamicParams = true;

// 얇은 조합 색인 방지 — 이 개수 미만이면 noindex(구글이 싫어하는 thin 페이지 차단)
const INDEX_MIN = 3;

export function generateStaticParams() {
  const out: { area: string; duration: string }[] = [];
  for (const { area } of getCourseAreaCounts()) {
    const dc = getDurationCounts(area);
    for (const d of DURATIONS) if ((dc[d.key] || 0) >= INDEX_MIN) out.push({ area: areaSlug(area), duration: d.slug });
  }
  return out;
}

export async function generateMetadata({ params }: { params: Promise<{ area: string; duration: string }> }): Promise<Metadata> {
  const { area: slug, duration: dslug } = await params;
  const area = sidoFromSlug(slug);
  const dur = durationFromSlug(dslug);
  if (!area || !dur) return {};
  const count = filterCourses({ area, duration: dur.key }).length;
  return {
    title: `${area} ${dur.label} 여행코스 — ${area} ${dur.label} 여행 일정 추천`,
    description: `${area} ${dur.label} 여행코스 모음. ${area} 가볼만한 곳을 이어 만든 ${dur.label} 동선과 밥집까지 한 번에.`,
    keywords: [`${area} ${dur.label}`, `${area} ${dur.label} 코스`, `${area} 여행코스`, `${area} 여행`],
    alternates: { canonical: `/course/${slug}/${dslug}` },
    ...(count < INDEX_MIN ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CourseAreaDurationPage({ params }: { params: Promise<{ area: string; duration: string }> }) {
  const { area: slug, duration: dslug } = await params;
  const area = sidoFromSlug(slug);
  const dur = durationFromSlug(dslug);
  if (!area || !dur) notFound();

  const list = filterCourses({ area, duration: dur.key }).map(slimCourse);
  if (list.length === 0) notFound();

  const dc = getDurationCounts(area);

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <nav className="mb-1 flex items-center gap-1 text-[12.5px] text-ink-faint">
          <Link href="/course" className="hover:text-free">여행코스</Link>
          <span>›</span>
          <Link href={`/course/${slug}`} className="hover:text-free">{area}</Link>
          <span>›</span>
          <span>{dur.label}</span>
        </nav>
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          <span className="text-free">{area}</span> {dur.label} 여행코스
        </h1>
        <p className="mt-1 text-[14px] text-ink-soft">{area}에서 {dur.label}로 다녀오기 좋은 코스 {list.length}개</p>
      </Band>

      <div className="mx-auto w-full max-w-[1280px] px-5 pb-16 pt-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link href={`/course/${slug}`}
            className="rounded-full bg-white px-3 py-1.5 text-[13px] font-bold text-ink-soft ring-1 ring-line transition hover:bg-tint">
            {area} 전체
          </Link>
          {DURATIONS.filter((d) => dc[d.key]).map((d) => (
            <Link key={d.slug} href={`/course/${slug}/${d.slug}`}
              className={`rounded-full px-3 py-1.5 text-[13px] font-bold ring-1 transition ${
                d.slug === dslug ? "bg-free text-white ring-free" : "bg-white text-ink-soft ring-line hover:bg-tint"
              }`}>
              {d.label} <span className={d.slug === dslug ? "text-white/70" : "text-ink-faint"}>{dc[d.key]}</span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      </div>
    </>
  );
}
