"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { headerNavigation } from "@/lib/siteNavigation";

export default function HeaderNav({ seasonLabel }: { seasonLabel: string }) {
  const pathname = usePathname() || "/";
  const navigation = headerNavigation(seasonLabel);

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <nav className="flex w-full items-center gap-1">
      <div className="flex min-w-0 flex-1 items-center justify-start gap-1 overflow-x-auto">
        {navigation.primary.map((t) => {
          const active = isActive(t.href);
          return (
            <Link
              key={t.href}
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
      </div>
      <details className="group relative shrink-0">
        <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-lg px-2 text-[14px] font-bold text-ink-soft hover:bg-tint hover:text-ink lg:text-[15px] [&::-webkit-details-marker]:hidden">
          더보기 <span className="ml-1 text-xs" aria-hidden="true">▾</span>
        </summary>
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[200px] rounded-2xl border border-line bg-white p-2 shadow-lg">
          {navigation.more.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-2.5 text-[14px] font-bold text-ink-soft hover:bg-tint hover:text-brandblue">
              {item.label}
            </Link>
          ))}
        </div>
      </details>
    </nav>
  );
}
