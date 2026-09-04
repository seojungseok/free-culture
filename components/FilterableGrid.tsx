"use client";

import { useMemo, useState, useCallback, useEffect, Fragment } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CultureEvent, PriceType } from "@/lib/types";
import PosterCard from "./PosterCard";
import AdSlot from "./AdSlot";

type PriceFilter = "all" | "free" | "partial" | "cheap" | "paid";

const PAGE = 40;

const FILTERS: PriceFilter[] = ["all", "free", "partial", "cheap", "paid"];

const TABS: { key: PriceFilter; label: string; match?: PriceType }[] = [
  { key: "all", label: "전체" },
  { key: "free", label: "무료", match: "free" },
  { key: "partial", label: "조건부 무료", match: "partial_free" },
  { key: "cheap", label: "1만원↓", match: "cheap" },
  { key: "paid", label: "유료", match: "paid" },
];

export default function FilterableGrid({
  events,
  showControls = true,
  hidePriceFilter = false,
}: {
  events: CultureEvent[];
  showControls?: boolean;
  hidePriceFilter?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlPrice = (searchParams.get("price") as PriceFilter) || "all";
  const [price, setPrice] = useState<PriceFilter>(
    FILTERS.includes(urlPrice) ? urlPrice : "all"
  );
  const [visible, setVisible] = useState(PAGE);
  const [region, setRegion] = useState(searchParams.get("region") || "all");
  const regions = useMemo(() => ["all", ...Array.from(new Set(events.map((e) => e.area).filter(Boolean))).sort()], [events]);

  // URL(뒤로가기 등)과 동기화
  useEffect(() => {
    const p = (searchParams.get("price") as PriceFilter) || "all";
    if (FILTERS.includes(p)) setPrice(p);
  }, [searchParams]);

  const counts = useMemo(() => {
    const c: Record<PriceFilter, number> = {
      all: events.length,
      free: 0,
      partial: 0,
      cheap: 0,
      paid: 0,
    };
    for (const e of events) {
      // "무료" 탭 = 확정무료 + 무료추정
      if (e.priceType === "free" || e.priceType === "free_estimated") c.free++;
      else if (e.priceType === "partial_free") c.partial++;
      else if (e.priceType === "cheap") c.cheap++;
      else if (e.priceType === "paid") c.paid++;
    }
    return c;
  }, [events]);

  const filtered = useMemo(() => {
    const base = region === "all" ? events : events.filter((e) => e.area === region);
    if (price === "all") return base;
    if (price === "free") {
      // 확정무료 먼저, 무료추정 뒤
      const rank = (t: string) => (t === "free" ? 0 : 1);
      return base
        .filter((e) => e.priceType === "free" || e.priceType === "free_estimated")
        .sort((a, b) => rank(a.priceType) - rank(b.priceType));
    }
    const tab = TABS.find((t) => t.key === price);
    if (!tab || !tab.match) return events;
    return base.filter((e) => e.priceType === tab.match);
  }, [events, price, region]);


  const shown = filtered.slice(0, visible);

  const changePrice = useCallback(
    (next: PriceFilter) => {
      setPrice(next);
      setVisible(PAGE);
      const params = new URLSearchParams(searchParams.toString());
      if (next === "all") params.delete("price");
      else params.set("price", next);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return (
    <section>
      {showControls && (
        <div className="sticky top-[132px] z-30 -mx-4 mb-5 border-b border-black/5 bg-[var(--bg)]/90 px-4 py-3 backdrop-blur md:top-[92px]">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {!hidePriceFilter && <div className="inline-flex rounded-full bg-black/[0.05] p-1">
              {TABS.map((t) => {
                const active = price === t.key;
                const n = counts[t.key];
                const activeColor =
                  t.key === "free"
                    ? "bg-free text-white shadow"
                    : t.key === "partial"
                    ? "bg-paid text-white shadow"
                    : t.key === "cheap"
                    ? "bg-blue-600 text-white shadow"
                    : t.key === "paid"
                    ? "bg-ink text-white shadow"
                    : "bg-white text-ink shadow";
                return (
                  <button
                    key={t.key}
                    onClick={() => changePrice(t.key)}
                    className={[
                      "relative whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-bold transition",
                      active ? activeColor : "text-ink-soft hover:text-ink",
                    ].join(" ")}
                  >
                    {t.label}
                    <span
                      className={[
                        "ml-1.5 text-[11px] font-semibold tabular-nums",
                        active ? "opacity-90" : "text-ink-faint",
                      ].join(" ")}
                    >
                      {n.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>}
            <div className="flex items-center gap-1 overflow-x-auto">
              {regions.map((r) => <button key={r} onClick={() => { setRegion(r); setVisible(PAGE); const p = new URLSearchParams(searchParams.toString()); r === "all" ? p.delete("region") : p.set("region", r); router.replace(`${pathname}${p.toString() ? `?${p}` : ""}`, { scroll: false }); }} className={["whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-bold", region === r ? "bg-ink text-white" : "text-ink-soft hover:text-ink"].join(" ")}>{r === "all" ? "전국" : r}</button>)}
            </div>
          </div>
        </div>
      )}

      {shown.length === 0 ? (
        <EmptyState price={price} />
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-7">
          {shown.map((ev, i) => (
            <Fragment key={ev.id}>
              <PosterCard ev={ev} priority={i < 5} />
              {(i + 1) % 20 === 0 && <AdSlot label="인피드 광고" />}
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
    </section>
  );
}

function EmptyState({ price }: { price: PriceFilter }) {
  const word =
    TABS.find((t) => t.key === price && t.key !== "all")?.label ?? "";
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 py-24 text-center">
      <div className="text-4xl">🗓️</div>
      <p className="mt-3 text-base font-semibold text-ink-soft">
        지금은 표시할 {word} 행사가 없어요
      </p>
      <p className="mt-1 text-sm text-ink-faint">
        곧 새로운 행사가 업데이트됩니다.
      </p>
    </div>
  );
}
