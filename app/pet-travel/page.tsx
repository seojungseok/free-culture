import type { Metadata } from "next";
import PetTravelBrowser from "@/components/PetTravelBrowser";
import { getPetTravelPlaces } from "@/lib/petTravel";

export const revalidate = 43200;
export const metadata: Metadata = { title: "반려동물 여행지 추천 | 강아지와 가볼만한곳 전국 필터", description: "전국 반려동물 동반 여행지를 지역·관광 유형별로 찾아보세요. API 기반 주소, 사진, 운영·편의시설, 동반 안내와 개별 여행지 상세 페이지를 제공합니다.", keywords: ["반려동물 여행", "반려동물 동반 여행", "강아지와 가볼만한곳", "애견동반 관광지", "반려견 산책", "강아지 여행지 추천"], alternates: { canonical: "/pet-travel" }, openGraph: { url: "/pet-travel" } };

export default function PetTravelPage() {
  // Bounded server-rendered preview; the existing API still supplies the full filter set.
  const initial = getPetTravelPlaces().filter(p => p.title && (p.address || p.addr)).slice(0,12).map(p => ({id:p.id,title:p.title,address:p.address || p.addr || '',area:p.area || '',image:p.image || '',type:p.type || '',summary:(p.petInfo || p.summary || '').slice(0,180)}));
  return <><section className="border-b border-line bg-tint"><div className="mx-auto max-w-[1180px] px-5 py-7 sm:px-6 lg:px-8"><p className="text-[13px] font-bold text-free">전국 반려동물 여행</p><h1 className="mt-1 text-[26px] font-black text-ink sm:text-[34px]">반려동물과 함께 가볼만한곳</h1><p className="mt-2 max-w-2xl text-[14px] leading-6 text-ink-soft">관광지, 공원, 체험 장소를 지역과 유형으로 찾아보세요. 동반 가능 구역·크기 제한은 장소별 상세 안내와 운영처에서 확인하세요.</p></div></section><PetTravelBrowser initial={initial} /></>;
}
