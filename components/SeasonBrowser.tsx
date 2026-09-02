"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/Band";
import { FilterRow } from "@/components/FilterChips";
import TourCard from "@/components/TourCard";
import type { TourSpot } from "@/lib/tour";

type SP = { area?: string; kw?: string };
const CAP = 120;

function qs(patch: SP, base: SP): string {
  const m: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...base, ...patch })) if (v) m[k] = v as string;
  const s = new URLSearchParams(m).toString();
  return s ? `/season?${s}` : "/season";
}

function filterSeasonPlaces(spots: TourSpot[], keywords: string[], { area, kw }: SP): TourSpot[] {
  const kws = kw ? [kw] : keywords;
  return spots.filter((p) => p.image && (!area || p.area === area) && kws.some((k) => `${p.title} ${p.addr}`.includes(k)));
}

export default function SeasonBrowser({
  spots,
  keywords,
  areas,
  seasonLabel,
}: {
  spots: TourSpot[];
  keywords: string[];
  areas: string[];
  seasonLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const sp: SP = {
    area: params.get("area") || undefined,
    kw: params.get("kw") || undefined,
  };
  const list = useMemo(() => filterSeasonPlaces(spots, keywords, sp), [spots, keywords, sp.area, sp.kw]);
  const shown = list.slice(0, CAP);
  const heading = [sp.area, sp.kw].filter(Boolean).join(" ") || `${seasonLabel} 나들이`;
  const seasonKwCount = (kw: string, area?: string) => filterSeasonPlaces(spots, keywords, { area, kw }).length;

  function go(href: string) {
    router.replace(href === "/season" ? pathname : href, { scroll: false });
  }

  return (
    <div className="bg-panel">
      <Container className="space-y-2.5 py-4">
        <FilterRow label="테마">
          <Chip onClick={() => go(qs({ kw: undefined }, sp))} active={!sp.kw} label="전체" count={filterSeasonPlaces(spots, keywords, { area: sp.area }).length} />
          {keywords.map((k) => (
            <Chip key={k} onClick={() => go(qs({ kw: sp.kw === k ? undefined : k }, sp))} active={sp.kw === k} label={k} count={seasonKwCount(k, sp.area)} />
          ))}
        </FilterRow>
        <FilterRow label="지역">
          <Chip onClick={() => go(qs({ area: undefined }, sp))} active={!sp.area} label="전국" count={filterSeasonPlaces(spots, keywords, { kw: sp.kw }).length} />
          {areas.map((a) => (
            <Chip key={a} onClick={() => go(qs({ area: sp.area === a ? undefined : a }, sp))} active={sp.area === a} label={a} count={seasonKwCount(sp.kw || "", a) || filterSeasonPlaces(spots, keywords, { area: a, kw: sp.kw }).length} />
          ))}
        </FilterRow>
        {(sp.area || sp.kw) && (
          <div className="flex items-center gap-2 pt-0.5 text-[12.5px]">
            <span className="font-bold text-ink-faint">선택:</span>
            <span className="font-semibold text-freedark">{heading}</span>
            <button onClick={() => go("/season")} className="ml-1 font-semibold text-ink-faint underline hover:text-ink">초기화</button>
          </div>
        )}
      </Container>

      <Container className="pb-12 pt-2">
        <div className="mb-4 flex items-baseline gap-2">
          <h2 className="text-[20px] font-extrabold tracking-tight text-ink sm:text-[22px]">{heading}</h2>
          <span className="text-[14px] font-bold text-free">{list.length.toLocaleString()}곳</span>
        </div>
        {shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center text-ink-soft">
            {sp.area ? `${sp.area}에는 아직 ${heading} 결과가 적어요.` : "결과가 없어요."}
            <div className="mt-2 flex justify-center gap-3">
              {sp.area && <button onClick={() => go(qs({ area: undefined }, sp))} className="font-bold text-free underline">전국으로 보기 →</button>}
              {sp.kw && <button onClick={() => go(qs({ kw: undefined }, sp))} className="font-bold text-free underline">테마 전체 →</button>}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {shown.map((p) => <TourCard key={p.id} spot={p} />)}
          </div>
        )}
        {list.length > CAP && <p className="mt-8 text-center text-[13px] text-ink-faint">상위 {CAP}곳 표시 · 지역·테마로 좁혀보세요</p>}
      </Container>
    </div>
  );
}

function Chip({ active, label, count, onClick }: { active: boolean; label: string; count?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex min-h-[36px] shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3.5 text-[13px] font-bold transition",
        active ? "bg-free text-white shadow-sm" : "border border-line bg-white text-ink-soft hover:border-free/40 hover:text-free",
      ].join(" ")}
    >
      {label}
      {typeof count === "number" && <span className={["text-[11px] tabular-nums", active ? "text-white/80" : "text-ink-dim"].join(" ")}>{count}</span>}
    </button>
  );
}
