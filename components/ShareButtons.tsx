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

  useEffect(() => {
    if (typeof navigator !== "undefined" && "share" in navigator) setCanShare(true);
  }, []);

  async function shareOrCopy() {
    const url = window.location.href;
    if (canShare) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* 취소 시 복사로 폴백 */
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
    <div className="mt-6 grid grid-cols-2 gap-2.5">
      <button
        onClick={shareOrCopy}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-white py-3 text-sm font-bold text-ink transition hover:border-free/50 hover:text-free"
      >
        <LinkIcon /> 링크 복사
      </button>

      <a
        href={officialUrl || "#"}
        target={officialUrl ? "_blank" : undefined}
        rel="noopener noreferrer"
        aria-disabled={!officialUrl}
        onClick={(e) => {
          if (!officialUrl) e.preventDefault();
        }}
        className={[
          "inline-flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition",
          officialUrl
            ? "bg-free text-white hover:bg-freedark"
            : "cursor-not-allowed bg-neutral-200 text-neutral-400",
        ].join(" ")}
      >
        공식 페이지 <ExtIcon />
      </a>

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
function ExtIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}
