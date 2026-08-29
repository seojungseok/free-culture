import type { Metadata } from "next";
import Link from "next/link";
import { getAllBundles } from "@/lib/campingCollections";
import { SITE } from "@/lib/site";
import { Band, Container } from "@/components/Band";
import CoupangDeals from "@/components/CoupangDeals";

export const metadata: Metadata = {
  title: `캠핑장 모음 — 지역·유형별 큐레이션 · ${SITE.name}`,
  description: "지역별 반려동물 캠핑장·글램핑·오토캠핑·카라반 모음. 데이터로 자동 정리한 캠핑장 큐레이션.",
  alternates: { canonical: "/camping/collections" },
};

const THEME_ORDER = ["pet", "glamp", "auto", "carav", "elec"];
const THEME_LABEL: Record<string, string> = { pet: "🐾 반려동물 동반", glamp: "⛺ 글램핑", auto: "🚙 오토캠핑", carav: "🚐 카라반", elec: "⚡ 전기 되는 곳" };

export default function CollectionsIndex() {
  const bundles = getAllBundles();
  const byTheme = THEME_ORDER.map((k) => ({ key: k, label: THEME_LABEL[k], items: bundles.filter((b) => b.themeKey === k) })).filter((g) => g.items.length);

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">⛺ 캠핑장 모음</h1>
        <p className="mt-1 text-[14px] text-ink-soft">지역·유형별로 데이터로 추린 캠핑장 큐레이션 {bundles.length}개 · 출처: 한국관광공사 고캠핑</p>
      </Band>
      <div className="bg-panel">
        <Container className="space-y-8 py-7">
          {byTheme.map((g) => (
            <section key={g.key}>
              <h2 className="mb-3 text-[17px] font-extrabold text-ink">{g.label}</h2>
              <div className="flex flex-wrap gap-2">
                {g.items.map((b) => (
                  <Link key={b.slug} href={`/camping/collections/${b.slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-[13.5px] font-bold text-ink-soft transition hover:border-free hover:text-free">
                    {b.area}<span className="text-[12px] font-black text-free">{b.count}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          {/* 캠핑용품 제휴 배너 (쿠팡 파트너스) — 목록 끝, 광고와 간격 확보 */}
          <CoupangDeals />
        </Container>
      </div>
    </>
  );
}
