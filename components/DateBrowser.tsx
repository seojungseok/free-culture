"use client";

import {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
  Fragment,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CultureEvent } from "@/lib/types";
import PosterCard from "./PosterCard";
import AdSlot from "./AdSlot";
import { Container } from "./Band";
import ShareLinkButton from "./ShareLinkButton";
import { GENRES, SIDO_LIST, SIDO_SLUG, sidoFromSlug, genreLabelOf } from "@/lib/classify";
import {
  todayYmd,
  ymdToDash,
  dashToYmd,
  formatKoreanDate,
  dowOf,
  monthDays,
  addDaysYmd,
  weekendRangeYmd,
  weekRangeYmd,
  monthRangeYmd,
} from "@/lib/dates";

type Kind = "day" | "weekend" | "week" | "month";
type Sort = "free" | "ending" | "name";
type PriceKey = "all" | "free" | "partial" | "cheap" | "paid";

const PAGE = 42;
const PRICE_RANK: Record<string, number> = { free: 0, free_estimated: 1, partial_free: 2, cheap: 3, paid: 4, unknown: 5 };
const isFreeLike = (t: string) => t === "free" || t === "free_estimated" || t === "partial_free";

const PRICE_MATCH: Record<PriceKey, (t: string) => boolean> = {
  all: () => true,
  free: (t) => t === "free" || t === "free_estimated",
  partial: (t) => t === "partial_free",
  cheap: (t) => t === "cheap",
  paid: (t) => t === "paid",
};
const PRICE_TABS: { key: PriceKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "free", label: "무료" },
  { key: "partial", label: "조건부 무료" },
  { key: "cheap", label: "1만원↓" },
  { key: "paid", label: "유료" },
];
const PRICE_LABEL: Record<PriceKey, string> = { all: "", free: "무료", partial: "조건부 무료", cheap: "1만원 이하", paid: "유료" };

const PERIODS: { key: Kind; label: string }[] = [
  { key: "day", label: "오늘" },
  { key: "weekend", label: "이번 주말" },
  { key: "week", label: "이번 주" },
  { key: "month", label: "이번 달" },
];
const SORTS: { key: Sort; label: string }[] = [
  { key: "free", label: "무료 먼저" },
  { key: "ending", label: "마감 임박순" },
  { key: "name", label: "이름순" },
];
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const GENRE_TABS = [{ key: "", label: "전체" }, ...GENRES.map((g) => ({ key: g.key, label: g.label }))];

export default function DateBrowser({
  events,
  initial,
}: {
  events: CultureEvent[];
  initial?: { region?: string; genre?: string; price?: PriceKey };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = todayYmd();

  const initDate = searchParams.get("date");
  const initPeriod = searchParams.get("period") as Kind | null;
  const [kind, setKind] = useState<Kind>(initPeriod && ["weekend", "week", "month"].includes(initPeriod) ? initPeriod : "day");
  const [day, setDay] = useState<string>(initDate ? dashToYmd(initDate) : today);
  const urlRegion = searchParams.get("region");
  const [region, setRegion] = useState<string>((urlRegion && sidoFromSlug(urlRegion)) || initial?.region || "");
  const [genre, setGenre] = useState<string>(searchParams.get("genre") || initial?.genre || "");
  const [price, setPrice] = useState<PriceKey>((searchParams.get("price") as PriceKey) || initial?.price || "all");
  const [ending, setEnding] = useState<boolean>(searchParams.get("ending") === "1");
  const [kids, setKids] = useState<boolean>(searchParams.get("kids") === "1");
  const [sort, setSort] = useState<Sort>("free");
  const [visible, setVisible] = useState(PAGE);
  const [view, setView] = useState(() => {
    const a = initDate ? dashToYmd(initDate) : today;
    return { y: Number(a.slice(0, 4)), m: Number(a.slice(4, 6)) - 1 };
  });

  const todayRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    todayRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [view.y, view.m]);

  const range = useMemo(() => {
    if (kind === "day") return { start: day, end: day };
    if (kind === "weekend") return weekendRangeYmd(today);
    if (kind === "week") return weekRangeYmd(today);
    return monthRangeYmd(Number(today.slice(0, 4)), Number(today.slice(4, 6)) - 1);
  }, [kind, day, today]);

  const soonLimit = useMemo(() => addDaysYmd(today, 7), [today]);
  const mRegion = useCallback((e: CultureEvent) => !region || e.area === region, [region]);
  const mGenre = useCallback((e: CultureEvent) => !genre || e.genreKey === genre, [genre]);
  const mPrice = useCallback((e: CultureEvent) => PRICE_MATCH[price](e.priceType), [price]);
  const mDate = useCallback((e: CultureEvent) => e.startDate <= range.end && e.endDate >= range.start, [range]);
  const mEnding = useCallback((e: CultureEvent) => !ending || (e.endDate >= today && e.endDate <= soonLimit), [ending, today, soonLimit]);
  const mKids = useCallback((e: CultureEvent) => !kids || !!e.audiences?.includes("kids"), [kids]);

  const filtered = useMemo(() => {
    const list = events.filter((e) => mRegion(e) && mGenre(e) && mPrice(e) && mDate(e) && mEnding(e) && mKids(e));
    const cmp: Record<Sort, (a: CultureEvent, b: CultureEvent) => number> = {
      free: (a, b) => (PRICE_RANK[a.priceType] ?? 9) - (PRICE_RANK[b.priceType] ?? 9) || a.endDate.localeCompare(b.endDate),
      ending: (a, b) => a.endDate.localeCompare(b.endDate),
      name: (a, b) => a.title.localeCompare(b.title, "ko"),
    };
    return [...list].sort(cmp[sort]);
  }, [events, mRegion, mGenre, mPrice, mDate, mEnding, mKids, sort]);

  // 교차 건수 (각 차원은 자신 제외 나머지 필터 기준)
  const regionCounts = useMemo(() => {
    const c: Record<string, number> = { "": 0 };
    for (const s of SIDO_LIST) c[s] = 0;
    for (const e of events) if (mGenre(e) && mPrice(e) && mDate(e) && mEnding(e) && mKids(e)) { c[""]++; if (e.area in c) c[e.area]++; }
    return c;
  }, [events, mGenre, mPrice, mDate, mEnding, mKids]);

  const genreCounts = useMemo(() => {
    const c: Record<string, number> = { "": 0 };
    for (const g of GENRES) c[g.key] = 0;
    for (const e of events) if (mRegion(e) && mPrice(e) && mDate(e) && mEnding(e) && mKids(e)) { c[""]++; if (e.genreKey in c) c[e.genreKey]++; }
    return c;
  }, [events, mRegion, mPrice, mDate, mEnding, mKids]);

  const priceCounts = useMemo(() => {
    const c: Record<PriceKey, number> = { all: 0, free: 0, partial: 0, cheap: 0, paid: 0 };
    for (const e of events) if (mRegion(e) && mGenre(e) && mDate(e) && mEnding(e) && mKids(e)) {
      c.all++;
      (Object.keys(PRICE_MATCH) as PriceKey[]).forEach((k) => { if (k !== "all" && PRICE_MATCH[k](e.priceType)) c[k]++; });
    }
    return c;
  }, [events, mRegion, mGenre, mDate, mEnding, mKids]);

  // 선택 필터가 0건이 되면 자동 해제
  useEffect(() => { if (genre && genreCounts[genre] === 0) setGenre(""); }, [genre, genreCounts]);
  useEffect(() => { if (price !== "all" && priceCounts[price] === 0) setPrice("all"); }, [price, priceCounts]);

  const dayStats = useMemo(() => {
    const days = monthDays(view.y, view.m);
    const map: Record<string, { count: number; freeCount: number }> = {};
    for (const d of days) map[d] = { count: 0, freeCount: 0 };
    for (const e of events) {
      if (!(mRegion(e) && mGenre(e) && mPrice(e) && mKids(e))) continue;
      for (const d of days) if (e.startDate <= d && e.endDate >= d) { map[d].count++; if (isFreeLike(e.priceType)) map[d].freeCount++; }
    }
    return { days, map };
  }, [events, mRegion, mGenre, mPrice, mKids, view.y, view.m]);

  const hasEstimated = useMemo(() => filtered.some((e) => e.priceType === "free_estimated"), [filtered]);
  const shown = filtered.slice(0, visible);

  const syncUrl = useCallback(
    (next: Partial<{ region: string; genre: string; price: PriceKey; kind: Kind; day: string; ending: boolean; kids: boolean }>) => {
      const p = new URLSearchParams(searchParams.toString());
      const set = (k: string, v: string, def = "") => (v && v !== def ? p.set(k, v) : p.delete(k));
      const r = next.region ?? region;
      set("region", r ? (SIDO_SLUG as Record<string, string>)[r] || "" : "");
      set("genre", next.genre ?? genre);
      set("price", next.price ?? price, "all");
      (next.ending ?? ending) ? p.set("ending", "1") : p.delete("ending");
      (next.kids ?? kids) ? p.set("kids", "1") : p.delete("kids");
      const k = next.kind ?? kind;
      const d = next.day ?? day;
      p.delete("date"); p.delete("period");
      if (k === "day") { if (d !== today) p.set("date", ymdToDash(d)); } else p.set("period", k);
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, region, genre, price, ending, kids, kind, day, today]
  );

  const resetVis = () => setVisible(PAGE);
  function pickRegion(r: string) { setRegion(r); resetVis(); syncUrl({ region: r }); }
  function pickGenre(g: string) { setGenre(g); resetVis(); syncUrl({ genre: g }); }
  function pickPrice(pk: PriceKey) { setPrice(pk); resetVis(); syncUrl({ price: pk }); }
  function pickDay(d: string) { setKind("day"); setDay(d); resetVis(); syncUrl({ kind: "day", day: d }); }
  function pickPeriod(k: Kind) { setKind(k); resetVis(); if (k === "day") setDay(today); syncUrl({ kind: k, day: today }); }
  function toggleWeekend() { const nk: Kind = kind === "weekend" ? "day" : "weekend"; setKind(nk); resetVis(); if (nk === "day") setDay(today); syncUrl({ kind: nk, day: today }); }
  function toggleEnding() { const v = !ending; setEnding(v); resetVis(); syncUrl({ ending: v }); }
  function toggleKids() { const v = !kids; setKids(v); resetVis(); syncUrl({ kids: v }); }
  function shiftMonth(delta: number) { setView((v) => { const d = new Date(Date.UTC(v.y, v.m + delta, 1)); return { y: d.getUTCFullYear(), m: d.getUTCMonth() }; }); }
  function resetAll() {
    setRegion(""); setGenre(""); setPrice("all"); setEnding(false); setKids(false); setKind("day"); setDay(today); resetVis();
    router.replace(pathname, { scroll: false });
  }

  const headerLabel = kind === "day" ? formatKoreanDate(day) : kind === "weekend" ? "이번 주말" : kind === "week" ? "이번 주" : "이번 달";

  // 선택된 필터 요약
  const chips: { label: string; onRemove: () => void }[] = [];
  if (kind !== "day") chips.push({ label: PERIODS.find((p) => p.key === kind)!.label, onRemove: () => pickPeriod("day") });
  else if (day !== today) chips.push({ label: formatKoreanDate(day), onRemove: () => pickDay(today) });
  if (region) chips.push({ label: region, onRemove: () => pickRegion("") });
  if (genre) chips.push({ label: genreLabelOf(genre), onRemove: () => pickGenre("") });
  if (price !== "all") chips.push({ label: PRICE_LABEL[price], onRemove: () => pickPrice("all") });
  if (ending) chips.push({ label: "곧 종료", onRemove: () => toggleEnding() });
  if (kids) chips.push({ label: "아이와 함께", onRemove: () => toggleKids() });

  return (
    <>
      {/* 달력 띠 */}
      <div className="border-b border-line bg-white">
        <Container className="py-4">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button onClick={() => shiftMonth(-1)} aria-label="이전 달" className="flex h-7 w-7 items-center justify-center rounded-full text-ink-soft transition hover:bg-black/5">‹</button>
              <span className="min-w-[84px] text-center text-[14px] font-bold text-ink">{view.y}년 {view.m + 1}월</span>
              <button onClick={() => shiftMonth(1)} aria-label="다음 달" className="flex h-7 w-7 items-center justify-center rounded-full text-ink-soft transition hover:bg-black/5">›</button>
            </div>
            <div className="flex gap-1">
              {PERIODS.map((pp) => (
                <button key={pp.key} onClick={() => pickPeriod(pp.key)} className={["rounded-full px-3 py-1 text-[12.5px] font-bold transition", kind === pp.key ? "bg-free text-white" : "border border-line bg-white text-ink-soft hover:border-free/40 hover:text-free"].join(" ")}>{pp.label}</button>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white to-transparent" />
            <div className="flex gap-0.5 overflow-x-auto no-scrollbar">
              {dayStats.days.map((d) => {
                const dow = dowOf(d);
                const isToday = d === today;
                const isSel = kind === "day" && d === day;
                const st = dayStats.map[d];
                const empty = st.count === 0;
                const dot = st.freeCount >= 30 ? "dark" : st.freeCount >= 10 ? "light" : "none";
                return (
                  <button key={d} ref={isToday ? todayRef : undefined} onClick={() => !empty && pickDay(d)} disabled={empty}
                    className={["flex min-w-[40px] shrink-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 transition", isSel ? "bg-free text-white" : empty ? "opacity-35" : "hover:bg-black/[0.04]"].join(" ")}>
                    <span className={["text-[10px] font-semibold", isSel ? "text-white/80" : dow === 0 ? "text-danger" : dow === 6 ? "text-brandblue" : "text-ink-faint"].join(" ")}>{WEEK[dow]}</span>
                    <span className={["flex h-6 w-6 items-center justify-center rounded-full text-[15px] font-bold tabular-nums", isSel ? "text-white" : isToday ? "bg-free text-white" : dow === 0 ? "text-danger" : dow === 6 ? "text-brandblue" : "text-ink"].join(" ")}>{Number(d.slice(6, 8))}</span>
                    <span className={["h-1.5 w-1.5 rounded-full", dot === "none" ? "bg-transparent" : isSel ? "bg-white" : dot === "dark" ? "bg-free" : "bg-[#A8E6C3]"].join(" ")} />
                  </button>
                );
              })}
            </div>
          </div>
        </Container>
      </div>

      {/* 필터 + 목록 띠 */}
      <div className="bg-panel">
        <Container className="pb-10 pt-3">
          {/* 빠른 필터 */}
          <div className="mb-3 flex gap-1.5 overflow-x-auto no-scrollbar">
            <QuickChip active={kind === "weekend"} onClick={toggleWeekend} label="🎏 이번 주말" />
            <QuickChip active={ending} onClick={toggleEnding} label="⏳ 곧 종료" />
            <QuickChip active={kids} onClick={toggleKids} label="👨‍👩‍👧 아이와 함께" />
          </div>

          {/* 지역 */}
          <FilterRow label="지역">
            <Chip active={!region} disabled={false} onClick={() => pickRegion("")} label="전국" count={regionCounts[""]} primary />
            {SIDO_LIST.map((s) => (
              <Chip key={s} active={region === s} disabled={regionCounts[s] === 0} onClick={() => pickRegion(s)} label={s} count={regionCounts[s]} primary />
            ))}
          </FilterRow>
          {/* 분야 */}
          <FilterRow label="분야">
            {GENRE_TABS.map((g) => (
              <Chip key={g.key || "all"} active={genre === g.key} disabled={g.key !== "" && genreCounts[g.key] === 0} onClick={() => pickGenre(g.key)} label={g.label} count={genreCounts[g.key]} />
            ))}
          </FilterRow>
          {/* 가격 */}
          <FilterRow label="가격">
            {PRICE_TABS.map((t) => {
              const active = price === t.key;
              const n = priceCounts[t.key];
              const disabled = t.key !== "all" && n === 0;
              const color = t.key === "free" ? "bg-free" : t.key === "partial" ? "bg-paid" : t.key === "cheap" ? "bg-brandblue" : "bg-ink";
              return (
                <button key={t.key} onClick={() => !disabled && pickPrice(t.key)} disabled={disabled}
                  className={["flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] font-bold transition", active ? `${color} text-white shadow-sm` : disabled ? "border border-line bg-white text-ink-dim/45" : "border border-line bg-white text-ink-soft hover:border-free/40 hover:text-free"].join(" ")}>
                  {t.label}<span className={["text-[11px] tabular-nums", active ? "text-white/80" : "text-ink-dim"].join(" ")}>{n}</span>
                </button>
              );
            })}
          </FilterRow>

          {/* 선택 요약 */}
          {chips.length > 0 && (
            <div className="mb-4 mt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-[12px] font-bold text-ink-faint">선택:</span>
              {chips.map((c, i) => (
                <button key={i} onClick={c.onRemove} className="inline-flex items-center gap-1 rounded-full bg-free/10 px-2.5 py-1 text-[12.5px] font-bold text-free transition hover:bg-free/20">
                  {c.label}<span aria-hidden className="text-free/70">✕</span>
                </button>
              ))}
              <button onClick={resetAll} className="ml-1 rounded-full px-2.5 py-1 text-[12.5px] font-bold text-ink-faint underline underline-offset-2 hover:text-ink">필터 초기화</button>
            </div>
          )}

          {/* 결과 헤더 */}
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 className="flex items-baseline gap-2">
              <span className="text-[22px] font-extrabold tracking-tight text-ink sm:text-[24px]">{headerLabel}</span>
              <span className="text-[15px] font-bold text-free">{filtered.length.toLocaleString()}건</span>
            </h2>
            <div className="flex items-center gap-1 text-[13px]">
              <ShareLinkButton label="이 목록 공유" />
              <span className="mx-1 h-3.5 w-px bg-line" />
              {SORTS.map((s) => (
                <button key={s.key} onClick={() => setSort(s.key)} className={["rounded-full px-3 py-1 font-semibold transition", sort === s.key ? "bg-white text-ink shadow-sm ring-1 ring-line" : "text-ink-faint hover:text-ink"].join(" ")}>{s.label}</button>
              ))}
            </div>
          </div>

          {hasEstimated && (
            <p className="mb-4 rounded-lg border-l-4 border-paid bg-[#FFF9E6] px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-soft">
              ※ <b className="text-ink">무료 추정</b>(점선 배지) 행사는 요금 정보가 없어 행사 유형으로 추정한 것입니다. 방문 전 공식 페이지에서 확인해주세요.
            </p>
          )}

          {shown.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white py-20 text-center">
              <div className="text-4xl">🔍</div>
              <p className="mt-3 font-semibold text-ink-soft">조건에 맞는 행사가 없어요</p>
              <button onClick={resetAll} className="mt-3 rounded-full bg-ink px-5 py-2 text-sm font-bold text-white transition hover:bg-black">필터 초기화</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-7">
              {shown.map((ev, i) => (
                <Fragment key={ev.id}>
                  <PosterCard ev={ev} priority={i < 12} />
                  {(i + 1) % 24 === 0 && <AdSlot label="인피드 광고" />}
                </Fragment>
              ))}
            </div>
          )}

          {visible < filtered.length && (
            <div className="mt-10 flex justify-center">
              <button onClick={() => setVisible((v) => v + PAGE)} className="rounded-full bg-ink px-7 py-3 text-sm font-bold text-white transition hover:bg-black">
                더 보기 ({(filtered.length - visible).toLocaleString()}개 남음)
              </button>
            </div>
          )}
        </Container>
      </div>
    </>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="w-7 shrink-0 text-[11px] font-bold text-ink-faint">{label}</span>
      <div className="flex flex-1 gap-1.5 overflow-x-auto no-scrollbar">{children}</div>
    </div>
  );
}

function QuickChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={["shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-bold transition", active ? "bg-ink text-white shadow-sm" : "border border-line bg-white text-ink-soft hover:border-ink/30 hover:text-ink"].join(" ")}>{label}</button>
  );
}

function Chip({ label, count, active, disabled, onClick, primary }: { label: string; count?: number; active: boolean; disabled: boolean; onClick: () => void; primary?: boolean }) {
  if (disabled) {
    return (
      <span className="flex shrink-0 cursor-default items-center gap-1 whitespace-nowrap rounded-full border border-line bg-white px-2.5 py-1 text-[12.5px] font-bold text-ink-dim/45">
        {label}{typeof count === "number" && <span className="text-[11px]">0</span>}
      </span>
    );
  }
  return (
    <button onClick={onClick} className={["flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[12.5px] font-bold transition", active ? "bg-free text-white shadow-sm" : primary ? "border border-line bg-white text-ink-soft hover:border-free/40 hover:text-free" : "text-ink-soft hover:bg-black/5 hover:text-ink"].join(" ")}>
      {label}{typeof count === "number" && <span className={["text-[11px] tabular-nums", active ? "text-white/80" : "text-ink-dim"].join(" ")}>{count}</span>}
    </button>
  );
}
