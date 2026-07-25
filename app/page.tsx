import Link from "next/link";
import type { Metadata } from "next";
import { getAllEvents, getWeekend, getNow, getFree, slimForClient } from "@/lib/data";
import { getKidTours, getPlaceCount, getTourAreaCounts, slimTours } from "@/lib/tour";
import { todayYmd } from "@/lib/dates";
import PosterCard from "@/components/PosterCard";
import TourCard from "@/components/TourCard";
import BigEventModal from "@/components/BigEventModal";
import { Band, Container } from "@/components/Band";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE.name} · 이번 주말 갈 만한 전국 무료·저렴 문화행사`,
  description: SITE.description,
  alternates: { canonical: "/" },
};

const isFreeish = (t: string) =>
  t === "free" || t === "free_estimated" || t === "partial_free";

export default function HomePage() {
  const all = getAllEvents();

  const todayFree = getNow().filter((e) => isFreeish(e.priceType)).length;
  const weekendCount = getWeekend().length;
  const placeCount = getPlaceCount();
  const placeAreas = getTourAreaCounts().length;

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

      {/* 히어로 + 대분류 2버튼 */}
      <Band tone="tint" innerClassName="py-6 sm:py-8">
        <h1 className="text-center text-[26px] font-black leading-[1.15] tracking-[-0.02em] text-ink sm:text-[34px]">
          주말에 <span className="text-free">뭐하지?</span>
        </h1>
        <p className="mt-1.5 text-center text-[14px] font-semibold text-ink-soft sm:text-[15px]">
          전국 <b className="text-free">무료·저렴 문화행사</b>와{" "}
          <b className="text-free">아이와 가볼만한 곳</b>을 매일 새로 모았어요
        </p>

        {/* 최상위: 대분류 2개 */}
        <div className="mx-auto mt-5 grid max-w-[640px] grid-cols-2 gap-3">
          <CategoryButton
            href="/events"
            emoji="🎭"
            title="문화행사"
            sub={`전시·공연·축제 ${all.length.toLocaleString()}건`}
          />
          <CategoryButton
            href="/places"
            emoji="🏞️"
            title="가볼만한 곳"
            sub={`나들이 명소 ${placeCount.toLocaleString()}곳`}
          />
        </div>

        {/* 빠른 지표 */}
        <div className="mx-auto mt-3 flex max-w-[640px] gap-2.5">
          <SummaryChip label="오늘 무료" value={todayFree} href="/free" accent />
          <SummaryChip label="이번 주말" value={weekendCount} href="/weekend" />
          <SummaryChip label="관광 지역" value={placeAreas} href="/places" />
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
        title="가볼만한 곳"
        desc="박물관·과학관·체험 등 아이와 나들이하기 좋은 곳"
        href="/places"
        moreLabel={`가볼만한 곳 전체 보기 (${placeCount.toLocaleString()}곳)`}
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
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-1 rounded-2xl border border-line bg-white px-4 py-5 text-center shadow-card transition hover:-translate-y-0.5 hover:border-free hover:shadow-cardhover"
    >
      <span className="text-[30px] leading-none">{emoji}</span>
      <span className="mt-1 text-[17px] font-black text-ink group-hover:text-free">{title}</span>
      <span className="text-[12px] font-semibold text-ink-faint">{sub}</span>
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

function SummaryChip({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: number;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex flex-1 items-center justify-between gap-2 rounded-xl border bg-white px-3.5 py-2 transition hover:shadow-card",
        "sm:flex-col sm:items-center sm:justify-center sm:text-center",
        accent ? "border-free/30 hover:border-free" : "border-line hover:border-ink/30",
      ].join(" ")}
    >
      <span className="text-[11px] font-semibold text-ink-faint">{label} ›</span>
      <span
        className={[
          "text-[20px] font-black leading-none tabular-nums",
          accent ? "text-free" : "text-ink",
        ].join(" ")}
      >
        {value.toLocaleString()}
      </span>
    </Link>
  );
}
