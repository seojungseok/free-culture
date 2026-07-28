import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getAllEvents, getWeekend, getNow, getFeatured, getEndingSoon, slimForClient } from "@/lib/data";
import { getPlacesSample, getPlaceCount, type TourSpot } from "@/lib/tour";
import { getCampCount, getAllCamps } from "@/lib/camping";
import { todayYmd } from "@/lib/dates";
import PosterCard from "@/components/PosterCard";
import TourCard from "@/components/TourCard";
import CampCard from "@/components/CampCard";
import BigEventModal from "@/components/BigEventModal";
import { Band } from "@/components/Band";
import { SITE } from "@/lib/site";
import { season } from "@/lib/finder";
import { buildDateThemes } from "@/lib/dateThemes";
import { SIDO_LIST, SIDO_SLUG } from "@/lib/classify";
import QuickEntry from "@/components/QuickEntry";
import HeroCarousel, { type HeroSlide } from "@/components/HeroCarousel";
import ScrollRail from "@/components/ScrollRail";
import Icon, { seasonIcon, type IconName } from "@/components/Icon";
import type { CultureEvent } from "@/lib/types";

export const metadata: Metadata = {
  title: `${SITE.name} · 이번 주말 갈 만한 전국 무료·저렴 문화행사`,
  description: SITE.description,
  alternates: { canonical: "/" },
};

const FREEISH = new Set(["free", "free_estimated", "partial_free"]);
const RAIL_SPOT = "w-[46%] shrink-0 snap-start sm:w-[31%] md:w-[23.5%] lg:w-[19%]";
const RAIL_POSTER = "w-[42%] shrink-0 snap-start sm:w-[27%] md:w-[21%] lg:w-[16%]";

// 홈 FAQ (검색 노출용 JSON-LD + 하단 노출)
const FAQ: { q: string; a: string }[] = [
  { q: "주말에 무료로 갈 만한 곳은 어디인가요?", a: "무료 전시·공연은 ‘무료 행사’에서, 무료입장 명소는 ‘나들이’에서 지역별로 골라볼 수 있어요. 매일 자동으로 업데이트됩니다." },
  { q: "아이와 함께 가기 좋은 곳은 어디인가요?", a: "박물관·과학관·체험관 등 아이와 가기 좋은 나들이 장소를 ‘나들이’에서 지역별로 확인할 수 있어요." },
  { q: "정보는 얼마나 자주 업데이트되나요?", a: "전국 문화행사·나들이·캠핑 정보를 매일 자동으로 새로 수집해 갱신합니다." },
  { q: "반려동물과 갈 만한 캠핑장이 있나요?", a: "전국 캠핑장을 반려동물 동반 여부·유형별로 찾아볼 수 있어요. 검색에서 ‘반려동물 캠핑장’으로 찾아보세요." },
];

export default function HomePage() {
  const all = getAllEvents();
  const placeCount = getPlaceCount();
  const campCount = getCampCount();
  const s = season();
  const today = todayYmd();

  const dateThemes = buildDateThemes();

  // 인기 명소(유형 균형·이미지 우선)
  const sample = getPlacesSample(40).filter((p) => p.image);
  const topSpots = sample.slice(0, 5);
  const weekendSpots = sample.slice(5, 19);

  // 이번 주말 무료 행사 / 곧 종료 / 캠핑 추천
  const weekendFree = slimForClient(getWeekend().filter((e) => FREEISH.has(e.priceType) && e.imgUrl).slice(0, 12));
  const endingSoon = slimForClient(getEndingSoon(10).filter((e) => e.imgUrl).slice(0, 12));
  const camps = getAllCamps().filter((c) => c.image).slice(0, 12);
  const freeTodayCount = getNow().filter((e) => FREEISH.has(e.priceType)).length;

  // 히어로 5개 — 큐레이션된 밝은 이미지만(featured 행사 + 인기 명소), 계절 키워드 필터 배제
  const heroEvents = [
    ...getFeatured(8),
    ...getWeekend().filter((e) => FREEISH.has(e.priceType) && e.imgUrl && e.endDate >= today),
  ].filter((e, i, arr) => e.imgUrl && arr.findIndex((x) => x.id === e.id) === i);
  const heroSlides: HeroSlide[] = [];
  for (let i = 0; i < 8 && heroSlides.length < 5; i++) {
    const e = heroEvents[i];
    if (e) heroSlides.push({ image: e.imgUrl, badge: "인기 문화행사", title: e.title, sub: [e.area, e.place].filter(Boolean).join(" · "), href: `/event/${e.id}` });
    const p = sample[i];
    if (heroSlides.length < 5 && p) heroSlides.push({ image: p.image, badge: "인기 나들이 명소", title: p.title, sub: p.area, href: `/places/spot/${p.id}` });
  }

  const campImg = camps[0]?.image;
  const popupPicks = slimForClient(
    [...getWeekend()].filter((e) => FREEISH.has(e.priceType) && e.imgUrl).sort((a, b) => b.featuredScore - a.featuredScore).slice(0, 5)
  );

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <BigEventModal events={popupPicks} />

      {/* 히어로 — 이번 주말 추천 */}
      <div className="mx-auto w-full max-w-[1280px] pt-4 sm:pt-5">
        <div className="mb-3 px-5 sm:px-6 lg:px-8">
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-ink sm:text-[24px]">
            이번 주말 <span className="text-free">뭐하지?</span>
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-faint sm:text-[14px]">전국 무료 행사·나들이·캠핑을 매일 새로 골라드려요</p>
        </div>
        <HeroCarousel slides={heroSlides} />
      </div>

      {/* 프로모션 띠 */}
      <Band tone="white" border={false} innerClassName="pt-4 sm:pt-5">
        <Link href="/free" className="flex items-center justify-between gap-3 rounded-2xl bg-freelight px-5 py-3.5 transition hover:bg-[#dcf5e7]">
          <span className="flex items-center gap-2 text-[13.5px] font-bold text-freedark sm:text-[15px]">
            <Icon name="ticket" size={18} />
            오늘 무료로 즐기는 문화행사 <span className="tabular-nums">{freeTodayCount.toLocaleString()}</span>건
          </span>
          <span className="shrink-0 text-[13px] font-bold text-free">바로 확인 →</span>
        </Link>
      </Band>

      {/* 테마별 찾기 (아이콘 진입) */}
      <Band tone="white" border={false} innerClassName="py-6 sm:py-7">
        <div id="quick-entry" className="scroll-mt-28">
          <SectionHead title="테마별 찾기" desc="원하는 방식을 누르고 지역·조건을 골라보세요" />
          <div className="mt-3">
            <QuickEntry seasonLabel={s.label} seasonIconName={seasonIcon(s.key)} seasonTerms={s.terms} dateThemes={dateThemes} />
          </div>
        </div>
      </Band>

      {/* 이번 주말 인기 명소 */}
      <CardSection tone="panel" title="이번 주말 인기 나들이 명소" desc="아이와 가기 좋은 전국 가볼만한 곳" href="/places" moreLabel="나들이 전체">
        <ScrollRail ariaLabel="이번 주말 인기 나들이 명소">
          {weekendSpots.map((p) => (
            <div key={p.id} className={RAIL_SPOT}><TourCard spot={p} /></div>
          ))}
        </ScrollRail>
      </CardSection>

      {/* 이번 주말 무료 행사 */}
      {weekendFree.length > 0 && (
        <CardSection tone="white" title="이번 주말 무료 전시·공연" desc="입장료 없이 즐기는 주말 문화행사" href="/free" moreLabel="무료 전체">
          <ScrollRail ariaLabel="이번 주말 무료 전시·공연">
            {weekendFree.map((ev: CultureEvent) => (
              <div key={ev.id} className={RAIL_POSTER}><PosterCard ev={ev} /></div>
            ))}
          </ScrollRail>
        </CardSection>
      )}

      {/* 곧 종료되는 행사 */}
      {endingSoon.length > 0 && (
        <CardSection tone="panel" title="곧 종료되는 문화행사" desc="놓치기 전에 지금 확인하세요" href="/ending-soon" moreLabel="마감임박 전체">
          <ScrollRail ariaLabel="곧 종료되는 문화행사">
            {endingSoon.map((ev: CultureEvent) => (
              <div key={ev.id} className={RAIL_POSTER}><PosterCard ev={ev} /></div>
            ))}
          </ScrollRail>
        </CardSection>
      )}

      {/* 지역별 인기 (내부 링크 강화) */}
      <Band tone="white" innerClassName="py-7 sm:py-8">
        <SectionHead title="지역별 인기 나들이" desc="우리 동네 가볼만한 곳부터 찾아보세요" href="/places" moreLabel="전체 지역" />
        <div className="mt-4 flex flex-wrap gap-2">
          {SIDO_LIST.map((sido) => (
            <Link
              key={sido}
              href={`/places/${(SIDO_SLUG as Record<string, string>)[sido]}`}
              className="rounded-full border border-line bg-white px-4 py-2 text-[13.5px] font-bold text-ink-soft transition hover:border-free hover:bg-tint hover:text-free"
            >
              {sido} 나들이
            </Link>
          ))}
        </div>
      </Band>

      {/* 캠핑 추천 (신규 섹션) */}
      {camps.length > 0 && (
        <CardSection tone="panel" title="전국 인기 캠핑장" desc="숲·계곡·바다, 반려동물 동반까지" href="/camping" moreLabel="캠핑 전체">
          <ScrollRail ariaLabel="전국 인기 캠핑장">
            {camps.map((c) => (
              <div key={c.id} className={RAIL_SPOT}><CampCard camp={c} /></div>
            ))}
          </ScrollRail>
        </CardSection>
      )}

      {/* 카테고리 3대 */}
      <Band tone="white" innerClassName="py-7 sm:py-8">
        <SectionHead title="무엇을 찾고 있나요?" desc="문화행사 · 나들이 · 캠핑 전국 정보를 한 곳에서" />
        <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
          <CategoryCard href="/events" icon="ticket" title="문화행사" count={`${all.length.toLocaleString()}건`} sub="전시·공연" image={getFeatured(1)[0]?.imgUrl} />
          <CategoryCard href="/places" icon="mountain" title="나들이" count={`${placeCount.toLocaleString()}곳`} sub="가볼만한 곳" image={sample[0]?.image} />
          <CategoryCard href="/camping" icon="tent" title="캠핑" count={`${campCount.toLocaleString()}곳`} sub="전국 캠핑장" image={campImg} />
        </div>
      </Band>

      {/* 많이 찾는 나들이 TOP */}
      {topSpots.length >= 5 && (
        <Band tone="panel" innerClassName="py-7 sm:py-8">
          <SectionHead title="많이 찾는 나들이 TOP 5" desc="지금 인기 있는 전국 명소" href="/places" moreLabel="전체 보기" />
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
            {topSpots.map((p, i) => (
              <RankCard key={p.id} spot={p} rank={i + 1} />
            ))}
          </div>
        </Band>
      )}

      {/* FAQ */}
      <Band tone="white" innerClassName="py-8 sm:py-10">
        <SectionHead title="자주 묻는 질문" desc="주말 나들이·무료 행사, 이렇게 찾으세요" />
        <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-bold text-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="shrink-0 text-ink-faint transition group-open:rotate-180">▾</span>
              </summary>
              <p className="mt-2 text-[14px] leading-[1.7] text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </Band>
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

function CategoryCard({ href, icon, title, count, sub, image }: { href: string; icon: IconName; title: string; count: string; sub: string; image?: string }) {
  return (
    <Link href={href} className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-2xl bg-neutral-800 p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-cardhover sm:aspect-[4/3]">
      {image ? (
        <Image src={image} alt={`${title} 대표 이미지`} fill sizes="(max-width:640px) 33vw, 300px" className="object-cover opacity-70 transition duration-500 group-hover:scale-[1.05]" unoptimized />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-free/80 to-freedark" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
      <div className="relative">
        <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm">
          <Icon name={icon} size={20} />
        </span>
        <div className="text-[16px] font-black text-white sm:text-[18px]">{title}</div>
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
