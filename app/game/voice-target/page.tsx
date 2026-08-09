import type { Metadata } from "next";
import Link from "next/link";
import VoiceTargetGame from "@/components/VoiceTargetGame";
import GameShare from "@/components/GameShare";
import SoundToggle from "@/components/SoundToggle";

export const metadata: Metadata = {
  title: "목표 데시벨 맞히기 — 근사치 승부 벌칙 (무료, 최대 10명)",
  description:
    "랜덤으로 뽑힌 목표 데시벨(근사치)에 목소리 크기를 맞히는 게임! 한 명씩 도전해 결과를 숨겨 저장하고, 마지막에 오픈. 목표에 가장 가까운 사람이 승리, 제일 먼 사람이 독박. 무료.",
  keywords: ["데시벨 게임", "목표 데시벨", "목소리 크기 게임", "데시벨 맞히기", "벌칙 게임", "복불복", "술자리 게임", "소리 게임"],
  alternates: { canonical: "/game/voice-target" },
};

const jsonLd = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "목표 데시벨 맞히기",
  applicationCategory: "GameApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function VoiceTargetPage() {
  return (
    <div className="min-h-screen bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(255,176,32,0.2),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(255,82,82,0.13),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-[12.5px] text-white/40">
            <Link href="/game" className="hover:text-amber-300">← 독박게임</Link>
            <span>›</span><span>목표 데시벨 맞히기</span>
          </nav>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <GameShare label="🔗 데시벨맞히기 공유하기" text="🎯 랜덤 목표 데시벨에 목소리 맞히기! 제일 근사치가 승리, 제일 먼 사람 독박. 무료" />
          </div>
        </div>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">🎯 목표 데시벨 맞히기</h1>
        <p className="mt-1 text-[14px] text-white/60">랜덤 <b className="text-white">목표 데시벨</b>(참고 안내 포함)에 목소리를 맞혀요. 결과는 숨겨 저장 → 마지막에 오픈! <b className="text-white">가장 근사치가 승리, 제일 먼 사람 독박.</b></p>

        <div className="mt-6"><VoiceTargetGame /></div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · ‘마이크 켜기’ 후 시작하면 랜덤 목표 데시벨과 “이 정도 크기예요” 안내가 떠요. 한 명씩 목표에 맞춰 소리 내면 결과가 <b className="text-white">숨겨져 저장</b>돼요(서로 안 보임). 마지막 사람까지 끝나면 결과 오픈 → 목표에 <b className="text-white">가장 가까운 사람이 승리, 제일 먼 사람이 독박!</b>
          <br /><span className="text-white/40">※ 마이크 감도가 기기마다 달라 데시벨은 상대 비교용 근사치예요. 소리는 측정에만 쓰이고 저장·전송되지 않아요.</span>
          <Link href="/game/voice" className="ml-2 font-bold text-rose-300 hover:underline">데시벨 배틀도 →</Link>
        </div>
      </div>
    </div>
  );
}
