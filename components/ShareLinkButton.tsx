"use client";

import { useEffect, useRef, useState } from "react";

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
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copy() {
    const url = target === "origin" ? window.location.origin : window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("아래 링크를 복사하세요", url);
      return;
    }
    setToast(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(false), 1600);
  }

  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1">
      <button
        type="button"
        onClick={copy}
        className={[
          "inline-flex min-h-[44px] items-center gap-1 rounded-full font-semibold text-ink-soft transition hover:bg-black/5 hover:text-free",
          size === "md" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-[13px]",
        ].join(" ")}
      >
        <LinkIcon /> {label}
      </button>
      <span role="status" aria-live="polite" className="text-xs font-semibold text-free">{toast ? "링크가 복사되었습니다" : ""}</span>
    </span>
  );
}

function LinkIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  );
}
