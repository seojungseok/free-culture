import Link from "next/link";
import type { Metadata } from "next";
import { getAllEvents, getWeekend, getFree, getNow, getFeatured, slimForClient } from "@/lib/data";
import { getPlacesSample, getPlaceCount, getAllPlaces } from "@/lib/tour";
import { getCampCount, getAllCamps } from "@/lib/camping";
import { todayYmd } from "@/lib/dates";
import PosterCard from "@/components/PosterCard";
import TourCard from "@/components/TourCard";
import CampCard from "@/components/CampCard";
import BigEventModal from "@/components/BigEventModal";
import { Band } from "@/components/Band";
import { SITE } from "@/lib/site";
import { season } from "@/lib/finder";
import { search } from "@/lib/search";
import HeroCarousel, { type HeroSlide } from "@/components/HeroCarousel";
import ScrollRail from "@/components/ScrollRail";
import restaurantsData from "@/data/restaurants.json";
import type { CultureEvent } from "@/lib/types";

export const metadata: Metadata = {
  title: `${SITE.name} · 이번 주말 갈 만한 전국 무료·저렴 문화행사`,
  description: SITE.description,
  alternates: { canonical: "/" },
};

const FREEISH = new Set(["free", "free_estimated", "partial_free"]);
const RAIL_SPOT = "w-[64%] shrink-0 snap-start sm:w-[31%] md:w-[23.5%] lg:w-[19%]";
const RAIL_POSTER = "w-[54%] shrink-0 snap-start sm:w-[27%] md:w-[21%] lg:w-[16%]";
const restaurants = (restaurantsData as unknown as { restaurants: { id: string; title: string; area: string; image: string }[] }).restaurants || [];

export default function HomePage() {
  const all = getAllEvents();
  const placeCount = getPlaceCount();
  const campCount = getCampCount();
  const s = season();
  const today = todayYmd();

  const sample = getPlacesSample(40).filter((p) => p.image);
  const camps = getAllCamps().filter((c) => c.image);
  const foods = restaurants.filter((r) => r.image);
  const seasonSpots = getAllPlaces().filter((p) => p.image && s.terms.some((t) => `${p.title} ${p.addr}`.includes(t)));

  // 오늘 무료 문화행사 수(띠)
  const freeTodayCount = getNow().filter((e) => FREEISH.has(e.priceType)).length;

  // ── 히어로 10개(다양) — 무료행사 / 나들이 / 맛집 / 캠핑 / 계절, 밝은 이미지 소스만 라운드로빈
  const featured = getFeatured(8).filter((e) => e.imgUrl);
  const pools: HeroSlide[][] = [
    featured.map((e) => ({ image: e.imgUrl, badge: "무료 문화행사", title: e.title, sub: [e.area, e.place].filter(Boolean).join(" · "), href: `/event/${e.id}` })),
    sample.map((p) => ({ image: p.image, badge: "인기 나들이 명소", title: p.title, sub: p.area, href: `/places/spot/${p.id}` })),
    foods.map((r) => ({ image: r.image, badge: "맛집 탐방", title: r.title, sub: r.area, href: `/places/spot/${r.id}` })),
    camps.map((c) => ({ image: c.image, badge: "캠핑", title: c.name, sub: [c.area, c.sigungu].filter(Boolean).join(" · "), href: `/camping/${c.id}` })),
    seasonSpots.map((p) => ({ image: p.image, badge: `${s.label} 나들이`, title: p.title, sub: p.area, href: `/places/spot/${p.id}` })),
  ];
  const heroSlides: HeroSlide[] = [];
  for (let i = 0; heroSlides.length < 10 && i < 20; i++) {
    for (const pool of pools) if (pool[i] && heroSlides.length < 10) heroSlides.push(pool[i]);
  }

  // 인기 검색어 — 결과 풍부한 명소만
  const POP_CANDS = ["경주", "전주", "여수", "강릉", "속초", "통영", "안동", "춘천", "수원", "해운대", "포항", "가평", "남해", "양양", "거제"];
  const popular = POP_CANDS.map((t) => ({ t, n: search(t).total })).filter((x) => x.n >= 40).sort((a, b) => b.n - a.n).slice(0, 12).map((x) => x.t);

  // 카드 섹션 데이터
  const eventCards = slimForClient(getFree(true).filter((e) => e.imgUrl && e.endDate >= today).slice(0, 12));
  const placeCards = sample.slice(0, 12);
  const campCards = camps.slice(0, 12);

  const popupPicks = slimForClient(
    [...getWeekend()].filter((e) => FREEISH.has(e.priceType) && e.imgUrl).sort((a, b) => b.featuredScore - a.featuredScore).slice(0, 5)
  );

  return (
    <>
      <BigEventModal events={popupPicks} />

      {/* 히어로 */}
      <div className="mx-auto w-full max-w-[1280px] pt-3 sm:pt-5">
        <div className="mb-2.5 px-4 sm:mb-3 sm:px-6 lg:px-8">
          <h1 className="text-[19px] font-black tracking-[-0.02em] text-ink sm:text-[24px]">
            이번 주말 <span className="text-free">뭐하지?</span>
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-faint sm:text-[14px]">전국 무료 행사·나들이·캠핑을 매일 새로 골라드려요</p>
        </div>
        <HeroCarousel slides={heroSlides} />
      </div>

      {/* 오늘 무료 띠 */}
      <Band tone="white" border={false} innerClassName="pt-4 sm:pt-5">
        <Link href="/free" className="flex items-center justify-between gap-3 rounded-2xl bg-freelight px-4 py-3.5 transition hover:bg-[#dcf5e7] sm:px-5">
          <span className="text-[13.5px] font-bold text-freedark sm:text-[15px]">
            🆓 오늘 무료로 즐기는 문화행사 <span className="tabular-nums">{freeTodayCount.toLocaleString()}</span>건
          </span>
          <span className="shrink-0 text-[13px] font-bold text-free">바로 확인 →</span>
        </Link>
      </Band>

      {/* 인기 검색어 */}
      {popular.length > 0 && (
        <Band tone="white" border={false} innerClassName="py-6 sm:py-7">
          <h2 className="text-[19px] font-extrabold tracking-tight text-ink sm:text-[22px]">인기 검색어</h2>
          <p className="mt-0.5 text-[13px] text-ink-faint">대한민국 대표 여행지부터 시작해요</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {popular.map((p, i) => (
              <Link key={p} href={`/search?q=${encodeURIComponent(p)}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-[13.5px] font-semibold text-ink-soft transition hover:border-free/40 hover:text-free">
                <span className="text-[12px] font-black text-free">{i + 1}</span>{p}
              </Link>
            ))}
          </div>
        </Band>
      )}

      {/* 문화행사 */}
      {eventCards.length > 0 && (
        <CardSection tone="panel" title="문화행사" desc="무료·저렴한 전시·공연" href="/events" moreLabel={`전체 ${all.length.toLocaleString()}건`}>
          <ScrollRail ariaLabel="문화행사">
            {eventCards.map((ev: CultureEvent) => (
              <div key={ev.id} className={RAIL_POSTER}><PosterCard ev={ev} /></div>
            ))}
          </ScrollRail>
        </CardSection>
      )}

      {/* 나들이 */}
      {placeCards.length > 0 && (
        <CardSection tone="white" title="나들이" desc="아이와 가기 좋은 전국 가볼만한 곳" href="/places" moreLabel={`전체 ${placeCount.toLocaleString()}곳`}>
          <ScrollRail ariaLabel="나들이">
            {placeCards.map((p) => (
              <div key={p.id} className={RAIL_SPOT}><TourCard spot={p} /></div>
            ))}
          </ScrollRail>
        </CardSection>
      )}

      {/* 캠핑 */}
      {campCards.length > 0 && (
        <CardSection tone="panel" title="캠핑" desc="숲·계곡·바다, 반려동물 동반까지" href="/camping" moreLabel={`전체 ${campCount.toLocaleString()}곳`}>
          <ScrollRail ariaLabel="캠핑">
            {campCards.map((c) => (
              <div key={c.id} className={RAIL_SPOT}><CampCard camp={c} /></div>
            ))}
          </ScrollRail>
        </CardSection>
      )}
    </>
  );
}

function CardSection({ tone, title, desc, href, moreLabel, children }: { tone: "white" | "panel"; title: string; desc?: string; href?: string; moreLabel?: string; children: React.ReactNode }) {
  return (
    <Band tone={tone} innerClassName="py-6 sm:py-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[19px] font-extrabold tracking-tight text-ink sm:text-[22px]">{title}</h2>
          {desc && <p className="mt-0.5 text-[13px] text-ink-faint sm:text-[14px]">{desc}</p>}
        </div>
        {href && (
          <Link href={href} className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-bold text-ink-soft transition hover:bg-black/5 hover:text-ink">
            {moreLabel || "전체보기"} →
          </Link>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </Band>
  );
}
