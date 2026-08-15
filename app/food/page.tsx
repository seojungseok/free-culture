import type { Metadata } from "next";
import Link from "next/link";
import { Band, Container } from "@/components/Band";
import AffiliateNotice from "@/components/AffiliateNotice";
import { FilterRow, Chip } from "@/components/FilterChips";
import FoodCard from "@/components/FoodCard";
import CoupangBanner from "@/components/CoupangBanner";
import { filterRestaurants, foodAreas, foodCatLabel, FOOD_CATS, getAllRestaurants } from "@/lib/food";
import { SIDO_SLUG } from "@/lib/classify";

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
        <AffiliateNotice className="mt-1.5" />
        <p className="mt-1 text-[14px] text-ink-soft">전국 음식점 {getAllRestaurants().length.toLocaleString()}곳 — 지역·업종으로 골라보세요 · 출처: 한국관광공사</p>
      </Band>

      <div className="bg-panel">
        <Container className="space-y-2.5 py-4">
          {/* 지역·업종 둘 다 살아있는 조합 필터 (클릭할수록 좁혀짐) */}
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

          {/* 쿠팡 제휴 배너 — 목록 끝, 광고와 간격 확보 */}
          <div className="mt-8">
            <CoupangBanner />
          </div>

          {/* 지역별 맛집 바로가기 — 정적 허브(/food/[area])로 내부링크(색인·크롤 유도) */}
          <section className="mt-12 border-t border-line pt-6">
            <h2 className="mb-3 text-[15px] font-extrabold text-ink">지역별 맛집</h2>
            <div className="flex flex-wrap gap-2">
              {foodAreas().map((a) => (
                <Link key={a} href={`/food/${(SIDO_SLUG as Record<string, string>)[a]}`}
                  className="rounded-full border border-line bg-white px-3 py-1 text-[13px] text-ink-soft hover:border-free hover:text-free">
                  {a} 맛집
                </Link>
              ))}
            </div>
          </section>
        </Container>
      </div>
    </>
  );
}
