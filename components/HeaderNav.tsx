"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 통합 상단 메뉴 (한 줄). 모바일: 가로 스크롤 / 데스크톱: 한 줄. 현재 탭만 그린 밑줄.
export default function HeaderNav({ seasonLabel, seasonQuery }: { seasonLabel: string; seasonQuery: string }) {
  const pathname = usePathname() || "/";

  const tabs: { href: string; label: string; path?: string }[] = [
    { href: "/", label: "홈", path: "/" },
    { href: "/events", label: "문화행사", path: "/events" },
    { href: "/places", label: "나들이", path: "/places" },
    { href: "/camping", label: "캠핑", path: "/camping" },
    { href: "/free", label: "무료 문화행사", path: "/free" },
    { href: `/search?q=${encodeURIComponent(`${seasonLabel} ${seasonQuery}`)}`, label: `${seasonLabel} 나들이` },
    { href: "/search?q=%EB%8D%B0%EC%9D%B4%ED%8A%B8", label: "데이트 코스" },
    { href: "/near", label: "내 주변", path: "/near" },
    { href: "/search?q=%EB%A7%9B%EC%A7%91", label: "맛집 탐방" },
  ];

  const isActive = (path?: string) =>
    !path ? false : path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);

  return (
    <nav className="mx-auto flex w-full max-w-[1280px] items-center gap-0.5 overflow-x-auto px-2 no-scrollbar sm:gap-1 sm:px-6 lg:px-8">
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
  );
}
