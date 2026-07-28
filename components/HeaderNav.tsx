"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "홈" },
  { href: "/events", label: "문화행사" },
  { href: "/places", label: "나들이" },
  { href: "/camping", label: "캠핑" },
  { href: "/free", label: "무료·특가" },
];

// 2줄 헤더의 하단 탭 — 현재 탭만 그린 밑줄 (sticky는 상위 header가 담당)
export default function HeaderNav() {
  const pathname = usePathname() || "/";
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="mx-auto flex w-full max-w-[1280px] items-center gap-1 overflow-x-auto px-4 no-scrollbar sm:gap-2 sm:px-6 lg:px-8">
      {TABS.map((t) => {
        const active = isActive(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={[
              "relative shrink-0 px-3 py-2.5 text-[14px] font-bold transition sm:text-[15px]",
              active ? "text-free" : "text-ink-soft hover:text-ink",
            ].join(" ")}
          >
            {t.label}
            <span
              className={[
                "absolute inset-x-2 -bottom-px h-[2.5px] rounded-full transition",
                active ? "bg-free" : "bg-transparent",
              ].join(" ")}
            />
          </Link>
        );
      })}
    </nav>
  );
}
