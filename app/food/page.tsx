import { Suspense } from "react";
import type { Metadata } from "next";
import { Band } from "@/components/Band";
import FoodBrowser, { type RestaurantRow } from "@/components/FoodBrowser";
import { foodAreas, getAllRestaurants, type Restaurant } from "@/lib/food";
import Link from "next/link";

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
        <p className="mt-1 text-[14px] text-ink-soft">전국 음식점 {restaurants.length.toLocaleString()}곳 — 지역·업종으로 골라보세요 · 출처: 한국관광공사</p>
      </Band>
      <section className="mx-auto max-w-6xl px-5 py-6 text-sm leading-7 text-ink-soft sm:px-6">
        <h2 className="text-lg font-extrabold text-ink">나들이 동선에 맞춰 음식점 찾기</h2>
        <p className="mt-2">지역과 업종으로 후보를 좁힌 뒤 주소를 확인해 방문할 장소와의 거리를 비교해 보세요. 음식점 상세에 제공된 연락처와 소개는 출발 전에 다시 확인하는 것이 좋습니다. 영업시간·메뉴·가격이 제공되지 않은 곳은 현장이나 공식 채널에서 확인해 주세요.</p>
        <p className="mt-2">식사 전후에 들를 곳을 찾는다면 <Link href="/places" className="font-semibold text-brandblue underline">지역별 나들이 장소</Link>나 <Link href="/course" className="font-semibold text-brandblue underline">여행코스</Link>를 함께 살펴보세요.</p>
      </section>
      <Suspense fallback={null}>
        <FoodBrowser restaurants={restaurants} areas={foodAreas()} />
      </Suspense>
    </>
  );
}
