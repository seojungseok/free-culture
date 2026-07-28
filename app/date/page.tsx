import type { Metadata } from "next";
import Link from "next/link";
import { Band, Container } from "@/components/Band";
import { FilterRow, Chip } from "@/components/FilterChips";
import SearchCard from "@/components/SearchCard";
import { search } from "@/lib/search";
import { SIDO_LIST } from "@/lib/classify";

type SP = { area?: string; theme?: string };
const CAP = 60;

// 데이트 테마 → 검색어
const DATE_THEMES: { key: string; term: string; label: string }[] = [
  { key: "park", term: "공원", label: "공원" },
  { key: "cafe", term: "카페", label: "카페" },
  { key: "food", term: "맛집", label: "맛집" },
  { key: "art", term: "미술관", label: "미술관·전시" },
  { key: "garden", term: "수목원", label: "수목원" },
  { key: "water", term: "호수", label: "강변·호수" },
];
const themeByKey = (k?: string) => DATE_THEMES.find((t) => t.key === k) || DATE_THEMES[0];

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const th = themeByKey(sp.theme);
  const label = [sp.area, th.label].filter(Boolean).join(" ");
  return {
    title: `${label} 데이트 코스 — 지역·테마별 데이트 장소`,
    description: `${label} 데이트하기 좋은 공원·카페·미술관·수목원·강변을 지역과 테마로 골라보세요.`,
    keywords: [`${sp.area || ""} 데이트`, `${sp.area || ""} ${th.label}`, "데이트 코스"].filter((k) => k.trim()),
    alternates: { canonical: "/date" },
  };
}

function qs(patch: SP, base: SP): string {
  const m: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...base, ...patch })) if (v) m[k] = v as string;
  const s = new URLSearchParams(m).toString();
  return s ? `/date?${s}` : "/date";
}

export default async function DatePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const th = themeByKey(sp.theme);
  const q = [sp.area, th.term].filter(Boolean).join(" ");
  const res = search(q);
  const items = res.groups.flatMap((g) => g.items).slice(0, CAP);
  const heading = [sp.area, th.label].filter(Boolean).join(" ") || `${th.label} 데이트`;

  // 지역 칩: 선택 테마에서 결과 있는 시도만
  const regionCount = (a: string) => search(`${a} ${th.term}`).total;
  const areas = SIDO_LIST.map((a) => ({ a, n: regionCount(a) })).filter((x) => x.n > 0);

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">💑 <span className="text-free">데이트 코스</span></h1>
        <p className="mt-1 text-[14px] text-ink-soft">데이트하기 좋은 곳을 지역·테마로 골라보세요 · 상세에서 &lsquo;근처 추천&rsquo;도 확인하세요</p>
      </Band>

      <div className="bg-panel">
        <Container className="space-y-2.5 py-4">
          <FilterRow label="테마">
            {DATE_THEMES.map((t) => (
              <Chip key={t.key} href={qs({ theme: t.key }, sp)} active={th.key === t.key} label={t.label} count={search([sp.area, t.term].filter(Boolean).join(" ")).total} />
            ))}
          </FilterRow>
          <FilterRow label="지역">
            <Chip href={qs({ area: undefined }, sp)} active={!sp.area} label="전국" count={search(th.term).total} />
            {areas.map(({ a, n }) => (
              <Chip key={a} href={qs({ area: sp.area === a ? undefined : a }, sp)} active={sp.area === a} label={a} count={n} />
            ))}
          </FilterRow>
          {(sp.area || sp.theme) && (
            <div className="flex items-center gap-2 pt-0.5 text-[12.5px]">
              <span className="font-bold text-ink-faint">선택:</span>
              <span className="font-semibold text-freedark">{heading}</span>
              <Link href="/date" className="ml-1 font-semibold text-ink-faint underline hover:text-ink">초기화</Link>
            </div>
          )}
        </Container>

        <Container className="pb-12 pt-2">
          <div className="mb-4 flex items-baseline gap-2">
            <h2 className="text-[20px] font-extrabold tracking-tight text-ink sm:text-[22px]">{heading}</h2>
            <span className="text-[14px] font-bold text-free">{res.total.toLocaleString()}곳</span>
          </div>
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center text-ink-soft">
              {sp.area ? `${sp.area}에는 아직 ${th.label} 결과가 적어요.` : "결과가 없어요."}
              {sp.area && <div className="mt-2"><Link href={qs({ area: undefined }, sp)} className="font-bold text-free underline">전국으로 보기 →</Link></div>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {items.map((doc) => <SearchCard key={`${doc.kind}-${doc.id}`} doc={doc} />)}
            </div>
          )}
          <p className="mt-6 text-[12.5px] text-ink-faint">각 장소 상세에서 &lsquo;주변 나들이 장소&rsquo;·&lsquo;주변에서 식사하기&rsquo;로 근처 코스를 이어보세요.</p>
        </Container>
      </div>
    </>
  );
}
