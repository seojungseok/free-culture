"use client";

import { useState } from "react";

// 현재 보고 있는 URL(필터 상태 포함)을 복사하는 플로팅 버튼
export default function FloatingShare() {
  const [toast, setToast] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      window.prompt("아래 링크를 복사하세요", window.location.href);
      return;
    }
    setToast(true);
    setTimeout(() => setToast(false), 1600);
  }

  return (
    <>
      <button
        onClick={copy}
        aria-label="이 페이지 링크 복사"
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white shadow-lg transition hover:bg-black sm:h-13 sm:w-13"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
          <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
        </svg>
      </button>
      {toast && (
        <span
          role="status"
          className="fixed bottom-20 right-5 z-40 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-lg animate-fade-in"
        >
          링크가 복사되었습니다
        </span>
      )}
    </>
  );
}
