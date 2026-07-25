import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllEvents, getWeekend, getNow, slimForClient } from "@/lib/data";
import DateBrowser from "@/components/DateBrowser";
import BigEventModal from "@/components/BigEventModal";
import { Band } from "@/components/Band";
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
  const events = slimForClient(all);

  const todayFree = getNow().filter((e) => isFreeish(e.priceType)).length;
  const weekendCount = getWeekend().length;

  const popup = [...getWeekend()]
    .filter((e) => isFreeish(e.priceType) && e.imgUrl)
    .sort((a, b) => b.featuredScore - a.featuredScore)
    .slice(0, 5);
  const popupPicks = slimForClient(popup);

  return (
    <>
      <BigEventModal events={popupPicks} />

      {/* 히어로 (컴팩트, 연한 그린 틴트 띠) */}
      <Band tone="tint" innerClassName="flex flex-wrap items-center justify-between gap-4 py-6 sm:py-7">
        <div>
          <h1 className="text-[26px] font-black leading-[1.1] tracking-[-0.02em] text-ink sm:text-[32px]">
            이번 주말, <span className="text-free">뭐하지?</span>
          </h1>
          <p className="mt-1 text-[14px] font-semibold text-ink-soft sm:text-[15px]">
            무료로·저렴하게 즐기는 전국 문화생활
          </p>
        </div>
        <div className="flex gap-2">
          <SummaryChip label="오늘 무료" value={todayFree} href="/free" accent />
          <SummaryChip label="이번 주말" value={weekendCount} href="/weekend" />
        </div>
      </Band>

      {/* 날짜 중심 브라우저 (달력 흰 띠 + 목록 회색 띠) */}
      <Suspense fallback={null}>
        <DateBrowser events={events} />
      </Suspense>
    </>
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
        "rounded-xl border px-3.5 py-2 text-center transition hover:shadow-card",
        accent ? "border-free/30 bg-white hover:border-free" : "border-line bg-white hover:border-ink/30",
      ].join(" ")}
    >
      <div className="text-[11px] font-semibold text-ink-faint">{label} ›</div>
      <div
        className={[
          "text-[18px] font-black tabular-nums",
          accent ? "text-free" : "text-ink",
        ].join(" ")}
      >
        {value.toLocaleString()}
      </div>
    </Link>
  );
}
