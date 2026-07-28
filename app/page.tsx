import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getAllEvents, getWeekend, getFree, getNow, getFeatured, slimForClient } from "@/lib/data";
import { getAllPlaces, getPlacesSample, getPlaceCount, type TourSpot } from "@/lib/tour";
import { getCampCount, getAllCamps } from "@/lib/camping";
import { todayYmd } from "@/lib/dates";
import PosterCard from "@/components/PosterCard";
import TourCard from "@/components/TourCard";
import BigEventModal from "@/components/BigEventModal";
import { Band } from "@/components/Band";
import { SITE } from "@/lib/site";
import { season } from "@/lib/finder";
import { buildDateThemes } from "@/lib/dateThemes";
import QuickEntry from "@/components/QuickEntry";
import HeroCarousel, { type HeroSlide } from "@/components/HeroCarousel";
import ScrollRail from "@/components/ScrollRail";
import type { CultureEvent } from "@/lib/types";

export const metadata: Metadata = {
  title: `${SITE.name} · 이번 주말 갈 만한 전국 무료·저렴 문화행사`,
  description: SITE.description,
  alternates: { canonical: "/" },
};

const FREEISH = new Set(["free", "free_estimated", "partial_free"]);
const RAIL_SPOT = "w-[46%] shrink-0 snap-start sm:w-[31%] md:w-[23.5%] lg:w-[19%]";
const RAIL_POSTER = "w-[42%] shrink-0 snap-start sm:w-[27%] md:w-[21%] lg:w-[16%]";

export default function HomePage() {
  const all = getAllEvents();
  const placeCount = getPlaceCount();
  const campCount = getCampCount();
  const s = season();
  const today = todayYmd();

  // ── 데이터 선별 ────────────────────────────────────────────────
  const dateThemes = buildDateThemes();

  // 인기 명소 샘플(아이친화·유형 균형) — 이미지 있는 것만
  const sample = getPlacesSample(40).filter((p) => p.image);
  const topSpots = sample.slice(0, 5); // 인기 TOP
  const weekendSpots = sample.slice(5, 21); // 이번 주말 인기 명소

  // 계절 추천 명소 — 제목·주소에 계절 키워드
  const seasonSpots = getAllPlaces().filter(
    (p) => p.image && s.terms.some((t) => `${p.title} ${p.addr}`.includes(t))
  );

  // 오늘 무료로 즐기는 문화행사(진행중·무료·이미지)
  const todayFreeAll = getNow().filter((e) => FREEISH.has(e.priceType));
  const todayFree = slimForClient(todayFreeAll.filter((e) => e.imgUrl).slice(0, 14));
  const freeTodayCount = todayFreeAll.length;

  // 히어로: 이번 주말 무료 대형행사 + 계절 명소 번갈아
  const weekendBig = getWeekend()
    .filter((e) => FREEISH.has(e.priceType) && e.imgUrl && e.endDate >= today)
    .sort((a, b) => b.featuredScore - a.featuredScore)
    .slice(0, 5);
  const heroSlides: HeroSlide[] = [];
  const seasonForHero = seasonSpots.slice(0, 5);
  for (let i = 0; i < Math.max(weekendBig.length, seasonForHero.length); i++) {
    const e = weekendBig[i];
    if (e) heroSlides.push({ image: e.imgUrl, badge: "이번 주말 · 무료", title: e.title, sub: [e.area, e.place].filter(Boolean).join(" · "), href: `/event/${e.id}` });
    const p = seasonForHero[i];
    if (p) heroSlides.push({ image: p.image, badge: `${s.emoji} ${s.label} 추천 명소`, title: p.title, sub: p.area, href: `/places/spot/${p.id}` });
  }
  // 폴백 — 이미지가 부족하면 인기 명소로 채움
  for (const p of sample) {
    if (heroSlides.length >= 6) break;
    if (heroSlides.length >= 4) break;
    heroSlides.push({ image: p.image, badge: "인기 명소", title: p.title, sub: p.area, href: `/places/spot/${p.id}` });
  }

  // 카테고리 3대 대표 이미지
  const featImg = getFeatured(1)[0]?.imgUrl;
  const campImg = getAllCamps().find((c) => c.image)?.image;

  // 팝업(주말 무료 큰 행사)
  const popupPicks = slimForClient(
    [...getWeekend()].filter((e) => FREEISH.has(e.priceType) && e.imgUrl).sort((a, b) => b.featuredScore - a.featuredScore).slice(0, 5)
  );

  return (
    <>
      <BigEventModal events={popupPicks} />

      {/* 2. 히어로 — 이번 주말 추천 (peek 캐러셀) */}
      <div className="mx-auto w-full max-w-[1280px] pt-4 sm:pt-5">
        <div className="mb-3 px-5 sm:px-6 lg:px-8">
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-ink sm:text-[24px]">
            이번 주말 <span className="text-free">뭐하지?</span>
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-faint sm:text-[14px]">전국 무료 행사·나들이·캠핑, 매일 새로 골라드려요</p>
        </div>
        <HeroCarousel slides={heroSlides} />
      </div>

      {/* 3. 프로모션 띠 — 오늘 무료 */}
      <Band tone="white" border={false} innerClassName="pt-4 sm:pt-5">
        <Link
          href="/free"
          className="flex items-center justify-between gap-3 rounded-2xl bg-freelight px-5 py-3.5 transition hover:bg-[#dcf5e7]"
        >
          <span className="text-[13.5px] font-bold text-freedark sm:text-[15px]">
            🆓 오늘 무료로 즐기는 문화행사 <span className="tabular-nums">{freeTodayCount.toLocaleString()}</span>건
          </span>
          <span className="shrink-0 text-[13px] font-bold text-free">바로 확인 →</span>
        </Link>
      </Band>

      {/* 4. 빠른 진입 (아이콘 카테고리) */}
      <Band tone="white" border={false} className="scroll-mt-24" innerClassName="py-6 sm:py-7">
        <div id="quick-entry" className="scroll-mt-28">
          <SectionHead title="테마별 찾기" desc="원하는 방식을 누르고 지역·조건을 골라보세요" />
          <div className="mt-3">
            <QuickEntry seasonLabel={s.label} seasonEmoji={s.emoji} seasonTerms={s.terms} dateThemes={dateThemes} />
          </div>
        </div>
      </Band>

      {/* 5-a. 이번 주말 인기 명소 */}
      <CardSection tone="panel" title="이번 주말 인기 명소" desc="아이와 가기 좋은 전국 나들이" href="/places" moreLabel="나들이 전체">
        <ScrollRail ariaLabel="이번 주말 인기 명소">
          {weekendSpots.map((p) => (
            <div key={p.id} className={RAIL_SPOT}><TourCard spot={p} /></div>
          ))}
        </ScrollRail>
      </CardSection>

      {/* 5-b. 오늘 무료 행사 */}
      {todayFree.length > 0 && (
        <CardSection tone="white" title="오늘 무료 행사" desc="지금 열리는 무료 전시·공연" href="/free" moreLabel="무료 전체">
          <ScrollRail ariaLabel="오늘 무료 행사">
            {todayFree.map((ev: CultureEvent) => (
              <div key={ev.id} className={RAIL_POSTER}><PosterCard ev={ev} /></div>
            ))}
          </ScrollRail>
        </CardSection>
      )}

      {/* 5-c. 계절 추천 명소 */}
      {seasonSpots.length > 0 && (
        <CardSection tone="panel" title={`${s.emoji} ${s.label} 추천 명소`} desc={`${s.label}에 가기 좋은 곳을 모았어요`} href="/places" moreLabel="더 보기">
          <ScrollRail ariaLabel={`${s.label} 추천 명소`}>
            {seasonSpots.slice(0, 16).map((p) => (
              <div key={p.id} className={RAIL_SPOT}><TourCard spot={p} /></div>
            ))}
          </ScrollRail>
        </CardSection>
      )}

      {/* 6. 배너 + 카드 조합 — 이 계절 가볼 만한 곳 */}
      {seasonSpots.length >= 3 && (
        <Band tone="white" innerClassName="py-7 sm:py-8">
          <div className="grid gap-4 lg:grid-cols-[1.05fr_2fr]">
            <Link
              href="/places"
              className="group relative flex min-h-[220px] flex-col justify-end overflow-hidden rounded-2xl bg-neutral-800 p-6 sm:min-h-[300px] sm:p-7"
            >
              {seasonForHero[0]?.image && (
                <Image src={seasonForHero[0].image} alt="" fill sizes="(max-width:1024px) 100vw, 420px" className="object-cover opacity-80 transition duration-500 group-hover:scale-[1.04]" unoptimized />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="relative">
                <div className="text-[22px] font-black leading-tight tracking-[-0.02em] text-white sm:text-[26px]">이 {s.label}, 가볼 만한 곳</div>
                <p className="mt-1 text-[13px] text-white/80">{s.emoji} {s.terms.slice(0, 3).join(" · ")} 명소</p>
                <span className="mt-4 inline-flex w-fit items-center gap-1 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-ink transition group-hover:text-free">자세히 보기 →</span>
              </div>
            </Link>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {seasonSpots.slice(3, 6).map((p) => (
                <TourCard key={p.id} spot={p} />
              ))}
            </div>
          </div>
        </Band>
      )}

      {/* 7. 카테고리 3대 */}
      <Band tone="panel" innerClassName="py-7 sm:py-8">
        <SectionHead title="무엇을 찾고 있나요?" desc="문화행사 · 나들이 · 캠핑 전국 정보를 한 곳에서" />
        <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
          <CategoryCard href="/events" emoji="🎭" title="문화행사" count={`${all.length.toLocaleString()}건`} sub="전시·공연" image={featImg} />
          <CategoryCard href="/places" emoji="🏞️" title="나들이" count={`${placeCount.toLocaleString()}곳`} sub="가볼만한 곳" image={sample[0]?.image} />
          <CategoryCard href="/camping" emoji="⛺" title="캠핑" count={`${campCount.toLocaleString()}곳`} sub="전국 캠핑장" image={campImg} />
        </div>
      </Band>

      {/* 8. 인기 TOP 그리드 */}
      {topSpots.length >= 5 && (
        <Band tone="white" innerClassName="py-7 sm:py-8">
          <SectionHead title="많이 찾는 나들이" desc="지금 인기 있는 전국 명소" href="/places" moreLabel="전체 보기" />
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
            {topSpots.map((p, i) => (
              <RankCard key={p.id} spot={p} rank={i + 1} />
            ))}
          </div>
        </Band>
      )}
    </>
  );
}

// ── 재사용 서브 컴포넌트 ─────────────────────────────────────────
function SectionHead({ title, desc, href, moreLabel }: { title: string; desc?: string; href?: string; moreLabel?: string }) {
  return (
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
  );
}

function CardSection({ tone, title, desc, href, moreLabel, children }: { tone: "white" | "panel"; title: string; desc?: string; href?: string; moreLabel?: string; children: React.ReactNode }) {
  return (
    <Band tone={tone} innerClassName="py-7 sm:py-8">
      <SectionHead title={title} desc={desc} href={href} moreLabel={moreLabel} />
      <div className="mt-4">{children}</div>
    </Band>
  );
}

function CategoryCard({ href, emoji, title, count, sub, image }: { href: string; emoji: string; title: string; count: string; sub: string; image?: string }) {
  return (
    <Link href={href} className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-2xl bg-neutral-800 p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-cardhover sm:aspect-[4/3]">
      {image ? (
        <Image src={image} alt="" fill sizes="(max-width:640px) 33vw, 300px" className="object-cover opacity-75 transition duration-500 group-hover:scale-[1.05]" unoptimized />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-free/80 to-freedark" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
      <div className="relative">
        <div className="text-[22px] leading-none">{emoji}</div>
        <div className="mt-1.5 text-[16px] font-black text-white sm:text-[18px]">{title}</div>
        <div className="mt-0.5 text-[11.5px] font-semibold leading-tight text-white/80 sm:text-[12.5px]">
          {sub} <span className="whitespace-nowrap">{count}</span>
        </div>
      </div>
    </Link>
  );
}

function RankCard({ spot, rank }: { spot: TourSpot; rank: number }) {
  return (
    <Link href={`/places/spot/${spot.id}`} className="group block">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/[0.04] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-cardhover">
        {spot.image ? (
          <Image src={spot.image} alt={spot.title} fill sizes="(max-width:640px) 50vw, 240px" className="object-cover transition group-hover:scale-105" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-faint">🏞️</div>
        )}
        <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-[14px] font-black text-white backdrop-blur-sm">{rank}</span>
      </div>
      <div className="px-0.5 pt-2">
        <h3 className="line-clamp-1 text-[14px] font-bold text-ink group-hover:text-free">{spot.title}</h3>
        <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-faint">{spot.area}</p>
      </div>
    </Link>
  );
}
