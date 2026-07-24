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
import {
  todayYmd,
  ymdToDash,
  dashToYmd,
  formatKoreanDate,
  dowOf,
  monthDays,
  weekendRangeYmd,
  weekRangeYmd,
  monthRangeYmd,
} from "@/lib/dates";

type Kind = "day" | "weekend" | "week" | "month";
type Sort = "free" | "ending" | "name";

const PAGE = 42;
const PRICE_RANK: Record<string, number> = {
  free: 0,
  free_estimated: 1,
  partial_free: 2,
  cheap: 3,
  paid: 4,
  unknown: 5,
};
const isFreeLike = (t: string) =>
  t === "free" || t === "free_estimated" || t === "partial_free";

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

export default function DateBrowser({ events }: { events: CultureEvent[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = todayYmd();

  const initDate = searchParams.get("date");
  const initPeriod = searchParams.get("period") as Kind | null;
  const [kind, setKind] = useState<Kind>(
    initPeriod && ["weekend", "week", "month"].includes(initPeriod) ? initPeriod : "day"
  );
  const [day, setDay] = useState<string>(initDate ? dashToYmd(initDate) : today);
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

  const filtered = useMemo(() => {
    const { start, end } = range;
    const list = events.filter((e) => e.startDate <= end && e.endDate >= start);
    const cmp: Record<Sort, (a: CultureEvent, b: CultureEvent) => number> = {
      free: (a, b) =>
        (PRICE_RANK[a.priceType] ?? 9) - (PRICE_RANK[b.priceType] ?? 9) ||
        a.endDate.localeCompare(b.endDate),
      ending: (a, b) => a.endDate.localeCompare(b.endDate),
      name: (a, b) => a.title.localeCompare(b.title, "ko"),
    };
    return [...list].sort(cmp[sort]);
  }, [events, range, sort]);

  const hasEstimated = useMemo(
    () => filtered.some((e) => e.priceType === "free_estimated"),
    [filtered]
  );
  const shown = filtered.slice(0, visible);

  // 달력 날짜별 집계 (전체 수 + 무료계열 수)
  const dayStats = useMemo(() => {
    const days = monthDays(view.y, view.m);
    const map: Record<string, { count: number; freeCount: number }> = {};
    for (const d of days) map[d] = { count: 0, freeCount: 0 };
    for (const e of events) {
      for (const d of days) {
        if (e.startDate <= d && e.endDate >= d) {
          map[d].count++;
          if (isFreeLike(e.priceType)) map[d].freeCount++;
        }
      }
    }
    return { days, map };
  }, [events, view.y, view.m]);

  const syncUrl = useCallback(
    (nk: Kind, nd: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("date");
      params.delete("period");
      if (nk === "day") {
        if (nd !== today) params.set("date", ymdToDash(nd));
      } else params.set("period", nk);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, today]
  );

  function pickDay(d: string) {
    setKind("day");
    setDay(d);
    setVisible(PAGE);
    syncUrl("day", d);
  }
  function pickPeriod(k: Kind) {
    setKind(k);
    setVisible(PAGE);
    if (k === "day") setDay(today);
    syncUrl(k, today);
  }
  function shiftMonth(delta: number) {
    setView((v) => {
      const d = new Date(Date.UTC(v.y, v.m + delta, 1));
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
    });
  }

  const headerLabel =
    kind === "day"
      ? formatKoreanDate(day)
      : kind === "weekend"
      ? "이번 주말"
      : kind === "week"
      ? "이번 주"
      : "이번 달";

  return (
    <>
      {/* 달력 띠 (흰색) */}
      <div className="border-b border-line bg-white">
        <Container className="py-4">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => shiftMonth(-1)}
                aria-label="이전 달"
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-soft transition hover:bg-black/5"
              >
                ‹
              </button>
              <span className="min-w-[84px] text-center text-[14px] font-bold text-ink">
                {view.y}년 {view.m + 1}월
              </span>
              <button
                onClick={() => shiftMonth(1)}
                aria-label="다음 달"
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-soft transition hover:bg-black/5"
              >
                ›
              </button>
            </div>
            <div className="flex gap-1">
              {PERIODS.map((p) => {
                const active = kind === p.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => pickPeriod(p.key)}
                    className={[
                      "rounded-full px-3 py-1 text-[12.5px] font-bold transition",
                      active
                        ? "bg-free text-white"
                        : "border border-line bg-white text-ink-soft hover:border-free/40 hover:text-free",
                    ].join(" ")}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 가로 날짜 스트립 */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white to-transparent" />
            <div className="flex gap-0.5 overflow-x-auto no-scrollbar">
              {dayStats.days.map((d) => {
                const dow = dowOf(d);
                const isToday = d === today;
                const isSel = kind === "day" && d === day;
                const st = dayStats.map[d];
                const empty = st.count === 0;
                const dot =
                  st.freeCount >= 30 ? "dark" : st.freeCount >= 10 ? "light" : "none";
                return (
                  <button
                    key={d}
                    ref={isToday ? todayRef : undefined}
                    onClick={() => !empty && pickDay(d)}
                    disabled={empty}
                    className={[
                      "flex min-w-[40px] shrink-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 transition",
                      isSel
                        ? "bg-free text-white"
                        : empty
                        ? "opacity-35"
                        : "hover:bg-black/[0.04]",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "text-[10px] font-semibold",
                        isSel
                          ? "text-white/80"
                          : dow === 0
                          ? "text-danger"
                          : dow === 6
                          ? "text-brandblue"
                          : "text-ink-faint",
                      ].join(" ")}
                    >
                      {WEEK[dow]}
                    </span>
                    <span
                      className={[
                        "flex h-6 w-6 items-center justify-center rounded-full text-[15px] font-bold tabular-nums",
                        isSel
                          ? "text-white"
                          : isToday
                          ? "bg-free text-white"
                          : dow === 0
                          ? "text-danger"
                          : dow === 6
                          ? "text-brandblue"
                          : "text-ink",
                      ].join(" ")}
                    >
                      {Number(d.slice(6, 8))}
                    </span>
                    <span
                      className={[
                        "h-1.5 w-1.5 rounded-full",
                        dot === "none"
                          ? "bg-transparent"
                          : isSel
                          ? "bg-white"
                          : dot === "dark"
                          ? "bg-free"
                          : "bg-[#A8E6C3]",
                      ].join(" ")}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </Container>
      </div>

      {/* 목록 띠 (옅은 회색) */}
      <div className="bg-panel">
        <Container className="pb-10 pt-6">
          {/* 결과 헤더 */}
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <h2 className="flex items-baseline gap-2">
              <span className="text-[22px] font-extrabold tracking-tight text-ink sm:text-[24px]">
                {headerLabel}
              </span>
              <span className="text-[15px] font-bold text-free">
                {filtered.length.toLocaleString()}건
              </span>
            </h2>
            <div className="flex items-center gap-1 text-[13px]">
              <ShareLinkButton label="이 목록 공유" />
              <span className="mx-1 h-3.5 w-px bg-line" />
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSort(s.key)}
                  className={[
                    "rounded-full px-3 py-1 font-semibold transition",
                    sort === s.key
                      ? "bg-white text-ink shadow-sm ring-1 ring-line"
                      : "text-ink-faint hover:text-ink",
                  ].join(" ")}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {hasEstimated && (
            <p className="mb-4 rounded-lg border-l-4 border-paid bg-[#FFF9E6] px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-soft">
              ※ <b className="text-ink">무료 추정</b>(점선 배지) 행사는 요금 정보가 없어
              행사 유형으로 추정한 것입니다. 방문 전 공식 페이지에서 확인해주세요.
            </p>
          )}

          {shown.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white py-20 text-center">
              <div className="text-4xl">📅</div>
              <p className="mt-3 font-semibold text-ink-soft">
                선택하신 날짜에는 등록된 행사가 없습니다
              </p>
              <p className="mt-1 text-sm text-ink-faint">다른 날짜를 선택해보세요.</p>
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
              <button
                onClick={() => setVisible((v) => v + PAGE)}
                className="rounded-full bg-ink px-7 py-3 text-sm font-bold text-white transition hover:bg-black"
              >
                더 보기 ({(filtered.length - visible).toLocaleString()}개 남음)
              </button>
            </div>
          )}
        </Container>
      </div>
    </>
  );
}
