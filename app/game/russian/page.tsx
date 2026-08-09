import type { Metadata } from "next";
import Link from "next/link";
import RussianRoulette from "@/components/RussianRoulette";
import GameShare from "@/components/GameShare";
import SoundToggle from "@/components/SoundToggle";

export const metadata: Metadata = {
  title: "러시안룰렛 게임 — 불발이면 벌칙 (무료, 최대 10명)",
  description:
    "N명이면 N-1발 장전! 순서대로 방아쇠를 당기다 총알이 안 나가는(불발) 한 명이 독박. 실린더를 돌려 섞고 여러 번 즐기는 무료 러시안룰렛 벌칙 게임. 설치·회원가입 없이 바로.",
  keywords: ["러시안룰렛", "러시안 룰렛 게임", "벌칙 게임", "복불복", "술자리 게임", "회식 벌칙", "스릴 게임", "랜덤 뽑기"],
  alternates: { canonical: "/game/russian" },
};

const jsonLd = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "러시안룰렛 게임",
  applicationCategory: "GameApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function RussianPage() {
  return (
    <div className="min-h-screen bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(255,82,82,0.2),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(120,0,60,0.2),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-[12.5px] text-white/40">
            <Link href="/game" className="hover:text-rose-300">← 독박게임</Link>
            <span>›</span><span>러시안룰렛</span>
          </nav>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <GameShare label="🔗 러시안룰렛 공유하기" text="🔫 총알이 안 나가는 사람이 독박! 실린더 돌려 섞는 무료 러시안룰렛" />
          </div>
        </div>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">🔫 러시안룰렛</h1>
        <p className="mt-1 text-[14px] text-white/60">순서대로 방아쇠를 당기다 <b className="text-white">총알이 안 나가는(불발) 한 명이 독박!</b> 실린더를 돌려 섞어요. 최대 10명.</p>

        <div className="mt-6"><RussianRoulette /></div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · N명이면 N-1발 장전(빈 약실 1개). ‘실린더 장전·돌리기’로 빈 약실을 섞고, 순서대로 방아쇠를 당겨요. ‘탕!’이 나면 세이프, <b className="text-white">불발(찰칵)되는 사람이 벌칙 독박!</b> 몇 번이고 다시 돌릴 수 있어요.
          <Link href="/game/bust" className="ml-2 font-bold text-amber-300 hover:underline">버스트 21도 →</Link>
        </div>
      </div>
    </div>
  );
}
