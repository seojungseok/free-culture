import type { Metadata } from "next";
import Link from "next/link";
import StopBarGame from "@/components/StopBarGame";
import GameShare from "@/components/GameShare";
import SoundToggle from "@/components/SoundToggle";

export const metadata: Metadata = {
  title: "멈춰! 바 스톱 — 타이밍 정확도 벌칙 게임 (무료, 최대 10명)",
  description:
    "좌우로 빠르게 움직이는 바늘을 한가운데 과녁에 정확히 멈추는 타이밍 게임! 모두 같은 조건으로 도전해 가장 부정확한 사람이 독박. 순수 실력 승부의 무료 참여형 벌칙 게임, 최대 10명.",
  keywords: ["타이밍 게임", "멈추기 게임", "정확도 게임", "바 스톱", "벌칙 게임", "복불복", "술자리 게임", "회식 벌칙"],
  alternates: { canonical: "/game/stop" },
};

const jsonLd = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "멈춰! 바 스톱",
  applicationCategory: "GameApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function StopPage() {
  return (
    <div className="min-h-screen bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(0,255,157,0.18),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(0,229,255,0.13),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-[12.5px] text-white/40">
            <Link href="/game" className="hover:text-emerald-300">← 독박게임</Link>
            <span>›</span><span>멈춰! 바 스톱</span>
          </nav>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <GameShare label="🔗 바스톱 공유하기" text="🎯 움직이는 바늘을 과녁에 딱 멈추기! 제일 부정확하면 독박. 순수 실력 무료 타이밍 게임" />
          </div>
        </div>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">🎯 멈춰! 바 스톱</h1>
        <p className="mt-1 text-[14px] text-white/60">좌우로 빠르게 움직이는 바늘을 <b className="text-white">한가운데 과녁에 정확히 멈춰요.</b> 모두 같은 조건, <b className="text-white">가장 부정확한 사람이 독박!</b> 최대 10명.</p>

        <div className="mt-6"><StopBarGame /></div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · 인원·이름을 입력하고 시작 → 한 명씩 ‘시작’을 누르면 바늘이 좌우로 왕복해요. 한가운데 과녁(🎯)에 가장 가깝게 ‘멈춰!’를 눌러요. 정확도(100점 만점)로 순위를 매겨 <b className="text-white">가장 부정확한 사람이 벌칙 독박!</b> 순서 운 없이 모두 같은 조건이에요.
          <Link href="/game/reaction" className="ml-2 font-bold text-lime-300 hover:underline">반응속도 대결도 →</Link>
        </div>
      </div>
    </div>
  );
}
