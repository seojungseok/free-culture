"use client";

import { usePathname, useRouter } from "next/navigation";

// 사이트 자체 뒤로가기 — 홈에선 숨김, 하위 화면에만. history.back(무이력 시 홈).
export default function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/") return null;

  return (
    <button
      type="button"
      aria-label="이전 화면으로"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) router.back();
        else router.push("/");
      }}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-tint hover:text-free"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-6 w-6">
        <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
