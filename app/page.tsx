import Link from "next/link";
import type { Metadata } from "next";
import { getAllEvents, getWeekend, getFree, slimForClient } from "@/lib/data";
import { getKidTours, getPlaceCount, slimTours } from "@/lib/tour";
import { getCampCount } from "@/lib/camping";
import { todayYmd } from "@/lib/dates";
import PosterCard from "@/components/PosterCard";
import TourCard from "@/components/TourCard";
import BigEventModal from "@/components/BigEventModal";
import { Band, Container } from "@/components/Band";
import { SITE } from "@/lib/site";
import { season } from "@/lib/finder";
import QuickEntry from "@/components/QuickEntry";
import NearMe from "@/components/NearMe";

export const metadata: Metadata = {
  title: `${SITE.name} · 이번 주말 갈 만한 전국 무료·저렴 문화행사`,
  description: SITE.description,
  alternates: { canonical: "/" },
};

const isFreeish = (t: string) =>
  t === "free" || t === "free_estimated" || t === "partial_free";

export default function HomePage() {
  const all = getAllEvents();
  const placeCount = getPlaceCount();
  const campCount = getCampCount();
  const s = season();

  // 인기 검색어 — 대한민국 대표 명소(기본값). 검색 데이터 쌓이면 실제 인기어로 대체 예정.
  const popular = ["에버랜드", "경복궁", "해운대", "남산타워", "롯데월드", "국립중앙박물관", "전주한옥마을", "오션월드", "불국사", "한라산", "속초", "강릉", "남이섬", "글램핑", "벚꽃"];

  // 문화행사 미리보기 (무료 먼저, 진행 중/예정, 이미지 있는 것 14개 = 2줄)
  const today = todayYmd();
  const eventPreview = slimForClient(
    getFree(true)
      .filter((e) => e.imgUrl && e.endDate >= today)
      .slice(0, 14)
  );

  // 가볼만한 곳 미리보기 14개 = 2줄
  const placePreview = slimTours(getKidTours(undefined, 14));

  // 팝업 (주말 무료 큰 행사)
  const popupPicks = slimForClient(
    [...getWeekend()]
      .filter((e) => isFreeish(e.priceType) && e.imgUrl)
      .sort((a, b) => b.featuredScore - a.featuredScore)
      .slice(0, 5)
  );

  return (
    <>
      <BigEventModal events={popupPicks} />

      {/* 히어로 */}
      <Band tone="tint" innerClassName="py-6 sm:py-8">
        <h1 className="text-center text-[26px] font-black leading-[1.15] tracking-[-0.02em] text-ink sm:text-[34px]">
          주말에 <span className="text-free">뭐하지?</span>
        </h1>
        <p className="mt-1.5 text-center text-[14px] font-semibold text-ink-soft sm:text-[15px]">
          전국 <b className="text-free">문화행사·나들이·캠핑</b>, 무료로 저렴하게 즐기는 주말
        </p>
      </Band>

      {/* 내 주변 (위치 기반, 상단) */}
      <Band tone="white" innerClassName="py-6">
        <NearMe />
      </Band>

      {/* 빠른 진입 아이콘 — 전부 지역 기반 */}
      <Band tone="panel" innerClassName="py-6">
        <h2 className="text-[19px] font-extrabold tracking-tight text-ink sm:text-[21px]">⚡ 빠른 진입</h2>
        <p className="mt-0.5 text-[13px] text-ink-faint">아이콘을 누르고 지역을 고르면 바로 그 지역 결과로 가요.</p>
        <div className="mt-3">
          <QuickEntry seasonQuery={s.query} seasonLabel={s.label} seasonEmoji={s.emoji} />
        </div>
      </Band>

      {/* 큰 카드 3개 (유지) */}
      <Band tone="white" innerClassName="py-6">
        <div className="mx-auto grid max-w-[640px] grid-cols-3 gap-3">
          <CategoryButton href="/events" emoji="🎭" title="문화행사" sub={<>전시·공연 <span className="whitespace-nowrap">{all.length.toLocaleString()}건</span></>} />
          <CategoryButton href="/places" emoji="🏞️" title="나들이" sub={<>가볼만한 곳 <span className="whitespace-nowrap">{placeCount.toLocaleString()}곳</span></>} />
          <CategoryButton href="/camping" emoji="⛺" title="캠핑" sub={<>전국 캠핑장 <span className="whitespace-nowrap">{campCount.toLocaleString()}곳</span></>} />
        </div>
      </Band>

      {/* 계절 추천 (날짜 자동) */}
      <Band tone="panel" innerClassName="py-7">
        <h2 className="text-[19px] font-extrabold tracking-tight text-ink sm:text-[21px]">{s.emoji} {s.label} 추천</h2>
        <p className="mt-0.5 text-[13px] text-ink-faint">지금 계절에 딱 맞는 키워드로 골라보세요.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {s.terms.map((t) => (
            <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="rounded-full border border-line bg-white px-4 py-2 text-[14px] font-bold text-ink-soft transition hover:border-free/40 hover:text-free">{t}</Link>
          ))}
        </div>
      </Band>

      {/* 인기 검색어 */}
      <Band tone="white" innerClassName="py-7">
        <h2 className="text-[19px] font-extrabold tracking-tight text-ink sm:text-[21px]">🔥 인기 검색어</h2>
        <p className="mt-0.5 text-[13px] text-ink-faint">대한민국 대표 명소부터 시작해요.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {popular.map((p, i) => (
            <Link key={p} href={`/search?q=${encodeURIComponent(p)}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-[13.5px] font-semibold text-ink-soft transition hover:border-free/40 hover:text-free">
              <span className="text-[12px] font-black text-free">{i + 1}</span>{p}
            </Link>
          ))}
        </div>
      </Band>

      {/* 문화행사 미리보기 (2줄) */}
      <PreviewSection
        emoji="🎭"
        title="문화행사"
        desc="무료·저렴한 전시·공연을 먼저 보여드려요"
        href="/events"
        moreLabel={`문화행사 전체 보기 (${all.length.toLocaleString()}건)`}
        tone="white"
      >
        <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-7 preview-2rows">
          {eventPreview.map((ev, i) => (
            <PosterCard key={ev.id} ev={ev} priority={i < 6} />
          ))}
        </div>
      </PreviewSection>

      {/* 가볼만한 곳 미리보기 (2줄) */}
      <PreviewSection
        emoji="🏞️"
        title="나들이"
        desc="박물관·과학관·체험 등 아이와 나들이하기 좋은 곳"
        href="/places"
        moreLabel={`나들이 명소 전체 보기 (${placeCount.toLocaleString()}곳)`}
        tone="panel"
      >
        <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-7 preview-2rows">
          {placePreview.map((s) => (
            <TourCard key={s.id} spot={s} />
          ))}
        </div>
      </PreviewSection>
    </>
  );
}

function CategoryButton({
  href,
  emoji,
  title,
  sub,
}: {
  href: string;
  emoji: string;
  title: string;
  sub: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-1 rounded-2xl border border-line bg-white px-3 py-5 text-center shadow-card transition hover:-translate-y-0.5 hover:border-free hover:shadow-cardhover"
    >
      <span className="text-[30px] leading-none">{emoji}</span>
      <span className="mt-1 text-[16px] font-black text-ink group-hover:text-free sm:text-[17px]">{title}</span>
      <span className="text-[12px] font-semibold leading-tight text-ink-faint">{sub}</span>
      <span className="mt-0.5 text-[12px] font-bold text-free">바로가기 →</span>
    </Link>
  );
}

function PreviewSection({
  emoji,
  title,
  desc,
  href,
  moreLabel,
  tone,
  children,
}: {
  emoji: string;
  title: string;
  desc: string;
  href: string;
  moreLabel: string;
  tone: "white" | "panel";
  children: React.ReactNode;
}) {
  return (
    <Band tone={tone} innerClassName="py-7">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[19px] font-extrabold tracking-tight text-ink sm:text-[21px]">
            {emoji} {title}
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-faint">{desc}</p>
        </div>
        <Link
          href={href}
          className="shrink-0 whitespace-nowrap rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-bold text-ink-soft transition hover:border-free/40 hover:text-free"
        >
          전체 보기 →
        </Link>
      </div>
      {children}
      <div className="mt-6 flex justify-center">
        <Link
          href={href}
          className="rounded-full bg-ink px-7 py-3 text-sm font-bold text-white transition hover:bg-black"
        >
          {moreLabel} →
        </Link>
      </div>
    </Band>
  );
}

