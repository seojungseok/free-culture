"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Camp } from "@/lib/camping";
import CampCard from "@/components/CampCard";
import CoupangDeals from "@/components/CoupangDeals";
import { Container } from "@/components/Band";
import { FilterRow } from "@/components/FilterChips";

type SP = { area?: string; type?: string; facility?: string; pet?: string };
export type CampRow = [id: string, name: string, area: string, sigungu: string, image: string, typeBits: number, facilityBits: number, pet: 0 | 1];
const CAP = 120;
const CAMP_TYPES = ["일반야영장", "오토캠핑", "글램핑", "카라반"] as const;
const CAMP_FACILITIES = ["전기", "샤워실", "화장실", "와이파이", "온수", "마트"] as const;

function bitOf(values: readonly string[], selected: string[]): number {
  return selected.reduce((bits, value) => {
    const i = values.indexOf(value);
    return i >= 0 ? bits | (1 << i) : bits;
  }, 0);
}

function filterRows(rows: CampRow[], f: { area?: string; typeBits?: number; facilityBits?: number; pet?: boolean } = {}): CampRow[] {
  let list = rows;
  if (f.area) list = list.filter((c) => c[2] === f.area);
  if (f.typeBits) list = list.filter((c) => (c[5] & f.typeBits!) === f.typeBits);
  if (f.facilityBits) list = list.filter((c) => (c[6] & f.facilityBits!) === f.facilityBits);
  if (f.pet) list = list.filter((c) => c[7] === 1);
  return list;
}

function campFromRow(row: CampRow): Camp {
  const facilities: Record<string, boolean> = {};
  CAMP_FACILITIES.forEach((f, i) => { facilities[f] = Boolean(row[6] & (1 << i)); });
  return {
    id: row[0], name: row[1], area: row[2], sigungu: row[3], image: row[4],
    types: CAMP_TYPES.filter((_, i) => Boolean(row[5] & (1 << i))),
    facilities,
    pet: row[7] === 1,
    addr: "", mapx: "", mapy: "", petRaw: "", lctCl: "", resve: "", operPd: "", tel: "", homepage: "", intro: "",
  };
}

function qs(base: SP, patch: SP): string {
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...base, ...patch })) if (v) merged[k] = v as string;
  const s = new URLSearchParams(merged).toString();
  return s ? `/camping?${s}` : "/camping";
}

export default function CampingBrowser({
  camps,
  areas,
  total,
}: {
  camps: CampRow[];
  areas: { area: string; count: number }[];
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const sp: SP = {
    area: params.get("area") || undefined,
    type: params.get("type") || undefined,
    facility: params.get("facility") || undefined,
    pet: params.get("pet") || undefined,
  };
  const typeSel = (sp.type || "").split(",").map((x) => x.trim()).filter(Boolean);
  const facSel = (sp.facility || "").split(",").map((x) => x.trim()).filter(Boolean);
  const typeBits = bitOf(CAMP_TYPES, typeSel);
  const facilityBits = bitOf(CAMP_FACILITIES, facSel);
  const cur = { area: sp.area, typeBits, facilityBits, pet: sp.pet === "1" };

  const list = useMemo(
    () => [...filterRows(camps, cur)].sort((a, b) => (b[4] ? 1 : 0) - (a[4] ? 1 : 0)),
    [camps, cur.area, cur.pet, cur.facilityBits, cur.typeBits]
  );
  const shown = list.slice(0, CAP);

  const baseExcept = (dim: "area" | "types" | "facilities" | "pet") =>
    filterRows(camps, {
      ...cur,
      ...(dim === "pet" ? { pet: false } : {}),
      ...(dim === "area" ? { area: undefined } : {}),
      ...(dim === "types" ? { typeBits: 0 } : {}),
      ...(dim === "facilities" ? { facilityBits: 0 } : {}),
    });

  const areaC = useMemo(() => {
    const c: Record<string, number> = {};
    for (const camp of baseExcept("area")) c[camp[2]] = (c[camp[2]] || 0) + 1;
    return c;
  }, [camps, cur.area, cur.pet, cur.facilityBits, cur.typeBits]);

  const petC = filterRows(camps, { ...cur, pet: false }).filter((c) => c[7] === 1).length;
  const typeCount = (t: string) => filterRows(camps, { area: cur.area, facilityBits, pet: cur.pet, typeBits: bitOf(CAMP_TYPES, Array.from(new Set([...typeSel, t]))) }).length;
  const typeHref = (t: string) => qs(sp, { type: (typeSel.includes(t) ? typeSel.filter((x) => x !== t) : [...typeSel, t]).join(",") || undefined });
  const facCount = (f: string) => filterRows(camps, { area: cur.area, typeBits, pet: cur.pet, facilityBits: bitOf(CAMP_FACILITIES, Array.from(new Set([...facSel, f]))) }).length;
  const facHref = (f: string) => qs(sp, { facility: (facSel.includes(f) ? facSel.filter((x) => x !== f) : [...facSel, f]).join(",") || undefined });
  const heading = [sp.area, ...typeSel, sp.pet === "1" ? "반려동물" : "", ...facSel].filter(Boolean).join(" ") || "전국";

  function go(href: string) {
    router.replace(href === "/camping" ? pathname : href, { scroll: false });
  }

  return (
    <div className="bg-panel">
      <Container className="space-y-3 py-4">
        <FilterRow label="유형">
          <Chip onClick={() => go(qs(sp, { type: undefined }))} active={typeSel.length === 0} label="전체" count={baseExcept("types").length} />
          {CAMP_TYPES.map((t) => (
            <Chip key={t} onClick={() => go(typeHref(t))} active={typeSel.includes(t)} label={t} count={typeCount(t)} />
          ))}
        </FilterRow>
        <FilterRow label="시설">
          <Chip onClick={() => go(qs(sp, { pet: sp.pet === "1" ? undefined : "1" }))} active={sp.pet === "1"} label="반려동물" count={petC} />
          {CAMP_FACILITIES.map((f) => (
            <Chip key={f} onClick={() => go(facHref(f))} active={facSel.includes(f)} label={f} count={facCount(f)} />
          ))}
        </FilterRow>
        <FilterRow label="지역">
          <Chip onClick={() => go(qs(sp, { area: undefined }))} active={!sp.area} label="전국" count={total} />
          {areas.map((a) => (
            <Chip key={a.area} onClick={() => go(qs(sp, { area: sp.area === a.area ? undefined : a.area }))} active={sp.area === a.area} label={a.area} count={areaC[a.area] || 0} />
          ))}
        </FilterRow>
        {(sp.area || typeSel.length > 0 || sp.pet === "1" || facSel.length > 0) && (
          <div className="flex items-center gap-2 pt-0.5 text-[12.5px]">
            <span className="font-bold text-ink-faint">선택:</span>
            <span className="font-semibold text-freedark">{heading}</span>
            <button onClick={() => go("/camping")} className="ml-1 font-semibold text-ink-faint underline hover:text-ink">전체 초기화</button>
          </div>
        )}
      </Container>

      <Container className="pb-12 pt-2">
        <div className="mb-4 flex items-baseline gap-2">
          <h2 className="text-[20px] font-extrabold tracking-tight text-ink sm:text-[22px]">{heading} 캠핑장</h2>
          <span className="text-[14px] font-bold text-free">{list.length.toLocaleString()}곳</span>
        </div>
        {shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center text-ink-soft">조건에 맞는 캠핑장이 없어요. 필터를 바꿔보세요.</div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {shown.map((c) => <CampCard key={c[0]} camp={campFromRow(c)} />)}
          </div>
        )}
        {list.length > CAP && (
          <p className="mt-8 text-center text-[13px] text-ink-faint">상위 {CAP}곳 표시 · 유형·시설·지역 필터로 좁혀보세요</p>
        )}
        <div className="mt-8">
          <CoupangDeals />
        </div>
        <p className="mt-6 text-[12px] text-ink-faint">캠핑정보 제공: 한국관광공사 고캠핑</p>
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
      {typeof count === "number" && (
        <span className={["text-[11px] tabular-nums", active ? "text-white/80" : "text-ink-dim"].join(" ")}>{count}</span>
      )}
    </button>
  );
}
