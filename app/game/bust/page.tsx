import type { Metadata } from "next";
import Link from "next/link";
import BustGame from "@/components/BustGame";
import GameShare from "@/components/GameShare";
import SoundToggle from "@/components/SoundToggle";

export const metadata: Metadata = {
  title: "버스트 21 — 합이 21 넘으면 벌칙 (무료, 최대 10명)",
  description:
    "한 명씩 카드를 뽑아 합을 쌓다가, 합이 21을 넘기는 순간 그 사람이 독박! 숫자가 차오를수록 조여오는 스릴의 무료 카드 벌칙 게임. 회식·술자리 복불복에 딱, 최대 10명.",
  keywords: ["버스트 게임", "21 게임", "블랙잭 벌칙", "카드 게임", "벌칙 게임", "복불복", "술자리 게임", "스릴 게임"],
  alternates: { canonical: "/game/bust" },
};

const jsonLd = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "버스트 21",
  applicationCategory: "GameApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function BustPage() {
  return (
    <div className="min-h-screen bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(255,176,32,0.2),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(255,46,136,0.13),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-[12.5px] text-white/40">
            <Link href="/game" className="hover:text-amber-300">← 독박게임</Link>
            <span>›</span><span>버스트 21</span>
          </nav>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <GameShare label="🔗 버스트21 공유하기" text="🎴 합이 21 넘기면 독박! 차오를수록 조여오는 무료 버스트 21" />
          </div>
        </div>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">🎴 버스트 21</h1>
        <p className="mt-1 text-[14px] text-white/60">한 명씩 카드를 뽑아 합을 쌓다가 <b className="text-white">21을 넘기는 사람이 독박!</b> 뒤로 갈수록 조여오는 스릴. 최대 10명.</p>

        <div className="mt-6"><BustGame /></div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · 인원·이름을 입력하고 시작 → 한 명씩 카드(1~11)를 뽑아 합을 쌓아요. 합이 <b className="text-white">21을 넘기는 순간</b> 그 사람이 벌칙 독박! 21에 가까울수록 심장이 쫄깃해져요.
          <Link href="/game/russian" className="ml-2 font-bold text-rose-300 hover:underline">러시안룰렛도 →</Link>
        </div>
      </div>
    </div>
  );
}
