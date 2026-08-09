import type { Metadata } from "next";
import Link from "next/link";
import MissionRoulette from "@/components/MissionRoulette";
import GameShare from "@/components/GameShare";
import SoundToggle from "@/components/SoundToggle";

export const metadata: Metadata = {
  title: "벌칙 룰렛 — 랜덤 벌칙 뽑기 (순한맛·매운맛, 무료)",
  description:
    "누가 걸렸는지 정했다면 무슨 벌칙일지 돌려서 뽑기! 원샷·애교·노래·러브샷 등 랜덤 벌칙 룰렛. 순한맛·매운맛 선택. 회식·술자리 분위기 UP, 설치·회원가입 없이 무료.",
  keywords: ["벌칙 룰렛", "랜덤 벌칙", "벌칙 뽑기", "술자리 벌칙", "회식 게임", "복불복", "돌림판", "벌칙 정하기"],
  alternates: { canonical: "/game/mission" },
};

const jsonLd = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "벌칙 룰렛",
  applicationCategory: "GameApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function MissionPage() {
  return (
    <div className="min-h-screen bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(255,176,32,0.2),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(255,46,136,0.14),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-[12.5px] text-white/40">
            <Link href="/game" className="hover:text-amber-300">← 독박게임</Link>
            <span>›</span><span>벌칙 룰렛</span>
          </nav>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <GameShare label="🔗 벌칙룰렛 공유하기" text="🎡 원샷·애교·노래… 무슨 벌칙일지 돌려서 뽑기! 순한맛·매운맛 무료 벌칙 룰렛" />
          </div>
        </div>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">🎡 벌칙 룰렛</h1>
        <p className="mt-1 text-[14px] text-white/60">걸린 사람은 정했으니, <b className="text-white">무슨 벌칙일지</b> 돌려서 뽑아요! 순한맛·매운맛 선택.</p>

        <div className="mt-6"><MissionRoulette /></div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · 순한맛/매운맛을 고르고 ‘벌칙 돌리기’ → 룰렛이 멈춘 칸이 오늘의 벌칙! 룰렛·사다리로 걸린 사람에게 딱.
          <Link href="/game/roulette" className="ml-2 font-bold text-fuchsia-300 hover:underline">먼저 독박 정하러 가기 →</Link>
        </div>
      </div>
    </div>
  );
}
