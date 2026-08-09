import type { Metadata } from "next";
import Link from "next/link";
import DiceGame from "@/components/DiceGame";
import GameShare from "@/components/GameShare";

export const metadata: Metadata = {
  title: "주사위 대결 — 최저 눈이 벌칙 (무료, 최대 10명)",
  description:
    "다 함께 주사위를 굴려 가장 낮은 눈이 나온 사람이 독박! 동점이면 자동 재대결. 회식·술자리 벌칙 정할 때 딱 좋은 무료 주사위 게임. 설치·회원가입 없이 바로.",
  keywords: ["주사위 게임", "주사위 대결", "온라인 주사위", "벌칙 게임", "복불복", "술자리 게임", "회식 벌칙", "랜덤 뽑기"],
  alternates: { canonical: "/game/dice" },
};

const jsonLd = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "주사위 대결",
  applicationCategory: "GameApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function DicePage() {
  return (
    <div className="min-h-screen bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(167,139,250,0.2),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(0,229,255,0.13),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-[12.5px] text-white/40">
            <Link href="/game" className="hover:text-violet-300">← 독박게임</Link>
            <span>›</span><span>주사위 대결</span>
          </nav>
          <GameShare label="🔗 주사위게임 공유하기" text="🎲 다 같이 굴려서 최저 눈이 독박! 동점은 자동 재대결. 무료 주사위 대결" />
        </div>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">🎲 주사위 대결</h1>
        <p className="mt-1 text-[14px] text-white/60">다 함께 굴려서 <b className="text-white">가장 낮은 눈이 나온 사람이 독박!</b> 동점은 자동 재대결. 최대 10명.</p>

        <div className="mt-6"><DiceGame /></div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · 인원과 이름을 입력 → ‘주사위 굴리기’ → 모두가 주사위를 굴려요. 가장 낮은 눈이 나온 사람이 벌칙 독박! 같은 최저값이 여럿이면 그들끼리 자동 재대결.
          <Link href="/game/pick" className="ml-2 font-bold text-amber-300 hover:underline">제비뽑기도 해보기 →</Link>
        </div>
      </div>
    </div>
  );
}
