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
        <p className="mt-1 text-[14px] text-white/60">총알 1발, 순서대로 방아쇠를 당기다 <b className="text-white">총알 든 약실을 당긴 한 명이 독박!</b> 당기기 전 <b className="text-white">실린더를 돌려</b> 총알 위치를 섞을 수 있어요. 최대 10명.</p>

        <div className="mt-6"><RussianRoulette /></div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · 리볼버에 총알 1발. 자기 차례엔 <b className="text-white">방아쇠를 반드시 당겨야</b> 해요(찰칵=세이프, 총알=독박). 당기기 전에 원하면 <b className="text-white">실린더 돌리기</b>로 총알 위치를 랜덤으로 섞을 수 있어요 — 원래 걸릴 차례여도 돌려서 운 좋게 넘어갈 수도, 그대로 걸릴 수도 있죠. 순수 랜덤이라 <b className="text-white">누구에게나 공평</b>해요.
          <Link href="/game/tap" className="ml-2 font-bold text-orange-300 hover:underline">연타 대결도 →</Link>
        </div>
      </div>
    </div>
  );
}
