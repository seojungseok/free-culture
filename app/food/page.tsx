import { Suspense } from "react";
import type { Metadata } from "next";
import { Band } from "@/components/Band";
import AffiliateNotice from "@/components/AffiliateNotice";
import FoodBrowser, { type RestaurantRow } from "@/components/FoodBrowser";
import { foodAreas, getAllRestaurants, type Restaurant } from "@/lib/food";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "전국 맛집 — 지역·업종별 맛집 탐방",
  description: "전국 맛집을 지역과 업종(한식·중식·일식·카페 등)으로 골라보세요. 위치·연락처·영업정보 제공.",
  keywords: ["맛집", "지역 맛집", "맛집 탐방", "전국 음식점"],
  alternates: { canonical: "/food" },
};

function slimRestaurant(r: Restaurant): RestaurantRow {
  return [r.id, r.title, r.addr, r.area, r.image, r.cat3 || "", r.phone || ""];
}

export default function FoodPage() {
  const restaurants = getAllRestaurants().map(slimRestaurant);

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">🍽️ <span className="text-free">맛집 탐방</span></h1>
        <AffiliateNotice className="mt-1.5" partner="coupang" />
        <p className="mt-1 text-[14px] text-ink-soft">전국 음식점 {restaurants.length.toLocaleString()}곳 — 지역·업종으로 골라보세요 · 출처: 한국관광공사</p>
      </Band>
      <Suspense fallback={null}>
        <FoodBrowser restaurants={restaurants} areas={foodAreas()} />
      </Suspense>
    </>
  );
}
