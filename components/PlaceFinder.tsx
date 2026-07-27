"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SIDO_LIST, SIDO_SLUG } from "@/lib/classify";

type Cat = "nadeuli" | "camping" | "events";
const CATS: { key: Cat; label: string; emoji: string }[] = [
  { key: "nadeuli", label: "나들이", emoji: "🏞️" },
  { key: "camping", label: "캠핑", emoji: "⛺" },
  { key: "events", label: "문화행사", emoji: "🎭" },
];
type Group = { key: string; label: string; opts: [string, string][] };
const OPTS: Record<Cat, Group[]> = {
  nadeuli: [
    { key: "type", label: "유형", opts: [["", "전체"], ["12", "관광지"], ["14", "문화시설"], ["28", "체험"]] },
    { key: "who", label: "누구와", opts: [["", "전체"], ["kid", "아이와"]] },
  ],
  camping: [
    { key: "type", label: "유형", opts: [["", "전체"], ["글램핑", "글램핑"], ["오토캠핑", "오토캠핑"], ["카라반", "카라반"], ["일반야영장", "일반"]] },
    { key: "pet", label: "가족", opts: [["", "전체"], ["1", "반려동물"]] },
    { key: "facility", label: "시설", opts: [["", "전체"], ["전기", "전기"], ["샤워실", "샤워실"], ["와이파이", "와이파이"], ["온수", "온수"]] },
  ],
  events: [
    { key: "price", label: "가격", opts: [["", "전체"], ["free", "무료"], ["cheap", "1만원↓"]] },
    { key: "genre", label: "장르", opts: [["", "전체"], ["exhibition", "전시"], ["concert", "공연"], ["festival", "축제"], ["kids", "체험"]] },
    { key: "when", label: "시기", opts: [["", "전체"], ["today", "오늘"], ["weekend", "이번주말"], ["month", "이번달"]] },
  ],
};

export default function PlaceFinder() {
  const router = useRouter();
  const [cat, setCat] = useState<Cat>("camping");
  const [sel, setSel] = useState<Record<string, string>>({});
  const [count, setCount] = useState<number | null>(null);
  const [alt, setAlt] = useState<{ area: string; count: number } | null>(null);
  const [loading, setLoading] = useState(false);

  function pick(key: string, val: string) {
    setSel((s) => ({ ...s, [key]: s[key] === val ? "" : val }));
  }
  function switchCat(c: Cat) { setCat(c); setSel({}); }

  const query = useMemo(() => {
    const p = new URLSearchParams({ cat });
    for (const [k, v] of Object.entries(sel)) if (v) p.set(k, v);
    return p.toString();
  }, [cat, sel]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/finder?${query}`);
        const j = await r.json();
        if (live) { setCount(j.count); setAlt(j.alt || null); }
      } catch { if (live) { setCount(null); setAlt(null); } }
      finally { if (live) setLoading(false); }
    }, 120);
    return () => { live = false; clearTimeout(t); };
  }, [query]);

  // 선택 조건 → 결과 페이지 딥링크
  const resultHref = useMemo(() => {
    const slug = sel.area ? (SIDO_SLUG as Record<string, string>)[sel.area] : "";
    if (cat === "camping") {
      const p = new URLSearchParams();
      for (const k of ["area", "type", "facility"]) if (sel[k]) p.set(k, sel[k]);
      if (sel.pet) p.set("pet", "1");
      return `/camping${p.toString() ? `?${p}` : ""}`;
    }
    if (cat === "nadeuli") {
      const p = new URLSearchParams();
      if (sel.type) p.set("type", sel.type);
      if (sel.who) p.set("who", sel.who);
      if (sel.price) p.set("price", sel.price);
      const base = slug ? `/places/${slug}` : "/places";
      return `${base}${p.toString() ? `?${p}` : ""}`;
    }
    if (sel.genre) return `/genre/${sel.genre}`;
    const p = new URLSearchParams();
    if (sel.price) p.set("price", sel.price);
    const base = slug ? `/region/${slug}` : "/events";
    return `${base}${p.toString() ? `?${p}` : ""}`;
  }, [cat, sel]);

  const activeChips = Object.entries(sel).filter(([, v]) => v);
  const labelOf = (key: string, val: string) => {
    if (key === "area") return val;
    const g = OPTS[cat].find((x) => x.key === key);
    return g?.opts.find(([v]) => v === val)?.[1] || val;
  };

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5">
      {/* 카테고리 탭 */}
      <div className="flex gap-2">
        {CATS.map((c) => (
          <button key={c.key} onClick={() => switchCat(c.key)}
            className={["flex-1 rounded-xl px-3 py-2.5 text-[15px] font-bold transition", cat === c.key ? "bg-free text-white shadow-sm" : "bg-panel text-ink-soft hover:text-free"].join(" ")}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* 지역(시도) */}
      <Row label="지역">
        <Chip active={!sel.area} label="전국" onClick={() => setSel((s) => ({ ...s, area: "" }))} />
        {SIDO_LIST.map((a) => (
          <Chip key={a} active={sel.area === a} label={a} onClick={() => pick("area", a)} />
        ))}
      </Row>

      {/* 카테고리별 조건 */}
      {OPTS[cat].map((g) => (
        <Row key={g.key} label={g.label}>
          {g.opts.map(([v, l]) => (
            <Chip key={v || "all"} active={v ? sel[g.key] === v : !sel[g.key]} label={l} onClick={() => (v ? pick(g.key, v) : setSel((s) => ({ ...s, [g.key]: "" })))} isAll={!v} />
          ))}
        </Row>
      ))}

      {/* 선택 조건 + 초기화 */}
      {activeChips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {activeChips.map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1 rounded-full bg-tint px-2.5 py-1 text-[12px] font-bold text-freedark">
              {labelOf(k, v)}
              <button onClick={() => setSel((s) => ({ ...s, [k]: "" }))} aria-label={`${labelOf(k, v)} 해제`} className="text-freedark/70 hover:text-freedark">✕</button>
            </span>
          ))}
          <button onClick={() => setSel({})} className="text-[12px] font-semibold text-ink-faint underline hover:text-ink">전체 초기화</button>
        </div>
      )}

      {/* 실시간 카운트 + 결과 보기 */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        <div className="text-[15px]">
          <span className="text-ink-soft">결과 </span>
          <b className="text-[20px] text-free">{loading || count === null ? "…" : count.toLocaleString()}</b>
          <span className="text-ink-soft">곳</span>
          {!loading && count === 0 && alt && (
            <p className="mt-0.5 text-[12.5px] text-ink-faint">조건을 완화해보세요 · 인접 <b className="text-ink-soft">{alt.area}</b>에 {alt.count.toLocaleString()}곳 있어요</p>
          )}
        </div>
        {count && count > 0 ? (
          <Link href={resultHref} className="shrink-0 rounded-full bg-ink px-6 py-3 text-[15px] font-bold text-white transition hover:bg-black">결과 보기 →</Link>
        ) : alt ? (
          <button onClick={() => setSel((s) => ({ ...s, area: alt.area }))} className="shrink-0 rounded-full border border-free/40 bg-white px-5 py-3 text-[14px] font-bold text-free transition hover:bg-tint">{alt.area}로 보기 →</button>
        ) : (
          <span className="shrink-0 rounded-full bg-neutral-200 px-6 py-3 text-[15px] font-bold text-ink-faint">결과 보기 →</span>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 flex items-start gap-2">
      <span className="mt-1.5 w-10 shrink-0 text-[12.5px] font-bold text-ink-faint">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void; isAll?: boolean }) {
  return (
    <button onClick={onClick}
      className={["rounded-full px-3.5 py-2 text-[13.5px] font-bold transition", active ? "bg-free text-white shadow-sm" : "border border-line bg-white text-ink-soft hover:border-free/40 hover:text-free"].join(" ")}>
      {label}
    </button>
  );
}
