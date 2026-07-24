"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBox({
  size = "md",
  placeholder = "행사·장소·지역 검색",
  defaultValue = "",
}: {
  size?: "sm" | "md" | "lg";
  placeholder?: string;
  defaultValue?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  const pad =
    size === "lg" ? "h-14 text-base" : size === "sm" ? "h-9 text-sm" : "h-11 text-sm";

  return (
    <form onSubmit={submit} className="relative w-full">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="검색"
        className={[
          "w-full rounded-full border border-black/10 bg-white pl-11 pr-4 font-medium text-ink shadow-sm outline-none transition",
          "placeholder:text-ink-faint focus:border-free/50 focus:ring-2 focus:ring-free/20",
          pad,
        ].join(" ")}
      />
      <svg
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    </form>
  );
}
