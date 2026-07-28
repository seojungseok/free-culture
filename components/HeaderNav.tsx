"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 통합 상단 메뉴. 모바일: 2줄로 전부 노출(드래그 불필요) / 데스크톱: 한 줄. 현재 탭 그린 밑줄.
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
    <nav className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-center gap-x-1 gap-y-0.5 px-2 py-0.5 sm:flex-nowrap sm:justify-start sm:gap-1 sm:px-6 sm:py-0 lg:px-8">
      {tabs.map((t) => {
        const active = isActive(t.path);
        return (
          <Link
            key={t.label}
            href={t.href}
            className={[
              "relative whitespace-nowrap px-2.5 py-2.5 text-[13.5px] font-bold transition sm:px-3 sm:py-3 sm:text-[15px]",
              active ? "text-free" : "text-ink-soft hover:text-ink",
            ].join(" ")}
          >
            {t.label}
            <span
              className={[
                "absolute inset-x-2.5 bottom-0.5 h-[2.5px] rounded-full transition sm:inset-x-3 sm:-bottom-px",
                active ? "bg-free" : "bg-transparent",
              ].join(" ")}
            />
          </Link>
        );
      })}
    </nav>
  );
}
