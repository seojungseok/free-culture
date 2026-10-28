"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { headerNavigation } from "@/lib/siteNavigation";

export default function HeaderNav({ seasonLabel }: { seasonLabel: string }) {
  const pathname = usePathname() || "/";
  const navigation = headerNavigation(seasonLabel);
  const more = useRef<HTMLDetailsElement>(null);

  useEffect(() => { if (more.current) more.current.open = false; }, [pathname]);

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <nav aria-label="주요 메뉴" className="flex w-full items-center gap-1">
      <div className="flex min-w-0 flex-1 items-center justify-start gap-1 overflow-x-auto">
        {navigation.primary.map((t) => {
          const active = isActive(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? (pathname === t.href ? "page" : "location") : undefined}
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
      <details ref={more} className="group relative shrink-0" onKeyDown={(event) => { if (event.key === "Escape" && more.current?.open) { more.current.open = false; more.current.querySelector("summary")?.focus(); } }}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-lg px-2 text-[14px] font-bold text-ink-soft hover:bg-tint hover:text-ink lg:text-[15px] [&::-webkit-details-marker]:hidden">
          더보기 <span className="ml-1 text-xs" aria-hidden="true">▾</span>
        </summary>
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[200px] rounded-2xl border border-line bg-white p-2 shadow-lg">
          {navigation.more.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? (pathname === item.href ? "page" : "location") : undefined} onClick={() => { if (more.current) more.current.open = false; }} className="block rounded-xl px-3 py-2.5 text-[14px] font-bold text-ink-soft hover:bg-tint hover:text-brandblue">
              {item.label}
            </Link>
          ))}
        </div>
      </details>
    </nav>
  );
}

export function MobileHeaderNav({ seasonLabel }: { seasonLabel: string }) {
  const pathname = usePathname() || "/";
  const navigation = headerNavigation(seasonLabel);
  const menu = useRef<HTMLDetailsElement>(null);

  useEffect(() => { if (menu.current) menu.current.open = false; }, [pathname]);

  return (
    <details ref={menu} className="group relative lg:hidden" onKeyDown={(event) => { if (event.key === "Escape" && menu.current?.open) { menu.current.open = false; menu.current.querySelector("summary")?.focus(); } }}>
      <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full text-[#07152f] transition hover:bg-tint [&::-webkit-details-marker]:hidden">
        <span className="sr-only">메뉴</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-9 w-9" aria-hidden="true">
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      </summary>
      <nav aria-label="전체 메뉴" className="absolute right-0 top-[calc(100%+10px)] max-h-[80dvh] w-[220px] overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-lg">
        {[...navigation.primary, ...navigation.more].map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return <Link key={item.href} href={item.href} aria-current={active ? (pathname === item.href ? "page" : "location") : undefined} onClick={() => { if (menu.current) menu.current.open = false; }} className={`block rounded-xl px-3 py-2.5 text-[14px] font-bold hover:bg-tint hover:text-brandblue ${active ? "bg-tint text-brandblue" : "text-ink-soft"}`}>{item.label}</Link>;
        })}
      </nav>
    </details>
  );
}
