import type { Metadata } from "next";
import Link from "next/link";
import BombGame from "@/components/BombGame";
import GameShare from "@/components/GameShare";
import SoundToggle from "@/components/SoundToggle";

export const metadata: Metadata = {
  title: "폭탄 돌리기 — 넘기다 터지면 벌칙 (무료, 최대 10명)",
  description:
    "순서대로 폭탄을 넘기다 터지는 순간 들고 있던 사람이 독박! 넘길 때마다 조마조마한 무료 폭탄 돌리기 게임. 회식·술자리 벌칙 정할 때 딱. 설치·회원가입 없이 바로.",
  keywords: ["폭탄 돌리기", "폭탄게임", "벌칙 게임", "복불복", "술자리 게임", "회식 벌칙", "타이머 폭탄", "랜덤 뽑기"],
  alternates: { canonical: "/game/bomb" },
};

const jsonLd = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "폭탄 돌리기",
  applicationCategory: "GameApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function BombPage() {
  return (
    <div className="min-h-screen bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(255,82,82,0.2),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(255,176,32,0.14),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-[12.5px] text-white/40">
            <Link href="/game" className="hover:text-rose-300">← 독박게임</Link>
            <span>›</span><span>폭탄 돌리기</span>
          </nav>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <GameShare label="🔗 폭탄게임 공유하기" text="💣 순서대로 넘기다 터지면 독박! 조마조마 무료 폭탄 돌리기" />
          </div>
        </div>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">💣 폭탄 돌리기</h1>
        <p className="mt-1 text-[14px] text-white/60">순서대로 폭탄을 넘기다 <b className="text-white">터지는 순간 든 사람이 독박!</b> 언제 터질지 아무도 몰라요. 최대 10명.</p>

        <div className="mt-6"><BombGame /></div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · 인원·이름 입력 → ‘폭탄 점화’ → 화면에 뜬 사람이 ‘폭탄 넘기기’를 누르며 옆으로 전달해요. 터지는 순간 폭탄을 든 사람이 벌칙 독박!
          <Link href="/game/mission" className="ml-2 font-bold text-amber-300 hover:underline">벌칙 룰렛으로 벌칙 정하기 →</Link>
        </div>
      </div>
    </div>
  );
}
