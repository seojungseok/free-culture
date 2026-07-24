"use client";

import { useState } from "react";

// 링크 복사 버튼. target="current"=현재 URL(필터 포함), "origin"=사이트 메인 주소.
export default function ShareLinkButton({
  label,
  target = "current",
  size = "sm",
}: {
  label: string;
  target?: "current" | "origin";
  size?: "sm" | "md";
}) {
  const [toast, setToast] = useState(false);

  async function copy() {
    const url = target === "origin" ? window.location.origin : window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("아래 링크를 복사하세요", url);
      return;
    }
    setToast(true);
    setTimeout(() => setToast(false), 1600);
  }

  return (
    <>
      <button
        onClick={copy}
        className={[
          "inline-flex items-center gap-1 rounded-full font-semibold text-ink-soft transition hover:bg-black/5 hover:text-free",
          size === "md" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-[13px]",
        ].join(" ")}
      >
        <LinkIcon /> {label}
      </button>
      {toast && (
        <span
          role="status"
          className="fixed bottom-6 left-1/2 z-[120] -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-lg animate-fade-in"
        >
          링크가 복사되었습니다
        </span>
      )}
    </>
  );
}

function LinkIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  );
}
