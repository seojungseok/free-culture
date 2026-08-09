import type { Metadata } from "next";
import Link from "next/link";
import VoiceGame from "@/components/VoiceGame";
import GameShare from "@/components/GameShare";
import SoundToggle from "@/components/SoundToggle";

export const metadata: Metadata = {
  title: "데시벨 배틀 — 목소리 크기 대결 벌칙 (무료, 최대 10명)",
  description:
    "마이크로 목소리 크기를 재는 데시벨(근사치) 측정 게임! 한 명씩 3초간 소리 지르고, 가장 작게 지른 사람이 독박. 회식·술자리 벌칙, 소리 지르기 대결에 딱. 설치·회원가입 없이 무료.",
  keywords: ["데시벨 게임", "목소리 크기 게임", "소리 지르기 게임", "데시벨 측정", "벌칙 게임", "복불복", "술자리 게임", "회식 벌칙"],
  alternates: { canonical: "/game/voice" },
};

const jsonLd = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "데시벨 배틀",
  applicationCategory: "GameApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function VoicePage() {
  return (
    <div className="min-h-screen bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(255,82,82,0.2),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(255,176,32,0.14),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-[12.5px] text-white/40">
            <Link href="/game" className="hover:text-rose-300">← 독박게임</Link>
            <span>›</span><span>데시벨 배틀</span>
          </nav>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <GameShare label="🔗 데시벨게임 공유하기" text="🎤 누가 제일 크게 지르나! 데시벨 근사치 측정, 제일 작으면 독박! 무료 데시벨 배틀" />
          </div>
        </div>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">🎤 데시벨 배틀</h1>
        <p className="mt-1 text-[14px] text-white/60">한 명씩 3초간 소리 질러 <b className="text-white">최고 데시벨(근사치)</b>을 측정! <b className="text-white">가장 작게 지른 사람이 독박.</b> 최대 10명.</p>

        <div className="mt-6"><VoiceGame /></div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · ‘마이크 켜기’로 권한을 허용하고 대결 시작 → 한 명씩 ‘소리 지르기’를 누르고 3초간 크게 질러요. 그 사이 최고 데시벨(근사치)을 재서, <b className="text-white">가장 작게 지른 사람이 벌칙 독박!</b>
          <br /><span className="text-white/40">※ 마이크 감도가 기기마다 달라 데시벨은 정확한 SPL이 아닌 <b className="text-white/60">상대 비교용 근사치</b>예요. 마이크 소리는 측정에만 쓰이고 저장·전송되지 않아요.</span>
          <Link href="/game/reaction" className="ml-2 font-bold text-lime-300 hover:underline">반응속도 대결도 →</Link>
        </div>
      </div>
    </div>
  );
}
