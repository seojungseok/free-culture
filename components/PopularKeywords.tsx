"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// 네이버 실시간 순위형 — 한 줄에서 키워드가 돌아가며 노출, "더보기"로 전체 펼침.
export default function PopularKeywords({ items }: { items: { label: string; href: string }[] }) {
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open || items.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 2600);
    return () => clearInterval(t);
  }, [open, items.length]);

  if (!items.length) return null;
  const cur = items[idx];

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 pt-3 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 shadow-sm sm:px-4">
        <span className="flex shrink-0 items-center gap-1 text-[12px] font-black text-free">
          <span aria-hidden>🔥</span>
          <span>인기</span>
        </span>

        {/* 한 줄 롤링 — 현재 순위 1개만 노출 */}
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <Link
            key={idx}
            href={cur.href}
            className="flex animate-fade-in items-center gap-2 truncate text-[13.5px] font-semibold text-ink transition hover:text-free"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-tint text-[11px] font-black text-freedark">
              {idx + 1}
            </span>
            <span className="truncate">{cur.label}</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold text-ink-faint transition hover:bg-black/5 hover:text-ink"
          aria-expanded={open}
        >
          {open ? "접기 ▴" : "더보기 ▾"}
        </button>
      </div>

      {/* 더보기 — 전체 순위 */}
      {open && (
        <div className="mt-2 flex flex-wrap gap-2 rounded-2xl border border-line bg-white p-3 shadow-sm">
          {items.map((p, i) => (
            <Link
              key={p.label}
              href={p.href}
              className="inline-flex items-center gap-1.5 rounded-full bg-panel px-3 py-1.5 text-[13px] font-semibold text-ink-soft transition hover:bg-tint hover:text-freedark"
            >
              <span className="text-[11px] font-black text-free">{i + 1}</span>
              {p.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
