import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Band } from "@/components/Band";
import CourseCard from "@/components/CourseCard";
import { filterCourses, getThemeCounts, THEMES, themeFromSlug, slimCourse } from "@/lib/courses";

export const revalidate = 86400;
export const dynamicParams = true;

const INDEX_MIN = 3;

export function generateStaticParams() {
  const counts = getThemeCounts();
  return THEMES.filter((t) => (counts[t.key] || 0) >= INDEX_MIN).map((t) => ({ theme: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ theme: string }> }): Promise<Metadata> {
  const { theme: slug } = await params;
  const th = themeFromSlug(slug);
  if (!th) return {};
  const count = filterCourses({ theme: th.key }).length;
  const kw = th.key === "바다피서"
    ? ["여름 여행코스", "바다 여행코스", "해수욕장 코스", "여름휴가 가볼만한곳"]
    : [`${th.label} 여행코스`, `${th.label} 코스`, "국내여행 코스"];
  return {
    title: `${th.label} 여행코스 — 전국 ${th.label} 테마 여행 일정`,
    description: `전국 ${th.label} 여행코스 모음. 테마에 딱 맞는 곳들을 이어 만든 하루 여행 동선을 지역별로 골라보세요.`,
    keywords: kw,
    alternates: { canonical: `/course/theme/${slug}` },
    ...(count < INDEX_MIN ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CourseThemePage({ params }: { params: Promise<{ theme: string }> }) {
  const { theme: slug } = await params;
  const th = themeFromSlug(slug);
  if (!th) notFound();

  const list = filterCourses({ theme: th.key }).map(slimCourse);
  if (list.length === 0) notFound();

  const counts = getThemeCounts();

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <nav className="mb-1 flex items-center gap-1 text-[12.5px] text-ink-faint">
          <Link href="/course" className="hover:text-free">여행코스</Link>
          <span>›</span>
          <span>{th.label}</span>
        </nav>
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          {th.emoji} <span className="text-free">{th.label}</span> 여행코스
        </h1>
        <p className="mt-1 text-[14px] text-ink-soft">전국 {th.label} 테마 코스 {list.length}개</p>
      </Band>

      <div className="mx-auto w-full max-w-[1280px] px-5 pb-16 pt-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap gap-2">
          {THEMES.filter((t) => counts[t.key]).map((t) => (
            <Link key={t.slug} href={`/course/theme/${t.slug}`}
              className={`rounded-full px-3 py-1.5 text-[13px] font-bold ring-1 transition ${
                t.slug === slug ? "bg-free text-white ring-free" : "bg-white text-ink-soft ring-line hover:bg-tint"
              }`}>
              {t.emoji} {t.label}
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
