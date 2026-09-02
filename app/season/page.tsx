import { Suspense } from "react";
import type { Metadata } from "next";
import { Band } from "@/components/Band";
import SeasonBrowser from "@/components/SeasonBrowser";
import { filterSeasonPlaces, SEASON_KEYWORDS } from "@/lib/season";
import { slimTours } from "@/lib/tour";
import { nearbyRestaurants } from "@/lib/nearby";
import { autumnHeroText, autumnReason, buildAutumnStories } from "@/lib/autumnContent";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "가을나들이 추천 — 단풍·억새·수목원·자연휴양림",
  description: "전국 가을나들이 장소를 단풍·억새·수목원·자연휴양림 테마로 정리했습니다. 주소, 사진, 가을에 좋은 이유와 주변 맛집 동선까지 확인하세요.",
  keywords: ["가을나들이", "단풍 명소", "억새 명소", "수목원", "자연휴양림", "주말 나들이", "전국 관광지"],
  alternates: { canonical: "/season" },
};

export default function SeasonPage() {
  const s = { key: "autumn", label: "가을", emoji: "🍁" };
  const keywords = SEASON_KEYWORDS.autumn;
  const fullSpots = keywords.flatMap((kw) => filterSeasonPlaces({ kw }));
  const uniqueFullSpots = [...new Map(fullSpots.map((spot) => [spot.id, spot])).values()];
  const spots = slimTours(uniqueFullSpots).map((spot) => ({ ...spot, overview: autumnReason(spot) }));
  const nearbyFoodByPlace =
    Object.fromEntries(uniqueFullSpots.filter((p) => p.id === "2715684").map((p) => [p.id, nearbyRestaurants(p, 4)]));
  const autumnStories = buildAutumnStories(uniqueFullSpots, nearbyFoodByPlace);

  return (
    <>
      <Band tone="tint" innerClassName="py-5">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">{s.emoji} <span className="text-free">{s.label} 나들이</span></h1>
        <p className="mt-1 max-w-[820px] text-[14px] leading-[1.75] text-ink-soft">
          {autumnHeroText(uniqueFullSpots.length)}
        </p>
      </Band>
      <AutumnStorySection stories={autumnStories} />
      <Suspense fallback={null}>
        <SeasonBrowser spots={spots} keywords={keywords} areas={[...new Set(uniqueFullSpots.map((spot) => spot.area))]} seasonLabel={s.label} />
      </Suspense>
    </>
  );
}

function AutumnStorySection({ stories }: { stories: ReturnType<typeof buildAutumnStories> }) {
  if (stories.length === 0) return null;

  return (
    <Band tone="panel" innerClassName="pb-3 pt-4">
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-extrabold tracking-tight text-ink sm:text-[22px]">조사해서 고른 가을 대표 명소</h2>
            <p className="mt-1 text-[13.5px] leading-[1.6] text-ink-faint">사이트 데이터에 공식 자료를 조금 더해, 왜 지금 가면 좋은지와 주변 식사 동선까지 정리했어요.</p>
          </div>
        </div>
        <div className="space-y-4">
          {stories.map((story) => (
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
    </Band>
  );
}
