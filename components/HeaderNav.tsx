"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 통합 상단 메뉴. 모바일: 4×2 균등 그리드(딱 맞게) / 데스크톱: 한 줄. 현재 탭 그린 밑줄.
export default function HeaderNav({ seasonLabel }: { seasonLabel: string }) {
  const pathname = usePathname() || "/";

  // 홈은 헤더 왼쪽 핀 로고가 담당(돋보기 왼쪽) → 여기선 제외.
  // 정렬: 주요 콘텐츠(문화행사·나들이·여행코스·맛집) 먼저, 그다음 보조·시즌·유틸.
  const tabs: { href: string; label: string; path: string }[] = [
    { href: "/#section-events", label: "문화행사", path: "/events" },
    { href: "/#section-places", label: "나들이", path: "/places" },
    { href: "/#section-course", label: "여행코스", path: "/course" },
    { href: "/#section-camping", label: "캠핑", path: "/camping" },
    { href: "/food", label: "맛집탐방", path: "/food" },
    { href: "/#section-kids", label: "아이와함께", path: "/kids" },
    { href: "/date", label: "데이트", path: "/date" },
    { href: "/#section-season", label: `${seasonLabel}나들이`, path: "/season" },
  ];

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);

  return (
    <nav className="flex w-full items-center justify-center gap-1">
      {tabs.map((t) => {
        const active = isActive(t.path);
        return (
          <Link
            key={t.label}
            href={t.href}
            className="flex items-center justify-center px-2 py-3 lg:px-3"
          >
            <span
              className={[
                "relative whitespace-nowrap text-[14px] font-bold transition lg:text-[15px]",
                active ? "text-free" : "text-ink-soft hover:text-ink",
              ].join(" ")}
            >
              {t.label}
              <span
                className={[
                  "absolute inset-x-0 -bottom-[23px] h-[2.5px] rounded-full transition",
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
