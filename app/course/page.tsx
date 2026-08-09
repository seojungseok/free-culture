import type { Metadata } from "next";
import Link from "next/link";
import { Band, Container } from "@/components/Band";
import { FilterRow, Chip } from "@/components/FilterChips";
import CourseCard from "@/components/CourseCard";
import {
  filterCourses, getCourseCount, getCourseAreaCounts, DURATIONS, THEMES, slimCourse,
} from "@/lib/courses";

export const revalidate = 86400;

type SP = { area?: string; duration?: string; theme?: string };
const CAP = 80;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const label = [sp.area, sp.duration, sp.theme].filter(Boolean).join(" ") || "전국";
  return {
    title: `${label} 여행코스 — 당일치기·1박2일·2박3일 국내 여행 코스`,
    description: `${label} 여행코스를 지역·기간·테마로 골라보세요. 가볼만한 곳을 이어 만든 하루 동선부터 1박2일·2박3일까지, 해수욕장 베스트까지.`,
    keywords: [`${sp.area || ""} 여행코스`, `${sp.area || ""} 당일치기`, `${sp.area || ""} 1박2일`, "국내여행 코스", "여행코스 추천"].filter((k) => k.trim()),
    alternates: { canonical: "/course" },
  };
}

function qs(base: SP, patch: SP): string {
  const m: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...base, ...patch })) if (v) m[k] = v as string;
  const s = new URLSearchParams(m).toString();
  return s ? `/course?${s}` : "/course";
}

export default async function CoursePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const cur = { area: sp.area, duration: sp.duration, theme: sp.theme };
  const list = filterCourses(cur).map(slimCourse);
  const total = getCourseCount();

  // 패싯 카운트 — 해당 축 제외한 나머지 조건 기준
  const cnt = (patch: SP) => filterCourses({ ...cur, ...patch }).length;
  const areas = getCourseAreaCounts();
  const heading = [sp.area, sp.duration, sp.theme].filter(Boolean).join(" ") || "전국";

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

      <div className="bg-panel">
        <Container className="space-y-3 py-4">
          {/* 기간 */}
          <FilterRow label="기간">
            <Chip href={qs(sp, { duration: undefined })} active={!sp.duration} label="전체" count={cnt({ duration: undefined })} />
            {DURATIONS.map((d) => (
              <Chip key={d.key} href={qs(sp, { duration: sp.duration === d.key ? undefined : d.key })} active={sp.duration === d.key} label={d.label} count={cnt({ duration: d.key })} />
            ))}
          </FilterRow>
          {/* 테마 */}
          <FilterRow label="테마">
            <Chip href={qs(sp, { theme: undefined })} active={!sp.theme} label="전체" count={cnt({ theme: undefined })} />
            {THEMES.map((t) => (
              <Chip key={t.key} href={qs(sp, { theme: sp.theme === t.key ? undefined : t.key })} active={sp.theme === t.key} label={`${t.emoji} ${t.label}`} count={cnt({ theme: t.key })} />
            ))}
          </FilterRow>
          {/* 지역 */}
          <FilterRow label="지역">
            <Chip href={qs(sp, { area: undefined })} active={!sp.area} label="전국" count={total} />
            {areas.map((a) => (
              <Chip key={a.area} href={qs(sp, { area: sp.area === a.area ? undefined : a.area })} active={sp.area === a.area} label={a.area} count={cnt({ area: a.area })} />
            ))}
          </FilterRow>
          {(sp.area || sp.duration || sp.theme) && (
            <div className="flex items-center gap-2 pt-0.5 text-[12.5px]">
              <span className="font-bold text-ink-faint">선택:</span>
              <span className="font-semibold text-freedark">{heading}</span>
              <Link href="/course" className="ml-1 font-semibold text-ink-faint underline hover:text-ink">전체 초기화</Link>
            </div>
          )}
        </Container>

        <Container className="pb-12 pt-2">
          <div className="mb-4 flex items-baseline gap-2">
            <h2 className="text-[20px] font-extrabold tracking-tight text-ink sm:text-[22px]">{heading} 여행코스</h2>
            <span className="text-[14px] font-bold text-free">{list.length.toLocaleString()}개</span>
          </div>
          {list.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center text-ink-soft">
              해당 조건의 코스가 아직 없어요. 다른 기간·테마·지역으로 골라보세요.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {list.slice(0, CAP).map((c) => <CourseCard key={c.id} course={c} />)}
            </div>
          )}
          {list.length > CAP && <p className="mt-8 text-center text-[13px] text-ink-faint">상위 {CAP}개 표시 · 필터로 좁혀보세요</p>}
        </Container>
      </div>
    </>
  );
}
