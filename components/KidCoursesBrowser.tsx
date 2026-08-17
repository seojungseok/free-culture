"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ScrollRail from "@/components/ScrollRail";
import type { KidCourseLite } from "@/lib/kidCourses"; // 타입만(런타임 번들 X)

interface Area { area: string; slug: string; count: number }

const THEMES = [
  { key: "all", label: "전체", emoji: "✨" },
  { key: "animal", label: "동물 친구", emoji: "🦁" },
  { key: "play", label: "신나는 놀이", emoji: "🎡" },
  { key: "learn", label: "배우는 나들이", emoji: "🔬" },
  { key: "nature", label: "자연 탐험", emoji: "🌳" },
  { key: "show", label: "공연·전시", emoji: "🎪" },
  { key: "indoor", label: "비 오는 날 실내", emoji: "🌧️" },
] as const;
const THEME_ORDER = ["animal", "play", "learn", "nature", "show"] as const;
const THEME_LABEL: Record<string, { label: string; emoji: string }> = {
  animal: { label: "동물 친구 코스", emoji: "🦁" },
  play: { label: "신나는 놀이 코스", emoji: "🎡" },
  learn: { label: "배우는 나들이 코스", emoji: "🔬" },
  nature: { label: "자연 탐험 코스", emoji: "🌳" },
  show: { label: "공연·전시 코스", emoji: "🎪" },
};
const BADGE: Record<string, string> = { animal: "🦁", play: "🎡", learn: "🔬", nature: "🌳", show: "🎪" };
const GRID_CAP = 24;
const RAIL_CAP = 12;
const kmLabel = (km: number) => (km < 1 ? `${Math.round(km * 10) * 100}m` : `${km.toFixed(1)}km`);

export default function KidCoursesBrowser({ courses, areas }: { courses: KidCourseLite[]; areas: Area[] }) {
  const [theme, setTheme] = useState<string>("all");
  const [region, setRegion] = useState<string>("서울");

  const base = theme === "all" ? courses : theme === "indoor" ? courses.filter((c) => c.indoor) : courses.filter((c) => c.theme === theme);

  const regionCount: Record<string, number> = {};
  for (const c of base) regionCount[c.area] = (regionCount[c.area] || 0) + 1;
  const regionTabs = [{ area: "전국", slug: "", count: base.length }, ...areas.filter((a) => regionCount[a.area]).map((a) => ({ ...a, count: regionCount[a.area] }))];

  const effRegion = region === "전국" || regionCount[region] ? region : "전국";
  const regionCourses = effRegion === "전국" ? base : base.filter((c) => c.area === effRegion);

  return (
    <div>
      {/* 테마 탭 */}
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar sm:mx-0 sm:px-0">
        {THEMES.map((t) => (
          <button key={t.key} onClick={() => setTheme(t.key)}
            className={["min-h-[40px] shrink-0 rounded-full px-3.5 text-[14px] font-bold transition", theme === t.key ? "bg-free text-white shadow-sm" : "border border-line bg-white text-ink-soft hover:border-free/40 hover:text-free"].join(" ")}>
            <span className="mr-1">{t.emoji}</span>{t.label}
          </button>
        ))}
      </div>

      {/* 지역 탭 — 선택 테마가 있는 지역만 */}
      <div className="-mx-5 mt-2.5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar sm:mx-0 sm:px-0">
        {regionTabs.map((a) => (
          <button key={a.area} onClick={() => setRegion(a.area)}
            className={["min-h-[36px] shrink-0 rounded-full px-3.5 text-[13.5px] font-bold transition", effRegion === a.area ? "bg-ink text-white" : "border border-line bg-white text-ink-soft hover:border-free/40 hover:text-free"].join(" ")}>
            {a.area}<span className={effRegion === a.area ? "ml-1 text-white/70" : "ml-1 text-ink-faint"}>{a.count}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {theme === "all" ? (
          <div className="space-y-8">
            {THEME_ORDER.map((tk) => {
              const list = regionCourses.filter((c) => c.theme === tk);
              if (!list.length) return null;
              const meta = THEME_LABEL[tk];
              return (
                <section key={tk}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-[17px] font-extrabold text-ink">{meta.emoji} {meta.label}</h2>
                      <span className="text-[13px] font-bold text-free">{list.length}개</span>
                    </div>
                    {list.length > RAIL_CAP && (
                      <button onClick={() => setTheme(tk)} className="text-[12.5px] font-bold text-free hover:text-freedark">더보기 →</button>
                    )}
                  </div>
                  <ScrollRail ariaLabel={`${effRegion} ${meta.label}`}>
                    {list.slice(0, RAIL_CAP).map((c) => <CourseCard key={c.id} c={c} rail />)}
                  </ScrollRail>
                </section>
              );
            })}
            {regionCourses.length === 0 && <p className="py-8 text-center text-[13.5px] text-ink-faint">이 지역은 준비된 코스가 아직 적어요. 다른 지역을 골라보세요.</p>}
          </div>
        ) : (
          <>
            <p className="mb-3 text-[12.5px] text-ink-faint">
              {effRegion} · {THEMES.find((t) => t.key === theme)?.label} — 총 {regionCourses.length.toLocaleString()}개
              {regionCourses.length > GRID_CAP ? ` (가까운 순 ${GRID_CAP}개)` : ""}
            </p>
            {regionCourses.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {regionCourses.slice(0, GRID_CAP).map((c) => <CourseCard key={c.id} c={c} />)}
              </div>
            ) : (
              <p className="py-8 text-center text-[13.5px] text-ink-faint">이 조건에 맞는 코스가 아직 적어요. 다른 테마나 지역을 골라보세요.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CourseCard({ c, rail = false }: { c: KidCourseLite; rail?: boolean }) {
  return (
    <Link href={`/kids/c/${c.id}`} className={["group block overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.05] shadow-sm transition hover:-translate-y-0.5 hover:shadow-cardhover", rail ? "w-[250px] shrink-0 snap-start sm:w-[270px]" : ""].join(" ")}>
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
        {c.image ? (
          <Image src={c.image} alt={`${c.spot} 아이와 함께 코스`} fill sizes="270px" className="object-cover transition group-hover:scale-105" loading="lazy" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl text-ink-faint">🧸</div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-extrabold text-ink shadow-sm">{BADGE[c.theme]}</span>
        {c.indoor && <span className="absolute right-2 top-2 rounded-full bg-[#3b82f6] px-2 py-0.5 text-[10.5px] font-extrabold text-white shadow-sm">🌧️ 실내</span>}
      </div>
      <div className="px-3.5 pb-3.5 pt-2.5">
        <p className="text-[11.5px] font-bold text-free">{c.city}</p>
        <h3 className="mt-0.5 line-clamp-1 text-[15px] font-extrabold text-ink group-hover:text-free">{c.spot}</h3>
        {c.park && <p className="mt-1.5 line-clamp-1 text-[12.5px] text-ink-soft">🌳 {c.park}</p>}
        <p className="mt-0.5 line-clamp-1 text-[12.5px] text-ink-soft">🍽 {c.food}</p>
        <p className="mt-1 text-[11.5px] font-semibold text-ink-faint">🚗 차로 약 {c.driveMin}분 · 총 {kmLabel(c.totalKm)}</p>
      </div>
    </Link>
  );
}
