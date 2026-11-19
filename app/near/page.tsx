import { withSearchMetadata } from '@/lib/searchMetadata';
import type { Metadata } from "next";
import NearFinder from "@/components/NearFinder";
import { SITE } from "@/lib/site";

export const metadata: Metadata = withSearchMetadata({
  title: "내 주변 갈 만한 곳",
  description: "내 주변의 문화행사, 축제, 맛집, 놀이터, 캠핑장과 체험을 거리와 종류별로 찾아보세요.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/near" },
});

export default function NearPage() {
  return (
    <main className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">내 주변 갈 만한 곳</h1>
      <p className="mt-1 text-[14px] text-ink-soft sm:text-[15px]">
        가까운 축제와 공연, 아이와 갈 놀이터, 캠핑장과 맛집을 한눈에 찾아보세요.
      </p>
      <div className="mt-5">
        <NearFinder />
      </div>
      <p className="mt-8 text-[12px] text-ink-faint">자료 제공 · 한국관광공사, 한국문화정보원, 행정안전부 등 공공기관 · {SITE.name}</p>
    </main>
  );
}
