"use client";

import { useRef, type ReactNode } from "react";

// 가로 카드 레일 — 모바일 스와이프 / 데스크톱 화살표로 넘김. 카드섹션 공통 패턴.
export default function ScrollRail({
  children,
  ariaLabel,
}: {
  children: ReactNode;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const nudge = (dir: number) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.82, behavior: "smooth" });
  };

  return (
    <div className="group relative">
      <div
        ref={ref}
        aria-label={ariaLabel}
        className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1 no-scrollbar sm:mx-0 sm:gap-4 sm:px-0"
      >
        {children}
      </div>

      <button
        aria-label="이전"
        onClick={() => nudge(-1)}
        className="absolute -left-3 top-[34%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-[20px] text-ink opacity-0 shadow-card transition hover:text-free group-hover:opacity-100 md:flex"
      >
        ‹
      </button>
      <button
        aria-label="다음"
        onClick={() => nudge(1)}
        className="absolute -right-3 top-[34%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-[20px] text-ink opacity-0 shadow-card transition hover:text-free group-hover:opacity-100 md:flex"
      >
        ›
      </button>
    </div>
  );
}
