"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterRow } from "@/components/FilterChips";
import CourseCard from "@/components/CourseCard";
import { Container } from "@/components/Band";
import type { CourseCardData } from "@/components/CourseCard";

type SP = { area?: string; duration?: string; theme?: string };
const CAP = 80;
const DURATIONS: { key: string; slug: string; label: string }[] = [
  { key: "당일", slug: "day", label: "당일치기" },
  { key: "1박2일", slug: "1n2d", label: "1박2일" },
  { key: "2박3일", slug: "2n3d", label: "2박3일" },
];
const THEMES: { key: string; slug: string; label: string; emoji: string }[] = [
  { key: "바다피서", slug: "beach", label: "바다·피서", emoji: "🌊" },
  { key: "문화유적", slug: "heritage", label: "문화유적", emoji: "🏛" },
  { key: "자연힐링", slug: "nature", label: "자연·힐링", emoji: "🌿" },
  { key: "가족체험", slug: "family", label: "가족·체험", emoji: "👨‍👩‍👧" },
  { key: "맛집", slug: "food", label: "맛집·먹거리", emoji: "🍴" },
];

function qs(base: SP, patch: SP): string {
  const m: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...base, ...patch })) if (v) m[k] = v as string;
  const s = new URLSearchParams(m).toString();
  return s ? `/course?${s}` : "/course";
}

function filterCourses(courses: CourseCardData[], { area, duration, theme }: SP): CourseCardData[] {
  return courses.filter((c) => (!area || c.area === area) && (!duration || c.duration === duration) && (!theme || (c.themes || []).includes(theme)));
}

export default function CourseBrowser({
  courses,
  areas,
  total,
}: {
  courses: CourseCardData[];
  areas: { area: string; count: number }[];
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const sp: SP = {
    area: params.get("area") || undefined,
    duration: params.get("duration") || undefined,
    theme: params.get("theme") || undefined,
  };
  const list = useMemo(() => filterCourses(courses, sp), [courses, sp.area, sp.duration, sp.theme]);
  const cnt = (patch: SP) => filterCourses(courses, { ...sp, ...patch }).length;
  const heading = [sp.area, sp.duration, sp.theme].filter(Boolean).join(" ") || "전국";

  function go(href: string) {
    router.replace(href === "/course" ? pathname : href, { scroll: false });
  }

  return (
    <div className="bg-panel">
      <Container className="space-y-3 py-4">
        <FilterRow label="기간">
          <Chip onClick={() => go(qs(sp, { duration: undefined }))} active={!sp.duration} label="전체" count={cnt({ duration: undefined })} />
          {DURATIONS.map((d) => (
            <Chip key={d.key} onClick={() => go(qs(sp, { duration: sp.duration === d.key ? undefined : d.key }))} active={sp.duration === d.key} label={d.label} count={cnt({ duration: d.key })} />
          ))}
        </FilterRow>
        <FilterRow label="테마">
          <Chip onClick={() => go(qs(sp, { theme: undefined }))} active={!sp.theme} label="전체" count={cnt({ theme: undefined })} />
          {THEMES.map((t) => (
            <Chip key={t.key} onClick={() => go(qs(sp, { theme: sp.theme === t.key ? undefined : t.key }))} active={sp.theme === t.key} label={`${t.emoji} ${t.label}`} count={cnt({ theme: t.key })} />
          ))}
        </FilterRow>
        <FilterRow label="지역">
          <Chip onClick={() => go(qs(sp, { area: undefined }))} active={!sp.area} label="전국" count={total} />
          {areas.map((a) => (
            <Chip key={a.area} onClick={() => go(qs(sp, { area: sp.area === a.area ? undefined : a.area }))} active={sp.area === a.area} label={a.area} count={cnt({ area: a.area })} />
          ))}
        </FilterRow>
        {(sp.area || sp.duration || sp.theme) && (
          <div className="flex items-center gap-2 pt-0.5 text-[12.5px]">
            <span className="font-bold text-ink-faint">선택:</span>
            <span className="font-semibold text-freedark">{heading}</span>
            <button onClick={() => go("/course")} className="ml-1 font-semibold text-ink-faint underline hover:text-ink">전체 초기화</button>
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
  );
}

function Chip({ active, label, count, onClick }: { active: boolean; label: string; count?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex min-h-[36px] shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3.5 text-[13px] font-bold transition",
        active ? "bg-free text-white shadow-sm" : "border border-line bg-white text-ink-soft hover:border-free/40 hover:text-free",
      ].join(" ")}
    >
      {label}
      {typeof count === "number" && <span className={["text-[11px] tabular-nums", active ? "text-white/80" : "text-ink-dim"].join(" ")}>{count}</span>}
    </button>
  );
}
