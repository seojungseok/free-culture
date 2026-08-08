"use client";

import { useEffect, useState } from "react";

// 코스/글 공유 버튼 — 모바일은 네이티브 공유 시트(카톡·메시지 등), 데스크톱은 링크 복사.
export default function CourseShare({ title, compact = false }: { title: string; compact?: boolean }) {
  const [toast, setToast] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && "share" in navigator) setCanShare(true);
  }, []);

  async function shareOrCopy() {
    const url = window.location.href;
    if (canShare) {
      try {
        await navigator.share({ title, text: `${title} — 여행코스`, url });
        return;
      } catch {
        /* 사용자가 취소하면 복사로 폴백 */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast(true);
      setTimeout(() => setToast(false), 1600);
    } catch {
      window.prompt("아래 링크를 복사하세요", url);
    }
  }

  return (
    <>
      <button
        onClick={shareOrCopy}
        aria-label="이 코스 공유하기"
        className={
          compact
            ? "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3.5 py-2 text-[13px] font-bold text-freedark ring-1 ring-line transition hover:bg-tint"
            : "inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-free px-5 py-3.5 text-[15px] font-extrabold text-white shadow-sm transition hover:bg-freedark sm:w-auto"
        }
      >
        <ShareIcon />
        {compact ? "공유" : canShare ? "이 코스 공유하기" : "링크 복사해서 공유"}
      </button>
      {toast && (
        <span
          role="status"
          className="fixed bottom-6 left-1/2 z-[120] -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-lg animate-fade-in"
        >
          링크가 복사되었어요 — 붙여넣기로 공유하세요
        </span>
      )}
    </>
  );
}

function ShareIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}
