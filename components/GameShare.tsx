"use client";

import { useEffect, useState } from "react";

// 게임 공유 버튼 — 모바일 네이티브 공유 시트 / 데스크톱 링크 복사. 다크 네온 톤.
export default function GameShare({ label, text }: { label: string; text: string }) {
  const [toast, setToast] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && "share" in navigator) setCanShare(true);
  }, []);

  async function shareOrCopy() {
    const url = window.location.href;
    if (canShare) {
      try {
        await navigator.share({ title: label, text, url });
        return;
      } catch {
        /* 취소 시 복사로 폴백 */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast(true);
      setTimeout(() => setToast(false), 1700);
    } catch {
      window.prompt("아래 링크를 복사하세요", url);
    }
  }

  return (
    <>
      <button
        onClick={shareOrCopy}
        aria-label={label}
        className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-[13px] font-black text-white transition hover:border-lime-300/50 hover:bg-white/10 hover:text-lime-200"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        {label}
      </button>
      {toast && (
        <span role="status" className="fixed bottom-6 left-1/2 z-[120] -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-sm font-bold text-lime-300 shadow-lg ring-1 ring-lime-300/30">
          링크 복사 완료! 붙여넣기로 공유하세요
        </span>
      )}
    </>
  );
}
