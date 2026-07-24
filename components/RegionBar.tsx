"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { SIDO_LIST, SIDO_SLUG } from "@/lib/classify";

export default function RegionBar({
  counts,
}: {
  counts: Record<string, number>;
}) {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  // 현재 활성 지역 slug (/, /region/[slug])
  const m = pathname.match(/^\/region\/([^/]+)/);
  const activeSlug = m ? m[1] : ""; // "" = 전국

  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [activeSlug]);

  const items: { label: string; slug: string; href: string; count?: number }[] = [
    { label: "전국", slug: "", href: "/" },
    ...SIDO_LIST.map((sido) => ({
      label: sido,
      slug: (SIDO_SLUG as Record<string, string>)[sido],
      href: `/region/${(SIDO_SLUG as Record<string, string>)[sido]}`,
      count: counts[sido] || 0,
    })),
  ];

  return (
    <div className="relative">
      {/* 양옆 페이드 (스크롤 힌트) */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-panel to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-panel to-transparent" />

      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-1.5 overflow-x-auto no-scrollbar px-5 py-1.5 sm:px-6 lg:px-8">
        {items.map((it) => {
          const active = it.slug === activeSlug;
          const disabled = it.slug !== "" && it.count === 0;
          if (disabled) {
            return (
              <span
                key={it.slug}
                className="flex shrink-0 cursor-default items-center gap-1 whitespace-nowrap rounded-full border border-line bg-white px-2.5 py-1 text-[12.5px] font-bold text-ink-dim/60"
              >
                {it.label}
              </span>
            );
          }
          return (
            <Link
              key={it.slug || "all"}
              href={it.href}
              ref={active ? activeRef : undefined}
              className={[
                "flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[12.5px] font-bold transition",
                active
                  ? "bg-free text-white shadow-sm"
                  : "border border-line bg-white text-ink-soft hover:border-free/40 hover:text-free",
              ].join(" ")}
            >
              {it.label}
              {typeof it.count === "number" && (
                <span
                  className={[
                    "text-[11px] font-semibold tabular-nums",
                    active ? "text-white/80" : "text-ink-dim",
                  ].join(" ")}
                >
                  {it.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
