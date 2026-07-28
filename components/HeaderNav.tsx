"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 통합 상단 메뉴 (한 줄). 모바일: 가로 스크롤(+우측 화살표 힌트) / 데스크톱: 한 줄. 현재 탭 그린 밑줄.
export default function HeaderNav({ seasonLabel }: { seasonLabel: string }) {
  const pathname = usePathname() || "/";

  const tabs: { href: string; label: string; path: string }[] = [
    { href: "/", label: "홈", path: "/" },
    { href: "/events", label: "문화행사", path: "/events" },
    { href: "/places", label: "나들이", path: "/places" },
    { href: "/camping", label: "캠핑", path: "/camping" },
    { href: "/season", label: `${seasonLabel} 나들이`, path: "/season" },
    { href: "/date", label: "데이트 코스", path: "/date" },
    { href: "/near", label: "내 주변", path: "/near" },
    { href: "/food", label: "맛집 탐방", path: "/food" },
  ];

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);

  return (
    <div className="relative mx-auto w-full max-w-[1280px]">
      <nav className="flex items-center gap-0.5 overflow-x-auto px-2 no-scrollbar sm:gap-1 sm:px-6 lg:px-8">
        {tabs.map((t) => {
          const active = isActive(t.path);
          return (
            <Link
              key={t.label}
              href={t.href}
              className={[
                "relative shrink-0 whitespace-nowrap px-2.5 py-3 text-[13.5px] font-bold transition sm:px-3 sm:text-[15px]",
                active ? "text-free" : "text-ink-soft hover:text-ink",
              ].join(" ")}
            >
              {t.label}
              <span
                className={[
                  "absolute inset-x-2.5 -bottom-px h-[2.5px] rounded-full transition sm:inset-x-3",
                  active ? "bg-free" : "bg-transparent",
                ].join(" ")}
              />
            </Link>
          );
        })}
      </nav>
      {/* 모바일 우측 "더 있음" 힌트 (스크롤 유도) */}
      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center bg-gradient-to-l from-white via-white pl-6 pr-1 text-ink-faint sm:hidden" aria-hidden>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
      </span>
    </div>
  );
}
