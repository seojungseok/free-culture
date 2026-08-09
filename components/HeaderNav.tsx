"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 통합 상단 메뉴. 모바일: 4×2 균등 그리드(딱 맞게) / 데스크톱: 한 줄. 현재 탭 그린 밑줄.
export default function HeaderNav({ seasonLabel }: { seasonLabel: string }) {
  const pathname = usePathname() || "/";

  // 홈은 헤더 왼쪽 핀 로고가 담당(돋보기 왼쪽) → 여기선 제외.
  // 정렬: 주요 콘텐츠(문화행사·나들이·여행코스·맛집) 먼저, 그다음 보조·시즌·유틸.
  const tabs: { href: string; label: string; path: string }[] = [
    { href: "/events", label: "문화행사", path: "/events" },
    { href: "/places", label: "나들이", path: "/places" },
    { href: "/course", label: "여행코스", path: "/course" },
    { href: "/food", label: "맛집 탐방", path: "/food" },
    { href: "/camping", label: "캠핑", path: "/camping" },
    { href: "/date", label: "데이트 코스", path: "/date" },
    { href: "/season", label: `${seasonLabel} 나들이`, path: "/season" },
    { href: "/near", label: "내 주변", path: "/near" },
    { href: "/game", label: "🎮 독박게임", path: "/game" },
  ];

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);

  return (
    <nav className="mx-auto grid w-full max-w-[1280px] grid-cols-4 gap-y-0.5 px-2 py-1 sm:flex sm:gap-1 sm:px-6 sm:py-0 lg:px-8">
      {tabs.map((t) => {
        const active = isActive(t.path);
        return (
          <Link
            key={t.label}
            href={t.href}
            className="flex items-center justify-center px-1 py-2 sm:justify-start sm:px-3 sm:py-3"
          >
            <span
              className={[
                "relative whitespace-nowrap text-[13px] font-bold transition sm:text-[15px]",
                active ? "text-free" : "text-ink-soft hover:text-ink",
              ].join(" ")}
            >
              {t.label}
              <span
                className={[
                  "absolute inset-x-0 -bottom-1.5 h-[2.5px] rounded-full transition sm:-bottom-[11px]",
                  active ? "bg-free" : "bg-transparent",
                ].join(" ")}
              />
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
