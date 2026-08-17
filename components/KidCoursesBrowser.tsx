"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { KidSpot } from "@/lib/kidCourses"; // 타입만(런타임 번들 X)

interface Area { area: string; slug: string; count: number }

// 테마 메타(클라이언트 전용 — lib 런타임 import 피함)
const THEMES = [
  { key: "all", label: "전체", emoji: "✨" },
  { key: "animal", label: "동물 친구", emoji: "🦁" },
  { key: "play", label: "신나는 놀이", emoji: "🎡" },
  { key: "learn", label: "배우는 나들이", emoji: "🔬" },
  { key: "nature", label: "자연 탐험", emoji: "🌳" },
  { key: "show", label: "공연·전시", emoji: "🎪" },
  { key: "indoor", label: "비 오는 날 실내", emoji: "🌧️" },
] as const;
const EMOJI: Record<string, string> = { animal: "🦁", play: "🎡", learn: "🔬", nature: "🌳", show: "🎪" };
const PER = 24;

export default function KidCoursesBrowser({ spots, areas }: { spots: KidSpot[]; areas: Area[] }) {
  const [theme, setTheme] = useState<string>("all");
  const [region, setRegion] = useState<string>("서울");

  const regionTabs: Area[] = [{ area: "전국", slug: "", count: spots.length }, ...areas];

  let list = region === "전국" ? spots : spots.filter((s) => s.area === region);
  if (theme === "indoor") list = list.filter((s) => s.indoor);
  else if (theme !== "all") list = list.filter((s) => s.theme === theme);
  const shown = list.slice(0, PER);

  return (
    <div>
      {/* 테마 탭 */}
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar sm:mx-0 sm:px-0">
        {THEMES.map((t) => (
          <button
            key={t.key}
            onClick={() => setTheme(t.key)}
            className={[
              "min-h-[40px] shrink-0 rounded-full px-3.5 text-[14px] font-bold transition",
              theme === t.key ? "bg-free text-white shadow-sm" : "border border-line bg-white text-ink-soft hover:border-free/40 hover:text-free",
            ].join(" ")}
          >
            <span className="mr-1">{t.emoji}</span>{t.label}
          </button>
        ))}
      </div>

      {/* 지역 탭 */}
      <div className="-mx-5 mt-2.5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar sm:mx-0 sm:px-0">
        {regionTabs.map((a) => (
          <button
            key={a.area}
            onClick={() => setRegion(a.area)}
            className={[
              "min-h-[36px] shrink-0 rounded-full px-3.5 text-[13.5px] font-bold transition",
              region === a.area ? "bg-ink text-white" : "border border-line bg-white text-ink-soft hover:border-free/40 hover:text-free",
            ].join(" ")}
          >
            {a.area}
            <span className={region === a.area ? "ml-1 text-white/70" : "ml-1 text-ink-faint"}>{a.count}</span>
          </button>
        ))}
      </div>

      {/* 카드 그리드 */}
      <div className="mt-6">
        <p className="mb-3 text-[12.5px] text-ink-faint">
          {region} · {THEMES.find((t) => t.key === theme)?.label} — 총 {list.length.toLocaleString()}곳
          {list.length > PER ? ` (상위 ${PER}곳 표시)` : ""}
        </p>
        {shown.length ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
            {shown.map((s) => (
              <Link key={`${s.isEvent ? "e" : "p"}-${s.id}`} href={s.href} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/[0.04]">
                  {s.image ? (
                    <Image src={s.image} alt={s.title} fill sizes="(max-width:640px) 50vw, 240px" className="object-cover transition group-hover:scale-105" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl text-ink-faint">🧸</div>
                  )}
                  {!s.isEvent && s.theme && (
                    <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-extrabold text-ink shadow-sm">
                      {EMOJI[s.theme]}
                    </span>
                  )}
                  {s.isEvent && (
                    <span className="absolute left-2 top-2 rounded-full bg-free px-2 py-0.5 text-[10.5px] font-extrabold text-white shadow-sm">🎪 공연·전시</span>
                  )}
                  {s.indoor && (
                    <span className="absolute right-2 top-2 rounded-full bg-[#3b82f6] px-2 py-0.5 text-[10.5px] font-extrabold text-white shadow-sm">🌧️ 실내</span>
                  )}
                </div>
                <h3 className="mt-1.5 line-clamp-1 text-[14px] font-bold text-ink group-hover:text-free">{s.title}</h3>
                <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-faint">{s.city}</p>
                {s.food && <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-soft">🍽 근처 {s.food}</p>}
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-[13.5px] text-ink-faint">이 조건에 맞는 곳이 아직 적어요. 다른 테마나 지역을 골라보세요.</p>
        )}
      </div>
    </div>
  );
}
