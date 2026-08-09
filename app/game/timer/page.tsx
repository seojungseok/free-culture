import type { Metadata } from "next";
import Link from "next/link";
import TimerStopGame from "@/components/TimerStopGame";
import GameShare from "@/components/GameShare";
import SoundToggle from "@/components/SoundToggle";

export const metadata: Metadata = {
  title: "근접 타이머 게임 — 5초·10초 맞추기 벌칙 (무료, 최대 10명)",
  description:
    "목표 시간을 정하고 시작! 숨겨진 타이머를 5초·10초에 가장 가깝게 멈춰요. 목표에서 가장 멀리 빗나간 사람이 독박. 감으로 승부하는 무료 타이머 벌칙 게임, 최대 10명.",
  keywords: ["타이머 게임", "5초 게임", "10초 게임", "시간 맞추기", "벌칙 게임", "복불복", "술자리 게임", "회식 벌칙"],
  alternates: { canonical: "/game/timer" },
};

const jsonLd = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "근접 타이머 게임",
  applicationCategory: "GameApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function TimerPage() {
  return (
    <div className="min-h-screen bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(0,229,255,0.2),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(166,255,0,0.12),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-[12.5px] text-white/40">
            <Link href="/game" className="hover:text-cyan-300">← 독박게임</Link>
            <span>›</span><span>근접 타이머</span>
          </nav>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <GameShare label="🔗 타이머게임 공유하기" text="⏱ 5초·10초에 가장 가깝게 멈추기! 빗나가면 독박, 무료 근접 타이머 게임" />
          </div>
        </div>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">⏱️ 근접 타이머 게임</h1>
        <p className="mt-1 text-[14px] text-white/60">목표 시간(예: 5초)에 <b className="text-white">가장 가깝게 멈추기!</b> 가장 멀리 빗나간 사람이 독박. 최대 10명.</p>

        <div className="mt-6"><TimerStopGame /></div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · 목표 시간(3·5·7·10초)과 이름을 정하고 시작 → 한 명씩 ‘시작’ 후 타이머(숫자 숨김)를 목표에 맞춰 ‘멈춰!’. 목표에서 가장 많이 벗어난 사람이 벌칙 독박!
          <Link href="/game/bottle" className="ml-2 font-bold text-emerald-300 hover:underline">병 돌리기도 →</Link>
        </div>
      </div>
    </div>
  );
}
