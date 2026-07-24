import { Suspense } from "react";
import type { Metadata } from "next";
import type { CultureEvent } from "@/lib/types";
import { getAllEvents } from "@/lib/data";
import SearchClient from "@/components/SearchClient";
import { Container } from "@/components/Band";

export const metadata: Metadata = {
  title: "검색",
  description: "전국 무료·저렴 문화행사를 행사명·장소·지역으로 검색하세요.",
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  // PosterCard 렌더에 필요한 최소 필드만 클라이언트로 전달
  const items = getAllEvents().map((e) => ({
    id: e.id,
    title: e.title,
    place: e.place,
    area: e.area,
    sigungu: e.sigungu,
    realmName: e.realmName,
    priceType: e.priceType,
    priceLabel: e.priceLabel,
    freeCondition: e.freeCondition,
    imgUrl: e.imgUrl,
    startDate: e.startDate,
    endDate: e.endDate,
  })) as unknown as CultureEvent[];

  return (
    <Container className="pb-14">
      <h1 className="sr-only">문화행사 검색</h1>
      <Suspense fallback={null}>
        <SearchClient items={items} />
      </Suspense>
    </Container>
  );
}
