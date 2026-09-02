"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/Band";
import { FilterRow } from "@/components/FilterChips";
import TourCard from "@/components/TourCard";
import type { TourSpot } from "@/lib/tour";
import type { AutumnStory } from "@/lib/autumnContent";

type SP = { area?: string; kw?: string };
const CAP = 120;

function autumnKeywordGuide(keyword: string): string {
  if (keyword === "단풍") return "붉게 물든 나무와 산책길을 중심으로 가을 분위기가 뚜렷한 장소예요.";
  if (keyword === "억새") return "탁 트인 들판이나 능선 풍경이 좋아 가을 사진 나들이로 보기 좋은 테마예요.";
  if (keyword === "수목원") return "나무와 정원을 천천히 둘러보며 계절 변화를 관찰하기 좋은 산책형 나들이예요.";
  if (keyword === "국화") return "가을 꽃과 주변 산책 동선을 함께 보기 좋은 장소를 모았어요.";
  if (keyword === "자연휴양림") return "선선한 날씨에 숲길, 휴식, 가벼운 당일치기를 함께 잡기 좋은 곳이에요.";
  return "가을에 걷고 머물기 좋은 계절 나들이 테마예요.";
}

function qs(patch: SP, base: SP): string {
  const m: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...base, ...patch })) if (v) m[k] = v as string;
  const s = new URLSearchParams(m).toString();
  return s ? `/season?${s}` : "/season";
}

function filterSeasonPlaces(spots: TourSpot[], keywords: string[], { area, kw }: SP): TourSpot[] {
  const kws = kw ? [kw] : keywords;
  return spots.filter((p) => p.image && (!area || p.area === area) && kws.some((k) => `${p.title} ${p.addr}`.includes(k)));
}

export default function SeasonBrowser({
  spots,
  keywords,
  areas,
  seasonLabel,
  autumnStories = [],
}: {
  spots: TourSpot[];
  keywords: string[];
  areas: string[];
  seasonLabel: string;
  autumnStories?: AutumnStory[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const sp: SP = {
    area: params.get("area") || undefined,
    kw: params.get("kw") || undefined,
  };
  const list = useMemo(() => filterSeasonPlaces(spots, keywords, sp), [spots, keywords, sp.area, sp.kw]);
  const shown = list.slice(0, CAP);
  const heading = [sp.area, sp.kw].filter(Boolean).join(" ") || `${seasonLabel} 나들이`;
  const seasonKwCount = (kw: string, area?: string) => filterSeasonPlaces(spots, keywords, { area, kw }).length;

  function go(href: string) {
    router.replace(href === "/season" ? pathname : href, { scroll: false });
  }

  return (
    <div className="bg-panel">
      <Container className="space-y-2.5 py-4">
        {seasonLabel === "가을" && (
          <div className="rounded-2xl border border-[#ead8c0] bg-white px-4 py-3 shadow-sm">
            <div className="text-[13px] font-black text-[#8a4a1f]">가을 테마별로 이렇게 골라보세요</div>
            <div className="mt-2 grid gap-2 text-[12.5px] leading-[1.6] text-ink-soft sm:grid-cols-2 lg:grid-cols-5">
              {keywords.map((k) => (
                <div key={k} className="rounded-xl bg-[#fff8ef] px-3 py-2">
                  <span className="font-extrabold text-ink">{k}</span>
                  <span className="mt-0.5 block">{autumnKeywordGuide(k)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <FilterRow label="테마">
          <Chip onClick={() => go(qs({ kw: undefined }, sp))} active={!sp.kw} label="전체" count={filterSeasonPlaces(spots, keywords, { area: sp.area }).length} />
          {keywords.map((k) => (
            <Chip key={k} onClick={() => go(qs({ kw: sp.kw === k ? undefined : k }, sp))} active={sp.kw === k} label={k} count={seasonKwCount(k, sp.area)} />
          ))}
        </FilterRow>
        <FilterRow label="지역">
          <Chip onClick={() => go(qs({ area: undefined }, sp))} active={!sp.area} label="전국" count={filterSeasonPlaces(spots, keywords, { kw: sp.kw }).length} />
          {areas.map((a) => (
            <Chip key={a} onClick={() => go(qs({ area: sp.area === a ? undefined : a }, sp))} active={sp.area === a} label={a} count={seasonKwCount(sp.kw || "", a) || filterSeasonPlaces(spots, keywords, { area: a, kw: sp.kw }).length} />
          ))}
        </FilterRow>
        {(sp.area || sp.kw) && (
          <div className="flex items-center gap-2 pt-0.5 text-[12.5px]">
            <span className="font-bold text-ink-faint">선택:</span>
            <span className="font-semibold text-freedark">{heading}</span>
            <button onClick={() => go("/season")} className="ml-1 font-semibold text-ink-faint underline hover:text-ink">초기화</button>
          </div>
        )}
      </Container>

      <Container className="pb-12 pt-2">
        {seasonLabel === "가을" && autumnStories.length > 0 && !sp.area && !sp.kw && (
          <section className="mb-7">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[20px] font-extrabold tracking-tight text-ink sm:text-[22px]">조사해서 고른 가을 대표 명소</h2>
                <p className="mt-1 text-[13.5px] leading-[1.6] text-ink-faint">사이트 데이터에 공식 자료를 조금 더해, 왜 지금 가면 좋은지와 주변 식사 동선까지 정리했어요.</p>
              </div>
            </div>
            <div className="space-y-4">
              {autumnStories.map((story) => (
                <article key={story.id} className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-tint px-2 py-0.5 text-[11px] font-bold text-freedark">대표 가을나들이</span>
                    <span className="text-[12.5px] font-semibold text-ink-faint">{story.area}</span>
                  </div>
                  <h3 className="mt-2 text-[20px] font-black tracking-tight text-ink">{story.title}</h3>
                  <p className="mt-1 text-[13px] font-semibold text-ink-faint">주소: {story.address}</p>
                  <p className="mt-3 text-[14.5px] leading-[1.85] text-ink-soft">{story.summary}</p>

                  <div className="mt-4 grid gap-3 md:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-xl bg-panel px-3.5 py-3">
                      <div className="text-[13px] font-extrabold text-ink">왜 가을에 유명한가</div>
                      <ul className="mt-2 space-y-1.5 text-[13px] leading-[1.65] text-ink-soft">
                        {story.why.map((line) => <li key={line}>- {line}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-xl bg-panel px-3.5 py-3">
                      <div className="text-[13px] font-extrabold text-ink">꼭 볼 포인트</div>
                      <ul className="mt-2 space-y-1.5 text-[13px] leading-[1.65] text-ink-soft">
                        {story.mustSee.map((line) => <li key={line}>- {line}</li>)}
                      </ul>
                    </div>
                  </div>

                  <p className="mt-3 text-[13.5px] leading-[1.75] text-ink-soft">{story.route}</p>

                  {story.foods.length > 0 && (
                    <div className="mt-4">
                      <div className="text-[13px] font-extrabold text-ink">근처에서 식사하기</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {story.foods.map((food) => (
                          <a key={food.href} href={food.href} className="rounded-full border border-line bg-white px-3 py-1.5 text-[12.5px] font-bold text-ink-soft hover:border-free/40 hover:text-free">
                            {food.title} · {food.label} · {food.distance}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2 text-[12px]">
                    <a href={`/places/spot/${story.id}`} className="font-black text-free underline underline-offset-2">상세 보기</a>
                    {story.sources.map((source) => (
                      <a key={source.href} href={source.href} target="_blank" rel="nofollow noopener noreferrer" className="text-ink-faint underline underline-offset-2 hover:text-free">
                        {source.label}
                      </a>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <div className="mb-4 flex items-baseline gap-2">
          <h2 className="text-[20px] font-extrabold tracking-tight text-ink sm:text-[22px]">{heading}</h2>
          <span className="text-[14px] font-bold text-free">{list.length.toLocaleString()}곳</span>
        </div>
        {shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center text-ink-soft">
            {sp.area ? `${sp.area}에는 아직 ${heading} 결과가 적어요.` : "결과가 없어요."}
            <div className="mt-2 flex justify-center gap-3">
              {sp.area && <button onClick={() => go(qs({ area: undefined }, sp))} className="font-bold text-free underline">전국으로 보기 →</button>}
              {sp.kw && <button onClick={() => go(qs({ kw: undefined }, sp))} className="font-bold text-free underline">테마 전체 →</button>}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {shown.map((p) => <TourCard key={p.id} spot={p} />)}
          </div>
        )}
        {list.length > CAP && <p className="mt-8 text-center text-[13px] text-ink-faint">상위 {CAP}곳 표시 · 지역·테마로 좁혀보세요</p>}
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
