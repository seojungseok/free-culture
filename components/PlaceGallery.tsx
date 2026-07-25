"use client";

import { useCallback, useEffect, useState } from "react";

export interface GalleryImage {
  full: string;
  thumb: string;
}

export default function PlaceGallery({
  images,
  title,
  freeBadge = false,
}: {
  images: GalleryImage[];
  title: string;
  freeBadge?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  const show = useCallback((i: number) => {
    setIdx(i);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  const prev = useCallback(
    () => setIdx((i) => (i - 1 + images.length) % images.length),
    [images.length]
  );
  const next = useCallback(
    () => setIdx((i) => (i + 1) % images.length),
    [images.length]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, prev, next]);

  if (images.length === 0) return null;
  const hero = images[0];
  const rest = images.slice(1);

  return (
    <div>
      {/* 대표 이미지 */}
      <button
        type="button"
        onClick={() => show(0)}
        className="group relative block aspect-[16/9] w-full overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/[0.04]"
        aria-label={`${title} 사진 크게 보기`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hero.full}
          alt={title}
          className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          loading="eager"
        />
        {freeBadge && (
          <span className="absolute right-2.5 top-2.5 rounded-md bg-free px-2 py-1 text-[12px] font-bold text-white shadow-sm">
            무료입장
          </span>
        )}
        {images.length > 1 && (
          <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/60 px-2.5 py-1 text-[12px] font-bold text-white backdrop-blur-sm">
            📷 {images.length}
          </span>
        )}
      </button>

      {/* 추가 사진 썸네일 */}
      {rest.length > 0 && (
        <div className="mt-2.5 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {rest.map((img, i) => (
            <button
              key={img.full}
              type="button"
              onClick={() => show(i + 1)}
              className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100 ring-1 ring-black/[0.04] transition hover:opacity-90"
              aria-label={`${title} 사진 ${i + 2}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.thumb}
                alt={`${title} 사진 ${i + 2}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      <p className="mt-2 text-[11.5px] text-ink-faint">사진 제공: 한국관광공사</p>

      {/* 라이트박스 */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} 사진 보기`}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl text-white transition hover:bg-white/25"
            aria-label="닫기"
          >
            ✕
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-2xl text-white transition hover:bg-white/25 sm:left-6"
                aria-label="이전 사진"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-2xl text-white transition hover:bg-white/25 sm:right-6"
                aria-label="다음 사진"
              >
                ›
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[idx].full}
            alt={`${title} 사진 ${idx + 1}`}
            className="max-h-[86vh] max-w-[92vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-[13px] font-bold text-white">
            {idx + 1} / {images.length}
          </span>
        </div>
      )}
    </div>
  );
}
