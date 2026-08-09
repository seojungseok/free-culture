import type { Metadata } from "next";
import Link from "next/link";
import ReactionGame from "@/components/ReactionGame";
import GameShare from "@/components/GameShare";
import SoundToggle from "@/components/SoundToggle";

export const metadata: Metadata = {
  title: "반응속도 대결 — 가장 느린 사람이 벌칙 (무료, 최대 10명)",
  description:
    "화면이 초록으로 바뀌는 순간 탭! 가장 느리거나 미리 누른 사람이 독박. 순발력 테스트로 벌칙 정하는 무료 반응속도 게임. 회식·술자리·친구 내기에 딱, 최대 10명.",
  keywords: ["반응속도 게임", "반응속도 테스트", "순발력 게임", "벌칙 게임", "복불복", "술자리 게임", "회식 벌칙", "내기 게임"],
  alternates: { canonical: "/game/reaction" },
};

const jsonLd = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "반응속도 대결",
  applicationCategory: "GameApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function ReactionPage() {
  return (
    <div className="min-h-screen bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(166,255,0,0.16),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(0,229,255,0.14),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-[12.5px] text-white/40">
            <Link href="/game" className="hover:text-lime-300">← 독박게임</Link>
            <span>›</span><span>반응속도 대결</span>
          </nav>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <GameShare label="🔗 반응속도게임 공유하기" text="⚡ 초록불에 가장 늦게 누른 사람이 독박! 무료 반응속도 대결" />
          </div>
        </div>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">⚡ 반응속도 대결</h1>
        <p className="mt-1 text-[14px] text-white/60">초록불이 켜지는 순간 탭! <b className="text-white">가장 느린 사람이 독박.</b> 미리 누르면 부정출발. 최대 10명.</p>

        <div className="mt-6"><ReactionGame /></div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · 한 명씩 차례로 진행 → 빨간 화면에서 기다리다 초록으로 바뀌면 최대한 빨리 탭! 반응 시간을 재서 가장 느린(또는 부정출발) 사람이 벌칙 독박!
          <Link href="/game/finger" className="ml-2 font-bold text-fuchsia-300 hover:underline">손가락 룰렛도 →</Link>
        </div>
      </div>
    </div>
  );
}
