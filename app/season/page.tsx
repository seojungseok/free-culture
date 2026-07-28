import type { Metadata } from "next";
import Link from "next/link";
import { Band, Container } from "@/components/Band";
import { FilterRow, Chip } from "@/components/FilterChips";
import TourCard from "@/components/TourCard";
import { season } from "@/lib/finder";
import { filterSeasonPlaces, seasonAreas, seasonKeywords, seasonKwCount } from "@/lib/season";

type SP = { area?: string; kw?: string };
const CAP = 120;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const s = season();
  const label = [sp.area, sp.kw].filter(Boolean).join(" ") || `${s.label} 나들이`;
  return {
    title: `${label} — ${s.label}에 가기 좋은 전국 나들이`,
    description: `${s.label}에 가기 좋은 계곡·해변·물놀이 등 전국 나들이 장소를 지역·테마로 골라보세요.`,
    keywords: [`${sp.area || ""} ${s.label} 나들이`, `${sp.area || ""} 계곡`, `${sp.area || ""} 해변`, `${s.label} 가볼만한 곳`].filter((k) => k.trim()),
    alternates: { canonical: "/season" },
  };
}

function qs(patch: SP, base: SP): string {
  const m: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...base, ...patch })) if (v) m[k] = v as string;
  const s = new URLSearchParams(m).toString();
  return s ? `/season?${s}` : "/season";
}

export default async function SeasonPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const s = season();
  const kws = seasonKeywords();
  const list = filterSeasonPlaces({ area: sp.area, kw: sp.kw });
  const shown = list.slice(0, CAP);
  const heading = [sp.area, sp.kw].filter(Boolean).join(" ") || `${s.label} 나들이`;
  const areas = seasonAreas();

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">{s.emoji} <span className="text-free">{s.label} 나들이</span></h1>
        <p className="mt-1 text-[14px] text-ink-soft">{s.label}에 가기 좋은 전국 나들이 — 지역·테마로 골라보세요 · 계절은 자동으로 바뀌어요</p>
      </Band>

      <div className="bg-panel">
        <Container className="space-y-2.5 py-4">
          <FilterRow label="테마">
            <Chip href={qs({ kw: undefined }, sp)} active={!sp.kw} label="전체" count={filterSeasonPlaces({ area: sp.area }).length} />
            {kws.map((k) => (
              <Chip key={k} href={qs({ kw: sp.kw === k ? undefined : k }, sp)} active={sp.kw === k} label={k} count={seasonKwCount(k, sp.area)} />
            ))}
          </FilterRow>
          <FilterRow label="지역">
            <Chip href={qs({ area: undefined }, sp)} active={!sp.area} label="전국" count={filterSeasonPlaces({ kw: sp.kw }).length} />
            {areas.map((a) => (
              <Chip key={a} href={qs({ area: sp.area === a ? undefined : a }, sp)} active={sp.area === a} label={a} count={seasonKwCount(sp.kw || "", a) || filterSeasonPlaces({ area: a, kw: sp.kw }).length} />
            ))}
          </FilterRow>
          {(sp.area || sp.kw) && (
            <div className="flex items-center gap-2 pt-0.5 text-[12.5px]">
              <span className="font-bold text-ink-faint">선택:</span>
              <span className="font-semibold text-freedark">{heading}</span>
              <Link href="/season" className="ml-1 font-semibold text-ink-faint underline hover:text-ink">초기화</Link>
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
                {sp.area && <Link href={qs({ area: undefined }, sp)} className="font-bold text-free underline">전국으로 보기 →</Link>}
                {sp.kw && <Link href={qs({ kw: undefined }, sp)} className="font-bold text-free underline">테마 전체 →</Link>}
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
    </>
  );
}
