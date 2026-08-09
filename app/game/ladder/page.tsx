import type { Metadata } from "next";
import Link from "next/link";
import LadderGame from "@/components/LadderGame";
import GameShare from "@/components/GameShare";
import SoundToggle from "@/components/SoundToggle";

export const metadata: Metadata = {
  title: "사다리타기 — 이름 넣고 벌칙 뽑기 (무료, 최대 10명)",
  description:
    "이름만 입력하면 사다리 완성! 쭉 내려와 벌칙 칸에 도착한 한 명이 독박. 회식·모임·내기 정할 때 딱 좋은 무료 사다리게임. 설치·회원가입 없이 바로.",
  keywords: ["사다리타기", "사다리게임", "벌칙 사다리", "제비뽑기", "랜덤 뽑기", "내기 정하기", "복불복"],
  alternates: { canonical: "/game/ladder" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "사다리타기",
  applicationCategory: "GameApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function LadderPage() {
  return (
    <div className="min-h-[85vh] bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(0,229,255,0.18),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(166,255,0,0.12),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-[12.5px] text-white/40">
            <Link href="/game" className="hover:text-cyan-300">← 독박게임</Link>
            <span>›</span><span>사다리타기</span>
          </nav>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <GameShare label="🔗 사다리게임 공유하기" text="🪜 이름 넣고 쭉쭉 내려와 벌칙 뽑기! 무료 사다리타기" />
          </div>
        </div>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">🪜 사다리타기</h1>
        <p className="mt-1 text-[14px] text-white/60">이름 적고 쭉~ 내려와 <b className="text-white">벌칙 칸에 도착한 한 명이 독박!</b> 최대 10명.</p>

        <div className="mt-6">
          <LadderGame />
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · 인원과 이름을 입력하고 ‘사다리 만들기’ → 이름을 눌러 사다리를 타면 도착 칸이 공개돼요. 벌칙 칸에 도착한 사람이 독박!
          <Link href="/game/roulette" className="ml-2 font-bold text-fuchsia-300 hover:underline">독박 룰렛도 해보기 →</Link>
        </div>
      </div>
    </div>
  );
}
