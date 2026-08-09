import type { Metadata } from "next";
import Link from "next/link";
import FingerRoulette from "@/components/FingerRoulette";
import GameShare from "@/components/GameShare";
import SoundToggle from "@/components/SoundToggle";

export const metadata: Metadata = {
  title: "손가락 룰렛 — 손가락 올리면 한 명 지목 (무료 벌칙 게임)",
  description:
    "다 같이 화면에 손가락을 올리면 3초 뒤 랜덤으로 한 명을 지목! 휴대폰 하나로 즐기는 무료 손가락 룰렛(터치 룰렛). 회식·술자리 벌칙, 편 가르기, 순서 정하기에 딱.",
  keywords: ["손가락 룰렛", "터치 룰렛", "손가락 게임", "벌칙 게임", "복불복", "술자리 게임", "편 가르기", "순서 정하기"],
  alternates: { canonical: "/game/finger" },
};

const jsonLd = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "손가락 룰렛",
  applicationCategory: "GameApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function FingerPage() {
  return (
    <div className="min-h-screen bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(177,75,255,0.22),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(0,229,255,0.14),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-[12.5px] text-white/40">
            <Link href="/game" className="hover:text-fuchsia-300">← 독박게임</Link>
            <span>›</span><span>손가락 룰렛</span>
          </nav>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <GameShare label="🔗 손가락룰렛 공유하기" text="👆 다 같이 손가락 올리면 한 명 지목! 무료 손가락 룰렛" />
          </div>
        </div>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">👆 손가락 룰렛</h1>
        <p className="mt-1 text-[14px] text-white/60">다 같이 손가락을 올리면 3초 뒤 <b className="text-white">랜덤으로 한 명 지목!</b> 휴대폰 하나로 바로.</p>

        <div className="mt-6"><FingerRoulette /></div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · 2명 이상이 화면에 손가락을 대고 있으면 3초 카운트다운 후 한 명이 💀로 지목돼요. 지목된 사람이 벌칙 독박! (모바일 멀티터치 지원)
          <Link href="/game/reaction" className="ml-2 font-bold text-lime-300 hover:underline">반응속도 대결도 →</Link>
        </div>
      </div>
    </div>
  );
}
