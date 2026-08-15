import type { Metadata } from "next";
import Link from "next/link";
import { filterCamps, campAreaCounts, petCount, getCampCount, CAMP_TYPES, CAMP_FACILITIES, type CampFilter } from "@/lib/camping";
import CampCard from "@/components/CampCard";
import CoupangBanner from "@/components/CoupangBanner";
import { Band, Container } from "@/components/Band";
import AffiliateNotice from "@/components/AffiliateNotice";
import { FilterRow, Chip } from "@/components/FilterChips";

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
  const typeSel = (sp.type || "").split(",").map((x) => x.trim()).filter(Boolean);   // 다중 유형
  const facSel = (sp.facility || "").split(",").map((x) => x.trim()).filter(Boolean); // 다중 시설
  const cur: CampFilter = { area: sp.area, types: typeSel, facilities: facSel, pet: sp.pet === "1" };
  // 사진 있는 캠핑장을 앞으로 → 초기화면·상단이 실제 사진으로 채워짐("사진 준비중" 뒤로).
  // filterCamps는 무필터 시 원본 배열을 반환하므로 복사본([...])에 정렬(공유 데이터 변형 방지).
  const list = [...filterCamps(cur)].sort((a, b) => (b.image ? 1 : 0) - (a.image ? 1 : 0));

  // 패싯 카운트 — 해당 차원을 뺀 나머지 필터 기준
  const baseExcept = (dim: "area" | "types" | "facilities" | "pet") =>
    filterCamps({ ...cur, [dim]: dim === "pet" ? false : dim === "area" ? undefined : [] });
  const areaC: Record<string, number> = {};
  for (const c of baseExcept("area")) areaC[c.area] = (areaC[c.area] || 0) + 1;
  const petC = petCount(baseExcept("pet"));
  // 유형/시설 개별 카운트: 다른 조건 + 이미 선택된 것 + 이 항목 (AND) → 토글 URL (다중 선택)
  const typeCount = (t: string) => filterCamps({ area: cur.area, facilities: facSel, pet: cur.pet, types: Array.from(new Set([...typeSel, t])) }).length;
  const typeHref = (t: string) => qs(sp, { type: (typeSel.includes(t) ? typeSel.filter((x) => x !== t) : [...typeSel, t]).join(",") || undefined });
  const facCount = (f: string) => filterCamps({ area: cur.area, types: typeSel, pet: cur.pet, facilities: Array.from(new Set([...facSel, f])) }).length;
  const facHref = (f: string) => qs(sp, { facility: (facSel.includes(f) ? facSel.filter((x) => x !== f) : [...facSel, f]).join(",") || undefined });

  const areas = campAreaCounts();
  const shown = list.slice(0, CAP);
  const heading = [sp.area, ...typeSel, sp.pet === "1" ? "반려동물" : "", ...facSel].filter(Boolean).join(" ") || "전국";

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          <span className="text-free">⛺ 캠핑</span>
        </h1>
        <AffiliateNotice className="mt-1.5" />
        <p className="mt-1 text-[14px] text-ink-soft">
          전국 캠핑장 <span className="whitespace-nowrap">{getCampCount().toLocaleString()}곳</span> — 유형·시설·지역으로 골라보세요 · 출처: 한국관광공사 고캠핑
        </p>
      </Band>

      <div className="bg-panel">
        <Container className="space-y-3 py-4">
          {/* 유형 (다중 선택 가능) */}
          <FilterRow label="유형">
            <Chip href={qs(sp, { type: undefined })} active={typeSel.length === 0} label="전체" count={baseExcept("types").length} />
            {CAMP_TYPES.map((t) => (
              <Chip key={t} href={typeHref(t)} active={typeSel.includes(t)} label={t} count={typeCount(t)} />
            ))}
          </FilterRow>
          {/* 시설 + 반려동물 (다중 선택 가능) */}
          <FilterRow label="시설">
            <Chip href={qs(sp, { pet: sp.pet === "1" ? undefined : "1" })} active={sp.pet === "1"} label="🐾 반려동물" count={petC} />
            {CAMP_FACILITIES.map((f) => (
              <Chip key={f} href={facHref(f)} active={facSel.includes(f)} label={f} count={facCount(f)} />
            ))}
          </FilterRow>
          {/* 지역 */}
          <FilterRow label="지역">
            <Chip href={qs(sp, { area: undefined })} active={!sp.area} label="전국" count={getCampCount()} />
            {areas.map((a) => (
              <Chip key={a.area} href={qs(sp, { area: sp.area === a.area ? undefined : a.area })} active={sp.area === a.area} label={a.area} count={areaC[a.area] || 0} />
            ))}
          </FilterRow>
          {(sp.area || typeSel.length > 0 || sp.pet === "1" || facSel.length > 0) && (
            <div className="flex items-center gap-2 pt-0.5 text-[12.5px]">
              <span className="font-bold text-ink-faint">선택:</span>
              <span className="font-semibold text-freedark">{heading}</span>
              <Link href="/camping" className="ml-1 font-semibold text-ink-faint underline hover:text-ink">전체 초기화</Link>
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
              {shown.map((c) => <CampCard key={c.id} camp={c} />)}
            </div>
          )}
          {list.length > CAP && (
            <p className="mt-8 text-center text-[13px] text-ink-faint">상위 {CAP}곳 표시 · 유형·시설·지역 필터로 좁혀보세요</p>
          )}

          {/* 캠핑용품 제휴 배너 (쿠팡 파트너스) — 목록 끝, 광고와 간격 확보 */}
          <div className="mt-8">
            <CoupangBanner />
          </div>

          <p className="mt-6 text-[12px] text-ink-faint">캠핑정보 제공: 한국관광공사 고캠핑</p>
        </Container>
      </div>
    </>
  );
}
