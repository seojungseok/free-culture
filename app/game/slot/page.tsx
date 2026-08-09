import type { Metadata } from "next";
import Link from "next/link";
import SlotMachine from "@/components/SlotMachine";
import GameShare from "@/components/GameShare";
import SoundToggle from "@/components/SoundToggle";

export const metadata: Metadata = {
  title: "독박 슬롯머신 — 해골 잭팟 뜨면 벌칙 (무료, 최대 10명)",
  description:
    "한 명씩 레버를 당겨 💀💀💀 해골 잭팟이 뜨는 사람이 독박! 라스베가스 슬롯 감성의 무료 벌칙 슬롯머신 게임. 회식·술자리 복불복에 딱, 설치·회원가입 없이 바로.",
  keywords: ["슬롯머신 게임", "온라인 슬롯", "독박 슬롯", "벌칙 게임", "복불복", "술자리 게임", "회식 벌칙", "잭팟 게임"],
  alternates: { canonical: "/game/slot" },
};

const jsonLd = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "독박 슬롯머신",
  applicationCategory: "GameApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function SlotPage() {
  return (
    <div className="min-h-screen bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(255,210,63,0.2),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(255,46,136,0.13),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-[12.5px] text-white/40">
            <Link href="/game" className="hover:text-yellow-300">← 독박게임</Link>
            <span>›</span><span>독박 슬롯머신</span>
          </nav>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <GameShare label="🔗 슬롯머신 공유하기" text="🎰 레버 당겨 💀 해골 잭팟 뜨면 독박! 무료 독박 슬롯머신" />
          </div>
        </div>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">🎰 독박 슬롯머신</h1>
        <p className="mt-1 text-[14px] text-white/60">한 명씩 레버를 당겨요. <b className="text-white">💀💀💀 해골 잭팟이 뜨는 사람이 독박!</b> 최대 10명.</p>

        <div className="mt-6"><SlotMachine /></div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · 인원·이름 입력 → ‘슬롯 시작’ → 순서대로 레버를 당겨요. 릴 세 개가 모두 💀로 멈추는 사람이 벌칙 독박! 나머지는 무사 통과.
          <Link href="/game/balloon" className="ml-2 font-bold text-pink-300 hover:underline">풍선 터뜨리기도 →</Link>
        </div>
      </div>
    </div>
  );
}
