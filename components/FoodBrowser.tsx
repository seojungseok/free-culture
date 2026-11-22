import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Band";
import { Chip, FilterRow } from "@/components/FilterChips";
import FoodCard from "@/components/FoodCard";
import { FOOD_CATS, filterRestaurants, foodAreas } from "@/lib/food";
import { SIDO_SLUG } from "@/lib/classify";

export type FoodQuery = { area?: string; cat?: string; page?: string };
const PAGE_SIZE = 60;

export function foodPageHref(area: string, cat: string, page: number) {
  const query = new URLSearchParams();
  if (area) query.set("area", area);
  if (cat) query.set("cat", cat);
  if (page > 1) query.set("page", String(page));
  return query.size ? `/food?${query}` : "/food";
}

export default function FoodBrowser({ query }: { query: FoodQuery }) {
  const area = query.area || "", cat = query.cat || "";
  const areas = foodAreas();
  const category = FOOD_CATS.find(item => item.code === cat);
  const areaSlug = (SIDO_SLUG as Record<string,string>)[area];
  const page = Number(query.page || 1);
  const list = filterRestaurants({area, cat3:cat});
  if ((area && !areas.includes(area)) || (cat && !category) || !Number.isSafeInteger(page) || page < 1 || page > Math.max(1,Math.ceil(list.length/PAGE_SIZE))) notFound();
  const start = (page - 1) * PAGE_SIZE;
  return <div className="bg-panel">
    <Container className="space-y-2.5 py-4">
      <FilterRow label="지역">
        <Chip href={category ? `/food/category/${category.slug}` : "/food"} active={!area} label="전국" />
        {areas.map(name => {
          const href = `/food/${(SIDO_SLUG as Record<string,string>)[name]}${category ? "/"+category.slug : ""}`;
          const count = filterRestaurants({area:name,cat3:cat}).length;
          return count > 0 && <Chip key={name} href={href} active={area === name} label={name} count={count} />;
        })}
      </FilterRow>
      <FilterRow label="업종">
        <Chip href={areaSlug ? `/food/${areaSlug}` : "/food"} active={!category} label="전체" />
        {FOOD_CATS.map(item => {
          const count = filterRestaurants({area,cat3:item.code}).length;
          return count > 0 && <Chip key={item.code} href={areaSlug ? `/food/${areaSlug}/${item.slug}` : `/food/category/${item.slug}`} active={cat === item.code} label={item.label} count={count} />;
        })}
      </FilterRow>
    </Container>
    <Container className="pb-12 pt-2">
      <h2 className="mb-4 text-xl font-extrabold">{[area || "전국", category?.label, "맛집"].filter(Boolean).join(" ")} <span className="text-sm text-free">{list.length.toLocaleString()}곳</span></h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {list.slice(start,start+PAGE_SIZE).map(restaurant => <FoodCard key={restaurant.id} r={restaurant}/>)}
      </div>
      {list.length > PAGE_SIZE && <nav aria-label="음식점 목록 페이지" className="mt-8 flex items-center justify-center gap-6 text-sm">
        {page > 1 && <Link prefetch={false} className="font-bold text-free" href={foodPageHref(area,cat,page-1)}>← 이전</Link>}
        <span>{page} / {Math.ceil(list.length/PAGE_SIZE)}</span>
        {start+PAGE_SIZE < list.length && <Link prefetch={false} className="font-bold text-free" href={foodPageHref(area,cat,page+1)}>다음 →</Link>}
      </nav>}
    </Container>
  </div>;
}
