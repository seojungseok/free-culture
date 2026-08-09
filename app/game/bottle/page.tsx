import type { Metadata } from "next";
import Link from "next/link";
import BottleGame from "@/components/BottleGame";
import GameShare from "@/components/GameShare";
import SoundToggle from "@/components/SoundToggle";

export const metadata: Metadata = {
  title: "병 돌리기 — 가리킨 사람이 벌칙 (무료, 최대 10명)",
  description:
    "가운데 병을 돌리면 한 명을 가리키며 멈춰요. 병이 가리킨 사람이 독박! 순서·벌칙 정할 때 딱 좋은 무료 병 돌리기 게임(스핀 더 보틀). 설치·회원가입 없이 바로, 최대 10명.",
  keywords: ["병 돌리기", "스핀 더 보틀", "벌칙 게임", "복불복", "술자리 게임", "회식 벌칙", "순서 정하기", "랜덤 뽑기"],
  alternates: { canonical: "/game/bottle" },
};

const jsonLd = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "병 돌리기",
  applicationCategory: "GameApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function BottlePage() {
  return (
    <div className="min-h-screen bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(0,255,157,0.18),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(0,229,255,0.13),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-[12.5px] text-white/40">
            <Link href="/game" className="hover:text-emerald-300">← 독박게임</Link>
            <span>›</span><span>병 돌리기</span>
          </nav>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <GameShare label="🔗 병돌리기 공유하기" text="🍾 병이 가리킨 사람이 독박! 무료 병 돌리기 게임" />
          </div>
        </div>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">🍾 병 돌리기</h1>
        <p className="mt-1 text-[14px] text-white/60">다 같이 <b className="text-white">터치로 횟수를 쌓고</b> 시작하면, 병이 그 횟수만큼 돌아 <b className="text-white">멈춘 곳의 사람이 독박!</b> 최대 10명.</p>

        <div className="mt-6"><BottleGame /></div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · 인원·이름을 입력하고 ‘병 준비’ → 다 같이 ‘터치 +1’로 원하는 만큼 횟수를 쌓아요(터치 카운트 표시). ‘시작’을 누르면 병이 그 횟수만큼 칸을 돌다 감속하며 멈춰요. 멈춘 곳의 사람이 벌칙 독박! 횟수가 달라지면 결과도 달라져요.
          <Link href="/game/timer" className="ml-2 font-bold text-cyan-300 hover:underline">근접 타이머도 →</Link>
        </div>
      </div>
    </div>
  );
}
