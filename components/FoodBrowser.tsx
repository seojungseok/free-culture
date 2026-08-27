"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/Band";
import { FilterRow } from "@/components/FilterChips";
import FoodCard from "@/components/FoodCard";
import CoupangBanner from "@/components/CoupangBanner";
import type { Restaurant } from "@/lib/food";
import { SIDO_SLUG } from "@/lib/classify";

type SP = { area?: string; cat?: string };
export type RestaurantRow = [id: string, title: string, addr: string, area: string, image: string, cat3: string, phone: string];
const CAP = 120;
const FOOD_CATS: { code: string; label: string; slug: string }[] = [
  { code: "A05020100", label: "한식", slug: "korean" },
  { code: "A05020200", label: "서양식", slug: "western" },
  { code: "A05020300", label: "일식", slug: "japanese" },
  { code: "A05020400", label: "중식", slug: "chinese" },
  { code: "A05020900", label: "카페·찻집", slug: "cafe" },
  { code: "A05020700", label: "이색", slug: "unique" },
];
function foodCatLabel(cat3?: string): string {
  return FOOD_CATS.find((c) => c.code === cat3)?.label || "음식점";
}

function qs(patch: SP, base: SP): string {
  const m: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...base, ...patch })) if (v) m[k] = v as string;
  const s = new URLSearchParams(m).toString();
  return s ? `/food?${s}` : "/food";
}

function filterRestaurants(restaurants: RestaurantRow[], { area, cat }: SP): RestaurantRow[] {
  return restaurants.filter((r) => (!area || r[3] === area) && (!cat || r[5] === cat));
}

function restaurantFromRow(row: RestaurantRow): Restaurant {
  return {
    id: row[0],
    title: row[1],
    addr: row[2],
    area: row[3],
    image: row[4],
    cat3: row[5],
    phone: row[6] || undefined,
    mapx: "",
    mapy: "",
    tel: "",
  };
}

export default function FoodBrowser({
  restaurants,
  areas,
}: {
  restaurants: RestaurantRow[];
  areas: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const sp: SP = {
    area: params.get("area") || undefined,
    cat: params.get("cat") || undefined,
  };
  const list = useMemo(() => filterRestaurants(restaurants, sp), [restaurants, sp.area, sp.cat]);
  const heading = [sp.area, sp.cat ? foodCatLabel(sp.cat) : ""].filter(Boolean).join(" ") || "전국";
  const shown = list.slice(0, CAP);
  const areaCount = (a: string) => filterRestaurants(restaurants, { area: a, cat: sp.cat }).length;
  const catCount = (c: string) => filterRestaurants(restaurants, { area: sp.area, cat: c }).length;

  function go(href: string) {
    router.replace(href === "/food" ? pathname : href, { scroll: false });
  }

  return (
    <div className="bg-panel">
      <Container className="space-y-2.5 py-4">
        <FilterRow label="지역">
          <Chip onClick={() => go(qs({ area: undefined }, sp))} active={!sp.area} label="전국" count={filterRestaurants(restaurants, { cat: sp.cat }).length} />
          {areas.map((a) => (
            <Chip key={a} onClick={() => go(qs({ area: sp.area === a ? undefined : a }, sp))} active={sp.area === a} label={a} count={areaCount(a)} />
          ))}
        </FilterRow>
        <FilterRow label="업종">
          <Chip onClick={() => go(qs({ cat: undefined }, sp))} active={!sp.cat} label="전체" count={filterRestaurants(restaurants, { area: sp.area }).length} />
          {FOOD_CATS.map((c) => (
            <Chip key={c.code} onClick={() => go(qs({ cat: sp.cat === c.code ? undefined : c.code }, sp))} active={sp.cat === c.code} label={c.label} count={catCount(c.code)} />
          ))}
        </FilterRow>
        {(sp.area || sp.cat) && (
          <div className="flex items-center gap-2 pt-0.5 text-[12.5px]">
            <span className="font-bold text-ink-faint">선택:</span>
            <span className="font-semibold text-freedark">{heading}</span>
            <button onClick={() => go("/food")} className="ml-1 font-semibold text-ink-faint underline hover:text-ink">초기화</button>
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
            {sp.area && <div className="mt-2"><button onClick={() => go(qs({ area: undefined }, sp))} className="font-bold text-free underline">전국으로 보기 →</button></div>}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {shown.map((r) => <FoodCard key={r[0]} r={restaurantFromRow(r)} />)}
          </div>
        )}
        {list.length > CAP && <p className="mt-8 text-center text-[13px] text-ink-faint">상위 {CAP}곳 표시 · 지역·업종 필터로 좁혀보세요</p>}

        <div className="mt-8">
          <CoupangBanner />
        </div>

        <section className="mt-12 border-t border-line pt-6">
          <h2 className="mb-3 text-[15px] font-extrabold text-ink">지역별 맛집</h2>
          <div className="flex flex-wrap gap-2">
            {areas.map((a) => (
              <Link key={a} href={`/food/${(SIDO_SLUG as Record<string, string>)[a]}`} prefetch={false}
                className="rounded-full border border-line bg-white px-3 py-1 text-[13px] text-ink-soft hover:border-free hover:text-free">
                {a} 맛집
              </Link>
            ))}
          </div>
        </section>
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
