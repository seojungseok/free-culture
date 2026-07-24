"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CultureEvent } from "@/lib/types";
import { fmtRange, dday } from "@/lib/format";
import PriceBadge from "./PriceBadge";
import { SITE } from "@/lib/site";

export default function PosterCard({
  ev,
  priority = false,
}: {
  ev: CultureEvent;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [copied, setCopied] = useState(false);
  const d = dday(ev.startDate, ev.endDate);
  const hasImg = ev.imgUrl && !errored;

  async function copyLink(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${SITE.url.replace(/\/$/, "")}/event/${ev.id}`;
    try {
      await navigator.clipboard.writeText(
        typeof window !== "undefined" ? `${window.location.origin}/event/${ev.id}` : url
      );
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <Link
      href={`/event/${ev.id}`}
      className="group block"
      aria-label={ev.title}
    >
      <div
        style={{ aspectRatio: "3 / 4" }}
        className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-black/[0.04] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-cardhover"
      >
        {hasImg ? (
          <>
            {!loaded && <div className="skeleton absolute inset-0" />}
            <Image
              src={ev.imgUrl}
              alt={ev.title}
              fill
              sizes="(max-width:640px) 50vw, (max-width:1024px) 25vw, 180px"
              className={[
                "object-cover transition-all duration-500 group-hover:scale-[1.05]",
                loaded ? "opacity-100" : "opacity-0",
              ].join(" ")}
              onLoad={() => setLoaded(true)}
              onError={() => setErrored(true)}
              priority={priority}
              unoptimized
            />
          </>
        ) : (
          <PosterFallback title={ev.title} realm={ev.realmName} />
        )}

        {/* 하단 그라디언트 (배지 가독성) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/25 to-transparent" />

        {/* 가격 배지 (우상단) */}
        <div className="absolute right-1.5 top-1.5">
          <PriceBadge type={ev.priceType} label={ev.priceLabel} size="sm" />
        </div>

        {/* D-day (좌상단) — 빨강은 오늘/내일 마감만 */}
        {d && (
          <div className="absolute left-1.5 top-1.5">
            <span
              className={[
                "rounded-md px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-sm",
                d.critical ? "bg-danger text-white" : "bg-black/55 text-white",
              ].join(" ")}
            >
              {d.label}
            </span>
          </div>
        )}

        {/* 공유(링크 복사) — 모바일 항상 / 데스크톱 hover */}
        <button
          onClick={copyLink}
          aria-label="이 행사 링크 복사"
          className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white opacity-100 backdrop-blur-sm transition hover:bg-black/70 sm:opacity-0 sm:group-hover:opacity-100"
        >
          {copied ? (
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
              <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
            </svg>
          )}
        </button>
      </div>

      {/* 정보 (압축) */}
      <div className="px-0.5 pb-1 pt-2">
        <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-ink group-hover:text-black">
          {ev.title}
        </h3>
        {ev.priceType === "partial_free" && ev.freeCondition ? (
          <p className="mt-0.5 line-clamp-1 text-[11.5px] font-semibold text-free">
            🎟 {ev.freeCondition}
          </p>
        ) : null}
        <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-faint">
          {ev.area}
          {ev.place ? ` · ${ev.place}` : ""}
        </p>
        <p className="mt-0.5 text-[12px] tabular-nums text-ink-dim">
          {fmtRange(ev.startDate, ev.endDate)}
        </p>
      </div>
    </Link>
  );
}

function PosterFallback({ title, realm }: { title: string; realm: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 p-3 text-center">
      <span className="mb-1.5 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-ink-soft">
        {realm || "문화행사"}
      </span>
      <span className="line-clamp-4 text-[13px] font-semibold text-ink-soft">
        {title}
      </span>
    </div>
  );
}
