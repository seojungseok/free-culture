import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Band, Container } from "@/components/Band";
import { FilterRow, Chip } from "@/components/FilterChips";
import { filterRestaurants, foodAreas, foodCatLabel, FOOD_CATS, getAllRestaurants, type Restaurant } from "@/lib/food";

type SP = { area?: string; cat?: string };
const CAP = 120;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const label = [sp.area, sp.cat ? foodCatLabel(sp.cat) : ""].filter(Boolean).join(" ") || "전국";
  return {
    title: `${label} 맛집 — 지역·업종별 맛집 탐방`,
    description: `${label} 맛집을 지역과 업종(한식·중식·일식·카페 등)으로 골라보세요. 위치·연락처·영업정보 제공.`,
    keywords: [`${sp.area || ""} 맛집`, `${sp.area || ""} ${sp.cat ? foodCatLabel(sp.cat) : "맛집"}`, "맛집 탐방"].filter((k) => k.trim()),
    alternates: { canonical: "/food" },
  };
}

function qs(patch: SP, base: SP): string {
  const m: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...base, ...patch })) if (v) m[k] = v as string;
  const s = new URLSearchParams(m).toString();
  return s ? `/food?${s}` : "/food";
}

export default async function FoodPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const list = filterRestaurants({ area: sp.area, cat3: sp.cat });
  const heading = [sp.area, sp.cat ? foodCatLabel(sp.cat) : ""].filter(Boolean).join(" ") || "전국";
  const shown = list.slice(0, CAP);

  const areas = foodAreas();
  const areaCount = (a: string) => filterRestaurants({ area: a, cat3: sp.cat }).length;
  const catCount = (c: string) => filterRestaurants({ area: sp.area, cat3: c }).length;

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">🍽️ <span className="text-free">맛집 탐방</span></h1>
        <p className="mt-1 text-[14px] text-ink-soft">전국 음식점 {getAllRestaurants().length.toLocaleString()}곳 — 지역·업종으로 골라보세요 · 출처: 한국관광공사</p>
      </Band>

      <div className="bg-panel">
        <Container className="space-y-2.5 py-4">
          <FilterRow label="지역">
            <Chip href={qs({ area: undefined }, sp)} active={!sp.area} label="전국" count={filterRestaurants({ cat3: sp.cat }).length} />
            {areas.map((a) => (
              <Chip key={a} href={qs({ area: sp.area === a ? undefined : a }, sp)} active={sp.area === a} label={a} count={areaCount(a)} />
            ))}
          </FilterRow>
          <FilterRow label="업종">
            <Chip href={qs({ cat: undefined }, sp)} active={!sp.cat} label="전체" count={filterRestaurants({ area: sp.area }).length} />
            {FOOD_CATS.map((c) => (
              <Chip key={c.code} href={qs({ cat: sp.cat === c.code ? undefined : c.code }, sp)} active={sp.cat === c.code} label={c.label} count={catCount(c.code)} />
            ))}
          </FilterRow>
          {(sp.area || sp.cat) && (
            <div className="flex items-center gap-2 pt-0.5 text-[12.5px]">
              <span className="font-bold text-ink-faint">선택:</span>
              <span className="font-semibold text-freedark">{heading}</span>
              <Link href="/food" className="ml-1 font-semibold text-ink-faint underline hover:text-ink">초기화</Link>
            </div>
          )}
        </Container>

        <Container className="pb-12 pt-2">
          <div className="mb-4 flex items-baseline gap-2">
            <h2 className="text-[20px] font-extrabold tracking-tight text-ink sm:text-[22px]">{heading} 맛집</h2>
            <span className="text-[14px] font-bold text-free">{list.length.toLocaleString()}곳</span>
          </div>
          {shown.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center text-ink-soft">
              조건에 맞는 맛집이 없어요. 지역·업종을 바꿔보세요.
              {sp.area && <div className="mt-2"><Link href={qs({ area: undefined }, sp)} className="font-bold text-free underline">전국으로 보기 →</Link></div>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {shown.map((r) => <FoodCard key={r.id} r={r} />)}
            </div>
          )}
          {list.length > CAP && <p className="mt-8 text-center text-[13px] text-ink-faint">상위 {CAP}곳 표시 · 지역·업종 필터로 좁혀보세요</p>}
        </Container>
      </div>
    </>
  );
}

function FoodCard({ r }: { r: Restaurant }) {
  const gu = (r.addr.match(/[가-힣]{2,}(?:구|군|시)/) || [])[0] || "";
  return (
    <Link href={`/places/spot/${r.id}`} className="group block" aria-label={`${r.title} 상세 보기`}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/[0.04] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-cardhover">
        {r.image ? (
          <Image src={r.image} alt={r.title} fill sizes="(max-width:640px) 50vw, 220px" className="object-cover transition group-hover:scale-105" loading="lazy" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl text-ink-faint">🍽️</div>
        )}
        <div className="absolute left-1.5 top-1.5">
          <span className="rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">{foodCatLabel(r.cat3)}</span>
        </div>
      </div>
      <div className="px-0.5 pb-1 pt-2">
        <h3 className="line-clamp-1 text-[14px] font-bold text-ink group-hover:text-free">{r.title}</h3>
        <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-faint">{[r.area, gu].filter(Boolean).join(" · ")}</p>
        {r.phone && (
          <p className="mt-0.5 line-clamp-1 text-[11.5px] font-semibold text-ink-soft">☎ {r.phone}</p>
        )}
      </div>
    </Link>
  );
}
