"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export interface HomeExploreItem {
  id: string;
  href: string;
  title: string;
  meta: string;
  image: string;
  badge: string;
}

export interface HomeExploreCategory {
  key: string;
  label: string;
  href: string;
  items: HomeExploreItem[];
}

export default function HomeCategoryBrowser({ categories }: { categories: HomeExploreCategory[] }) {
  const available = useMemo(() => categories.filter((c) => c.items.length), [categories]);
  const [active, setActive] = useState(available[0]?.key || "");
  const current = available.find((c) => c.key === active) || available[0];

  useEffect(() => {
    const syncFromHash = () => {
      const key = window.location.hash.replace("#home-category-", "");
      if (key && available.some((c) => c.key === key)) setActive(key);
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [available]);

  if (!current) return null;

  const select = (key: string) => {
    setActive(key);
    window.history.replaceState(null, "", `#home-category-${key}`);
  };

  return (
    <section id="home-category-browser" className="mx-auto w-full max-w-[1180px] px-5 pt-6 sm:px-6 sm:pt-9 lg:px-8">
      <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.12em] text-brandblue">한 번 눌러서 보기</p>
          <h2 className="mt-1 text-[20px] font-black tracking-tight text-ink sm:text-[24px]">원하는 콘텐츠만 골라보세요</h2>
        </div>
        <Link href={current.href} className="shrink-0 text-[13px] font-bold text-ink-soft transition hover:text-brandblue sm:text-[14px]">
          더보기 ›
        </Link>
      </div>

      <div className="-mx-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-2 sm:flex-wrap">
          {available.map((cat) => {
            const isActive = cat.key === current.key;
            return (
              <button
                key={cat.key}
                id={`home-category-${cat.key}`}
                type="button"
                onClick={() => select(cat.key)}
                className={[
                  "rounded-full border px-4 py-2 text-[13px] font-black shadow-sm transition sm:text-[14px]",
                  isActive
                    ? "border-brandblue bg-brandblue text-white"
                    : "border-[#dfe4ee] bg-white text-[#102344] hover:border-brandblue/40 hover:text-brandblue",
                ].join(" ")}
                aria-pressed={isActive}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {current.items.slice(0, 4).map((item) => (
          <Link
            key={item.id}
            href={item.href}
            prefetch={false}
            className="group overflow-hidden rounded-2xl border border-[#e3e7ee] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-cardhover"
          >
            <div className="relative aspect-[1.45/1] overflow-hidden bg-neutral-100">
              {item.image ? (
                <Image src={item.image} alt={item.title} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" unoptimized />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-[#eef4fb] to-[#dfe9f5]" />
              )}
              <span className="absolute left-2.5 top-2.5 rounded-md bg-black/55 px-2 py-1 text-[11px] font-black text-white backdrop-blur-sm">
                {item.badge}
              </span>
            </div>
            <div className="p-3.5">
              <h3 className="line-clamp-2 min-h-[40px] text-[15px] font-black leading-snug text-ink sm:text-[16px]">{item.title}</h3>
              <p className="mt-1.5 line-clamp-1 text-[12.5px] font-semibold text-ink-faint">{item.meta}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
