"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

const SIDOS = ["서울", "인천", "경기", "부산", "대구", "대전", "광주", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
const SUFFIX = ["캠핑장", "글램핑", "오토캠핑", "반려동물 캠핑장", "나들이", "가볼만한 곳", "무료 공연", "전시", "축제", "맛집", "박물관", "체험"];
const POPULAR = ["글램핑", "반려동물 캠핑장", "인천 나들이", "서울 무료 공연", "경기 오토캠핑", "부산 맛집"];
const CAMP_SUFFIX = ["캠핑장", "글램핑", "오토캠핑", "카라반", "반려동물 캠핑장"];
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");

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
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = useMemo(() => {
    const nq = norm(q);
    if (!nq) return POPULAR;
    const hitSido = SIDOS.find((s) => nq.includes(norm(s)));
    const rest = hitSido ? nq.replace(norm(hitSido), "") : nq;
    // 캠핑 의도 감지("인천캠" → 인천 캠핑장/글램핑/오토캠핑/…) — 부분 입력에도 유형 확장
    if (rest && /^(캠|캠핑|글램|오토|카라|반려|야영)/.test(rest)) {
      const region = hitSido ? `${hitSido} ` : "";
      return CAMP_SUFFIX.map((s) => `${region}${s}`).filter((c) => norm(c) !== nq).slice(0, 7);
    }
    const base = hitSido ? SUFFIX.map((suf) => `${hitSido} ${suf}`) : SIDOS.flatMap((s) => SUFFIX.map((suf) => `${s} ${suf}`));
    const scored = base
      .filter((c) => norm(c).includes(nq) && norm(c) !== nq)
      .sort((a, b) => Number(norm(b).startsWith(nq)) - Number(norm(a).startsWith(nq)));
    return scored.slice(0, 7);
  }, [q]);

  function go(query: string) {
    const t = query.trim();
    if (t) router.push(`/search?q=${encodeURIComponent(t)}`);
    setOpen(false);
  }

  // 높이만 크기별로. 폰트는 항상 16px 이상 → iOS 자동 줌 방지(모바일 검색창 확대 오류 수정)
  const pad = size === "lg" ? "h-14" : size === "sm" ? "h-9" : "h-11";

  return (
    <form onSubmit={(e) => { e.preventDefault(); go(q); }} className="relative w-full" role="search">
      <input
        type="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 120); }}
        placeholder={placeholder}
        aria-label="검색"
        autoComplete="off"
        className={[
          "w-full rounded-full border border-black/10 bg-white pl-11 pr-4 text-[16px] font-medium text-ink shadow-sm outline-none transition",
          "placeholder:text-ink-faint focus:border-free/50 focus:ring-2 focus:ring-free/20",
          pad,
        ].join(" ")}
      />
      <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>

      {open && suggestions.length > 0 && (
        <ul
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-line bg-white py-1 shadow-lg"
          onMouseDown={() => { if (blurTimer.current) clearTimeout(blurTimer.current); }}
        >
          {!norm(q) && <li className="px-4 pb-1 pt-1.5 text-[11px] font-bold text-ink-faint">인기 검색어</li>}
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => { setQ(s); go(s); }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-[14px] text-ink-soft transition hover:bg-tint hover:text-free"
              >
                <svg className="h-3.5 w-3.5 shrink-0 text-ink-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
