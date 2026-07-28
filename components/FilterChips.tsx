import Link from "next/link";
import type { ReactNode } from "react";

// 필터 한 줄(가로 스크롤로 압축 — 세로로 길어지지 않게). 우측 그라디언트로 "더 있음" 암시.
export function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-9 shrink-0 text-[12px] font-bold text-ink-faint">{label}</span>
      <div className="relative min-w-0 flex-1">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 pr-6">{children}</div>
        <span className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />
      </div>
    </div>
  );
}

export function Chip({ href, active, label, count }: { href: string; active: boolean; label: string; count?: number }) {
  return (
    <Link
      href={href}
      className={[
        "flex min-h-[36px] shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3.5 text-[13px] font-bold transition",
        active ? "bg-free text-white shadow-sm" : "border border-line bg-white text-ink-soft hover:border-free/40 hover:text-free",
      ].join(" ")}
    >
      {label}
      {typeof count === "number" && (
        <span className={["text-[11px] tabular-nums", active ? "text-white/80" : "text-ink-dim"].join(" ")}>{count}</span>
      )}
    </Link>
  );
}
