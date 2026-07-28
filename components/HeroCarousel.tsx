"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export interface HeroSlide {
  image: string;
  badge: string;
  title: string;
  sub?: string;
  href: string;
}

// 이번 주말 추천 히어로 — peek(양옆 살짝 보임) + 화살표 + 인디케이터 + 자동전환
export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;

  const scrollToIdx = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[i] as HTMLElement | undefined;
    if (child) {
      const left = child.offsetLeft - (track.clientWidth - child.clientWidth) / 2;
      track.scrollTo({ left, behavior: "smooth" });
    }
  }, []);

  const go = useCallback(
    (i: number) => {
      const ni = ((i % n) + n) % n;
      setIdx(ni);
      scrollToIdx(ni);
    },
    [n, scrollToIdx]
  );

  // 자동 전환 (5초, hover 시 정지)
  useEffect(() => {
    if (paused || n <= 1) return;
    const t = setInterval(() => go(idx + 1), 5000);
    return () => clearInterval(t);
  }, [idx, paused, n, go]);

  // 수동 스와이프 시 활성 인덱스 동기화
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const i = Number((e.target as HTMLElement).dataset.i);
            if (!Number.isNaN(i)) setIdx(i);
          }
        }
      },
      { root: track, threshold: [0.6] }
    );
    Array.from(track.children).forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [n]);

  if (n === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-[4%] no-scrollbar sm:px-[7%]"
      >
        {slides.map((s, i) => (
          <Link
            key={i}
            data-i={i}
            href={s.href}
            className="group relative h-[190px] w-[92%] shrink-0 snap-center overflow-hidden rounded-2xl bg-neutral-200 sm:h-[300px] sm:w-[86%] lg:h-[380px]"
          >
            <Image
              src={s.image}
              alt={s.title}
              fill
              sizes="(max-width:1200px) 86vw, 1040px"
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
              priority={i === 0}
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center gap-2 p-6 sm:gap-3 sm:p-10 lg:p-12">
              <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm sm:text-[12px]">
                {s.badge}
              </span>
              <div className="max-w-[80%] text-[22px] font-black leading-[1.15] tracking-[-0.02em] text-white sm:max-w-[65%] sm:text-[34px] lg:text-[40px]">
                {s.title}
              </div>
              {s.sub && (
                <p className="max-w-[80%] text-[13px] font-medium text-white/85 sm:max-w-[60%] sm:text-[16px]">
                  {s.sub}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {n > 1 && (
        <>
          <button
            aria-label="이전 배너"
            onClick={() => go(idx - 1)}
            className="absolute left-[8%] top-1/2 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[22px] text-ink shadow-card transition hover:bg-white md:flex"
          >
            ‹
          </button>
          <button
            aria-label="다음 배너"
            onClick={() => go(idx + 1)}
            className="absolute right-[8%] top-1/2 hidden h-11 w-11 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-white/90 text-[22px] text-ink shadow-card transition hover:bg-white md:flex"
          >
            ›
          </button>
          <div className="absolute bottom-4 right-[9%] rounded-full bg-black/45 px-3 py-1 text-[12px] font-bold tabular-nums text-white backdrop-blur-sm">
            {idx + 1} / {n}
          </div>
        </>
      )}
    </div>
  );
}
