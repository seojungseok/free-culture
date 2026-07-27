import type { Metadata } from "next";
import Link from "next/link";
import { filterCamps, campAreaCounts, campTypeCounts, campFacilityCounts, petCount, getCampCount, CAMP_TYPES, CAMP_FACILITIES, type CampFilter } from "@/lib/camping";
import CampCard from "@/components/CampCard";
import { Band, Container } from "@/components/Band";

type SP = { area?: string; type?: string; facility?: string; pet?: string };
const CAP = 120;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const parts = [sp.area, sp.type, sp.pet === "1" ? "반려동물" : "", sp.facility].filter(Boolean);
  const label = parts.length ? parts.join(" ") : "전국";
  const title = `${label} 캠핑장 — 글램핑·오토캠핑·카라반 · 주말에뭐하지`;
  return {
    title,
    description: `${label} 캠핑장을 유형(글램핑·오토캠핑·카라반)·편의시설(전기·샤워·온수)·반려동물 동반으로 골라보세요. 요금·예약·지도 정보 제공.`,
    keywords: [`${sp.area || ""} 캠핑장`, `${sp.area || ""} 글램핑`, `${sp.area || ""} 오토캠핑`, `${sp.area || ""} 반려동물 캠핑장`, "전국 캠핑장"].filter((k) => k.trim()),
    alternates: { canonical: "/camping" },
  };
}

function qs(base: SP, patch: SP): string {
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...base, ...patch })) if (v) merged[k] = v as string;
  const s = new URLSearchParams(merged).toString();
  return s ? `/camping?${s}` : "/camping";
}

export default async function CampingPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const cur: CampFilter = { area: sp.area, type: sp.type, facility: sp.facility, pet: sp.pet === "1" };
  const list = filterCamps(cur);

  // 패싯 카운트 — 해당 차원을 뺀 나머지 필터 기준
  const baseExcept = (dim: keyof CampFilter) =>
    filterCamps({ ...cur, [dim]: dim === "pet" ? false : undefined });
  const areaC: Record<string, number> = {};
  for (const c of baseExcept("area")) areaC[c.area] = (areaC[c.area] || 0) + 1;
  const typeC = campTypeCounts(baseExcept("type"));
  const facC = campFacilityCounts(baseExcept("facility"));
  const petC = petCount(baseExcept("pet"));

  const areas = campAreaCounts();
  const shown = list.slice(0, CAP);
  const heading = [sp.area, sp.type, sp.pet === "1" ? "반려동물" : "", sp.facility].filter(Boolean).join(" ") || "전국";

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          <span className="text-free">⛺ 캠핑</span>
        </h1>
        <p className="mt-1 text-[14px] text-ink-soft">
          전국 캠핑장 {getCampCount().toLocaleString()}곳 — 유형·시설·지역으로 골라보세요 · 출처: 한국관광공사 고캠핑
        </p>
      </Band>

      <div className="bg-panel">
        <Container className="space-y-3 py-4">
          {/* 유형 */}
          <FilterRow label="유형">
            <Chip href={qs(sp, { type: undefined })} active={!sp.type} label="전체" count={baseExcept("type").length} />
            {CAMP_TYPES.map((t) => (
              <Chip key={t} href={qs(sp, { type: sp.type === t ? undefined : t })} active={sp.type === t} label={t} count={typeC[t] || 0} />
            ))}
          </FilterRow>
          {/* 시설 + 반려동물 */}
          <FilterRow label="시설">
            <Chip href={qs(sp, { pet: sp.pet === "1" ? undefined : "1" })} active={sp.pet === "1"} label="🐾 반려동물" count={petC} />
            {CAMP_FACILITIES.map((f) => (
              <Chip key={f} href={qs(sp, { facility: sp.facility === f ? undefined : f })} active={sp.facility === f} label={f} count={facC[f] || 0} />
            ))}
          </FilterRow>
          {/* 지역 */}
          <FilterRow label="지역">
            <Chip href={qs(sp, { area: undefined })} active={!sp.area} label="전국" count={getCampCount()} />
            {areas.map((a) => (
              <Chip key={a.area} href={qs(sp, { area: sp.area === a.area ? undefined : a.area })} active={sp.area === a.area} label={a.area} count={areaC[a.area] || 0} />
            ))}
          </FilterRow>
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
              {shown.map((c) => <CampCard key={c.id} camp={c} />)}
            </div>
          )}
          {list.length > CAP && (
            <p className="mt-8 text-center text-[13px] text-ink-faint">상위 {CAP}곳 표시 · 유형·시설·지역 필터로 좁혀보세요</p>
          )}
          <p className="mt-6 text-[12px] text-ink-faint">캠핑정보 제공: 한국관광공사 고캠핑</p>
        </Container>
      </div>
    </>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1.5 w-8 shrink-0 text-[12px] font-bold text-ink-faint">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
function Chip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number | boolean }) {
  return (
    <Link href={href} className={["flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-bold transition", active ? "bg-free text-white shadow-sm" : "border border-line bg-white text-ink-soft hover:border-free/40 hover:text-free"].join(" ")}>
      {label}
      {typeof count === "number" && <span className={["text-[11px] tabular-nums", active ? "text-white/80" : "text-ink-dim"].join(" ")}>{count}</span>}
    </Link>
  );
}
