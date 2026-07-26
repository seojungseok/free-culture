import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllEvents, slimForClient } from "@/lib/data";
import { GENRES, SIDO_LIST, SIDO_SLUG, sidoFromSlug, genreLabelOf } from "@/lib/classify";
import FilterableGrid from "@/components/FilterableGrid";
import { Band, Container } from "@/components/Band";
import type { CultureEvent } from "@/lib/types";

// 조합 페이지는 "무료"에 초점 (free + 무료추정)
const isFree = (t: string) => t === "free" || t === "free_estimated";
const MAIN_GENRES = GENRES.filter((g) => g.key !== "etc");

function comboEvents(sido: string, genreKey: string) {
  return getAllEvents().filter(
    (e) => e.area === sido && e.genreKey === genreKey && isFree(e.priceType)
  );
}

function nowMonthLabel() {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월`;
}

// 무료 행사 ≥1 인 (지역×분야) 조합만 정적 생성 (빈 페이지 색인 방지)
export function generateStaticParams() {
  const params: { code: string; genre: string }[] = [];
  for (const sido of SIDO_LIST) {
    for (const g of MAIN_GENRES) {
      if (comboEvents(sido, g.key).length > 0) {
        params.push({ code: (SIDO_SLUG as Record<string, string>)[sido], genre: g.key });
      }
    }
  }
  return params;
}

export const dynamicParams = false; // 목록에 없는 조합은 404 (빈 페이지 방지)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string; genre: string }>;
}): Promise<Metadata> {
  const { code, genre } = await params;
  const sido = sidoFromSlug(code);
  const label = genreLabelOf(genre);
  if (!sido || !MAIN_GENRES.some((g) => g.key === genre)) return { title: "페이지를 찾을 수 없습니다" };
  const n = comboEvents(sido, genre).length;
  const month = nowMonthLabel();
  return {
    title: `${sido} ${label} 무료 행사 ${n}곳`,
    description: `${month} ${sido}에서 무료로 즐길 수 있는 ${label} ${n}건을 모았습니다. 날짜·장소별로 확인하고 주말 나들이를 계획하세요.`,
    keywords: [`${sido} 무료 ${label}`, `${sido} ${label}`, `${sido} 무료 문화행사`, `${sido} 주말 나들이`],
    alternates: { canonical: `/region/${code}/${genre}` },
  };
}

export default async function RegionGenrePage({
  params,
}: {
  params: Promise<{ code: string; genre: string }>;
}) {
  const { code, genre } = await params;
  const sido = sidoFromSlug(code);
  const valid = MAIN_GENRES.some((g) => g.key === genre);
  if (!sido || !valid) notFound();

  const label = genreLabelOf(genre);
  const events = comboEvents(sido, genre);
  if (events.length === 0) notFound();
  const n = events.length;
  const month = nowMonthLabel();

  // 내부 링크: 같은 분야 다른 지역 / 같은 지역 다른 분야 (무료 있는 것만)
  const otherRegions = SIDO_LIST.filter(
    (s) => s !== sido && comboEvents(s, genre).length > 0
  );
  const otherGenres = MAIN_GENRES.filter(
    (g) => g.key !== genre && comboEvents(sido, g.key).length > 0
  );

  return (
    <>
      <Band tone="tint" innerClassName="py-7">
        <nav className="mb-2 text-[13px] text-ink-faint">
          <Link href="/" className="hover:text-ink">홈</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/region/${code}`} className="hover:text-ink">{sido}</Link>
          <span className="mx-1.5">/</span>
          <span className="text-ink-soft">{label}</span>
        </nav>
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          <span className="text-free">{sido} 무료 {label}</span>{" "}
          <span className="text-[16px] font-bold text-ink-faint sm:text-[18px]">({month})</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-soft sm:text-[15px]">
          {month} {sido}에서 무료로 즐길 수 있는 <b className="text-ink">{label} {n}건</b>을
          모았습니다. 아래에서 기간·장소별로 확인하고 주말 나들이를 계획해 보세요.
          정확한 요금·일정은 각 행사의 공식 페이지에서 확인해 주세요.
        </p>
      </Band>

      <div className="bg-panel">
        <Container className="pb-12 pt-6">
          <div className="mb-4 flex items-baseline gap-2">
            <h2 className="text-[18px] font-extrabold text-ink">{sido} {label}</h2>
            <span className="text-[14px] font-bold text-free">무료 {n}건</span>
          </div>
          <Suspense fallback={null}>
            <FilterableGrid events={slimForClient(events) as CultureEvent[]} showControls={false} />
          </Suspense>

          {/* 내부 링크 (크롤링 유도) */}
          <div className="mt-12 space-y-5 border-t border-line pt-8">
            {otherRegions.length > 0 && (
              <div>
                <div className="mb-2 text-[13px] font-bold text-ink">
                  다른 지역에서 무료 {label} 보기
                </div>
                <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 text-[13px] text-ink-soft">
                  {otherRegions.map((s) => (
                    <Link
                      key={s}
                      href={`/region/${(SIDO_SLUG as Record<string, string>)[s]}/${genre}`}
                      className="hover:text-free hover:underline"
                    >
                      {s} {label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {otherGenres.length > 0 && (
              <div>
                <div className="mb-2 text-[13px] font-bold text-ink">
                  {sido}의 다른 무료 분야 보기
                </div>
                <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 text-[13px] text-ink-soft">
                  {otherGenres.map((g) => (
                    <Link
                      key={g.key}
                      href={`/region/${code}/${g.key}`}
                      className="hover:text-free hover:underline"
                    >
                      {sido} {g.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Container>
      </div>
    </>
  );
}
