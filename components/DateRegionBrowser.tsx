"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CourseGeo } from "@/lib/dateCourses"; // 타입만(런타임 번들 X)

interface Area { area: string; slug: string; count: number }

const PER = 8; // 그룹당 미리보기 개수 (더 보려면 지역 전체 페이지로)
const kmLabel = (km: number) => (km < 1 ? `${Math.round(km * 10) * 100}m` : `${km.toFixed(1)}km`);
const walkMin = (km: number) => Math.max(1, Math.round(km * 15));
const driveMin = (km: number) => Math.max(1, Math.round((km / 22) * 60));

export default function DateRegionBrowser({ courses, areas, belowTabs }: { courses: CourseGeo[]; areas: Area[]; belowTabs?: ReactNode }) {
  const [sel, setSel] = useState("서울");
  const tabs: Area[] = [{ area: "전국", slug: "", count: courses.length }, ...areas];

  const filtered = sel === "전국" ? courses : courses.filter((c) => c.area === sel);
  const walk = filtered.filter((c) => c.walk).slice(0, PER);
  const drive = filtered.filter((c) => !c.walk).slice(0, PER);
  const slug = areas.find((a) => a.area === sel)?.slug;

  return (
    <div>
      {/* 지역 탭 (전국 + 시도) */}
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <button
            key={t.area}
            onClick={() => setSel(t.area)}
            className={[
              "min-h-[40px] shrink-0 rounded-full px-4 text-[14px] font-bold transition",
              sel === t.area ? "bg-free text-white" : "border border-line bg-white text-ink-soft hover:border-free/40 hover:text-free",
            ].join(" ")}
          >
            {t.area}
            <span className={sel === t.area ? "ml-1 text-white/80" : "ml-1 text-ink-faint"}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* 지역 탭 바로 아래 슬롯 — 내 위치 찾기 버튼 등 */}
      {belowTabs && <div className="mt-4">{belowTabs}</div>}

      <div className="mt-6 space-y-8">
        <Group emoji="🚶" title="걸어서 데이트" desc="카페·공원·맛집이 걸어서 이어지는 코스" items={walk} kind="walk" />
        <Group emoji="🚗" title="차량 이동 데이트" desc="조금 떨어져 있어 차로 움직이면 편한 코스" items={drive} kind="drive" />
        {walk.length === 0 && drive.length === 0 && (
          <p className="text-center text-[13.5px] text-ink-faint">이 지역은 준비된 코스가 아직 적어요. 다른 지역을 골라보세요.</p>
        )}
      </div>

      {sel !== "전국" && slug && (walk.length >= PER || drive.length >= PER) && (
        <Link href={`/date/${slug}`} className="mt-5 inline-flex items-center gap-1 text-[13.5px] font-bold text-free hover:text-freedark">
          {sel} 카페데이트 코스 전체 보기 →
        </Link>
      )}
    </div>
  );
}

function Group({ emoji, title, desc, items, kind }: {
  emoji: string; title: string; desc: string; items: CourseGeo[]; kind: "walk" | "drive";
}) {
  if (!items.length) return null;
  return (
    <section>
      <div className="mb-1 flex items-baseline gap-2">
        <h2 className="text-[18px] font-extrabold tracking-tight text-ink sm:text-[20px]">{emoji} {title}</h2>
        <span className="text-[13.5px] font-bold text-free">{items.length}곳</span>
      </div>
      <p className="mb-3 text-[12.5px] text-ink-faint">{desc}</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4">
        {items.map((c) => (
          <Link key={c.id} href={`/date/c/${c.id}`} className="group block">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/[0.04]">
              {c.image ? (
                <Image src={c.image} alt={`${c.title} 카페데이트 코스`} fill sizes="(max-width:640px) 50vw, 240px" className="object-cover transition group-hover:scale-105" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl text-ink-faint">☕</div>
              )}
            </div>
            <h3 className="mt-1.5 line-clamp-1 text-[14px] font-bold text-ink group-hover:text-free">{c.title}</h3>
            <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-soft">🌳 {c.park}</p>
            <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-soft">🍽 {c.food}</p>
            <p className="mt-1 text-[11.5px] font-semibold text-ink-faint">
              {kind === "drive" ? `🚗 차로 약 ${driveMin(c.totalKm)}분` : `🚶 걸어서 약 ${walkMin(c.totalKm)}분`} · {c.city} · 총 {kmLabel(c.totalKm)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
