"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CultureEvent } from "@/lib/types";
import { fmtRange } from "@/lib/format";
import PriceBadge from "./PriceBadge";

const COOKIE = "weekendPopupSeen";

function kstToday(): string {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}
function seenToday(): boolean {
  if (typeof document === "undefined") return true;
  return document.cookie
    .split("; ")
    .some((c) => c === `${COOKIE}=${kstToday()}`);
}
function markSeen() {
  // 하루 1회: 오늘 날짜를 값으로 저장, 최대 24시간 유지
  document.cookie = `${COOKIE}=${kstToday()}; path=/; max-age=86400; samesite=lax`;
}

export default function BigEventModal({ events }: { events: CultureEvent[] }) {
  const [open, setOpen] = useState(false);
  const picks = events.slice(0, 5);

  useEffect(() => {
    if (!picks.length) return;
    if (seenToday()) return;
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [picks.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function close() {
    setOpen(false);
    markSeen();
  }

  if (!open || !picks.length) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-3 animate-fade-in sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="이번 주말 무료 추천"
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={close} />

      <div className="relative z-10 flex max-h-[86vh] w-full max-w-2xl animate-pop-in flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
          <div>
            <h2 className="text-lg font-extrabold leading-tight text-ink sm:text-xl">
              🎏 이번 주말, 무료로 즐겨요
            </h2>
            <p className="mt-0.5 text-[13px] text-ink-faint">
              토·일에 갈 만한 무료·조건부 무료 행사만 골랐어요
            </p>
          </div>
          <button
            onClick={close}
            aria-label="닫기"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/[0.06] text-ink-soft transition hover:bg-black/10"
          >
            ✕
          </button>
        </div>

        {/* 카드 그리드 (스크롤 영역) */}
        <div className="grid grid-cols-2 gap-3 overflow-y-auto px-5 py-4 sm:grid-cols-3 sm:px-6">
          {picks.map((ev) => (
            <Link
              key={ev.id}
              href={`/event/${ev.id}`}
              onClick={close}
              className="group block"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-neutral-100">
                {ev.imgUrl && (
                  <Image
                    src={ev.imgUrl}
                    alt={ev.title}
                    fill
                    sizes="(max-width:640px) 45vw, 200px"
                    className="object-cover transition group-hover:scale-105"
                    unoptimized
                  />
                )}
                <div className="absolute right-1.5 top-1.5">
                  <PriceBadge type={ev.priceType} label={ev.priceLabel} size="sm" />
                </div>
              </div>
              <h3 className="mt-1.5 line-clamp-2 text-[13px] font-bold leading-snug text-ink">
                {ev.title}
              </h3>
              {ev.priceType === "partial_free" && ev.freeCondition ? (
                <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-free">
                  🎟 {ev.freeCondition}
                </p>
              ) : (
                <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-faint">
                  {ev.area} · {fmtRange(ev.startDate, ev.endDate).slice(5)}
                </p>
              )}
            </Link>
          ))}
        </div>

        {/* 푸터 */}
        <div className="border-t border-black/5 px-5 py-3 sm:px-6">
          <Link
            href="/weekend"
            onClick={close}
            className="block w-full rounded-xl bg-ink py-3 text-center text-sm font-bold text-white transition hover:bg-black"
          >
            이번 주말 행사 더보기 →
          </Link>
          <button
            onClick={close}
            className="mt-1.5 w-full py-1.5 text-center text-[13px] font-medium text-ink-faint hover:text-ink"
          >
            오늘 그만 보기
          </button>
        </div>
      </div>
    </div>
  );
}
