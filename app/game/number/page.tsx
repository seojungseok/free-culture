import type { Metadata } from "next";
import Link from "next/link";
import NumberBombGame from "@/components/NumberBombGame";
import GameShare from "@/components/GameShare";
import SoundToggle from "@/components/SoundToggle";

export const metadata: Metadata = {
  title: "숫자 폭탄 — 목표 숫자 근접 벌칙 게임 (무료, 최대 10명)",
  description:
    "각자 1~3 중 원하는 수를 정하고, 합의한 목표 숫자까지 순서대로 합이 차근차근 올라가요. 합이 목표를 넘는 순간 가장 근접한 사람이 독박! 과정을 눈으로 보며 조마조마한 무료 숫자 벌칙 게임.",
  keywords: ["숫자 폭탄", "숫자 게임", "목표 숫자 게임", "벌칙 게임", "복불복", "술자리 게임", "회식 벌칙", "카운트 게임"],
  alternates: { canonical: "/game/number" },
};

const jsonLd = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "숫자 폭탄",
  applicationCategory: "GameApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function NumberPage() {
  return (
    <div className="min-h-screen bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(255,176,32,0.2),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(255,46,136,0.13),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-[12.5px] text-white/40">
            <Link href="/game" className="hover:text-amber-300">← 독박게임</Link>
            <span>›</span><span>숫자 폭탄</span>
          </nav>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <GameShare label="🔗 숫자폭탄 공유하기" text="🔢 각자 1~3 정하고 목표 숫자까지! 넘는 순간 가장 근접한 사람이 독박. 무료 숫자 폭탄" />
          </div>
        </div>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">🔢 숫자 폭탄</h1>
        <p className="mt-1 text-[14px] text-white/60">각자 1~3 중 원하는 수를 정하고, 목표까지 순서대로 합이 차근차근 올라가요. <b className="text-white">합이 목표를 넘는 순간, 가장 근접한 사람이 독박!</b> 최대 10명.</p>

        <div className="mt-6"><NumberBombGame /></div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · 목표 숫자(합의로 20~50)와 각자 더할 숫자(1~3)를 정하고 시작 → 1번부터 순서대로 자기 숫자를 더하며 합이 올라가요(눈으로 보며 조마조마!). 합이 목표를 넘는 순간, <b className="text-white">목표에 가장 가까운 사람이 벌칙 독박!</b> 어떤 숫자를 고를지가 눈치 싸움이에요.
          <Link href="/game/memory" className="ml-2 font-bold text-violet-300 hover:underline">기억력 순서도 →</Link>
        </div>
      </div>
    </div>
  );
}
