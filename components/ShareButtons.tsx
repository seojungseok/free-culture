"use client";

import { useEffect, useState } from "react";

export default function ShareButtons({
  title,
  officialUrl,
}: {
  title: string;
  officialUrl?: string;
}) {
  const [toast, setToast] = useState(false);
  const [canShare, setCanShare] = useState(false);

  // navigator.share 지원 여부 (모바일)
  useEffect(() => {
    if (typeof navigator !== "undefined" && "share" in navigator) setCanShare(true);
  }, []);

  function showToast() {
    setToast(true);
    setTimeout(() => setToast(false), 1600);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast();
    } catch {
      // 클립보드 실패 시 선택 폴백
      window.prompt("아래 링크를 복사하세요", window.location.href);
    }
  }

  async function webShare() {
    try {
      await navigator.share({ title, url: window.location.href });
    } catch {
      /* 사용자 취소 등 무시 */
    }
  }

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {officialUrl && (
        <a
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-free px-6 py-3 text-sm font-bold text-white transition hover:bg-freedark"
        >
          공식 홈페이지 바로가기 ↗
        </a>
      )}

      {canShare ? (
        <button
          onClick={webShare}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-5 py-3 text-sm font-bold text-ink-soft transition hover:border-free/40 hover:text-free"
        >
          <ShareIcon /> 공유
        </button>
      ) : (
        <button
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-5 py-3 text-sm font-bold text-ink-soft transition hover:border-free/40 hover:text-free"
        >
          <LinkIcon /> 링크 복사
        </button>
      )}

      {/* 데스크톱에서도 링크 복사 별도 제공 */}
      {canShare && (
        <button
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-5 py-3 text-sm font-bold text-ink-soft transition hover:border-free/40 hover:text-free"
        >
          <LinkIcon /> 링크 복사
        </button>
      )}

      {toast && (
        <span
          role="status"
          className="fixed bottom-6 left-1/2 z-[120] -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-lg animate-fade-in"
        >
          링크가 복사되었습니다
        </span>
      )}
    </div>
  );
}

function LinkIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" />
    </svg>
  );
}
