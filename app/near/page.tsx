import type { Metadata } from "next";
import { Container } from "@/components/Band";
import NearFinder from "@/components/NearFinder";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "내 주변 나들이·캠핑장 찾기",
  description: "현재 위치나 지역으로 가까운 나들이 장소와 캠핑장을 찾아보세요.",
  alternates: { canonical: "/near" },
};

export default function NearPage() {
  return (
    <Container className="max-w-[1080px] py-6 sm:py-8">
      <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">내 주변</h1>
      <p className="mt-1 text-[14px] text-ink-soft sm:text-[15px]">
        현재 위치나 지역으로 가까운 <b className="font-bold text-ink">나들이·캠핑장</b>을 찾아보세요. 위치는 저장하지 않아요.
      </p>
      <div className="mt-5">
        <NearFinder />
      </div>
      <p className="mt-8 text-[12px] text-ink-faint">관광정보 제공: 한국관광공사 (TourAPI) · {SITE.name}</p>
    </Container>
  );
}
