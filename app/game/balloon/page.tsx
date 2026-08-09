import type { Metadata } from "next";
import Link from "next/link";
import BalloonGame from "@/components/BalloonGame";
import GameShare from "@/components/GameShare";
import SoundToggle from "@/components/SoundToggle";

export const metadata: Metadata = {
  title: "풍선 터뜨리기 — 풍선 룰렛 벌칙 게임 (무료, 최대 10명)",
  description:
    "한 명씩 펌프! 풍선이 점점 커지다 터지는 순간 누른 사람이 독박. 조마조마 커지는 긴장감의 무료 풍선 룰렛 게임. 회식·술자리 벌칙 정할 때 딱, 설치·회원가입 없이 바로.",
  keywords: ["풍선 터뜨리기", "풍선 룰렛", "풍선 게임", "벌칙 게임", "복불복", "술자리 게임", "회식 벌칙", "긴장감 게임"],
  alternates: { canonical: "/game/balloon" },
};

const jsonLd = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "풍선 터뜨리기",
  applicationCategory: "GameApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function BalloonPage() {
  return (
    <div className="min-h-screen bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(255,122,198,0.2),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(0,229,255,0.13),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-[12.5px] text-white/40">
            <Link href="/game" className="hover:text-pink-300">← 독박게임</Link>
            <span>›</span><span>풍선 터뜨리기</span>
          </nav>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <GameShare label="🔗 풍선게임 공유하기" text="🎈 펌프할수록 커지는 풍선, 터뜨리면 독박! 무료 풍선 룰렛" />
          </div>
        </div>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">🎈 풍선 터뜨리기</h1>
        <p className="mt-1 text-[14px] text-white/60">한 명씩 펌프! 풍선이 점점 커지다 <b className="text-white">터뜨리는 사람이 독박!</b> 최대 10명.</p>

        <div className="mt-6"><BalloonGame /></div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · 인원·이름 입력 → ‘풍선 준비’ → 순서대로 한 번씩 ‘펌프!’로 바람을 넣어요. 풍선이 터지는 순간 펌프한 사람이 벌칙 독박! 언제 터질지 아무도 몰라요.
          <Link href="/game/slot" className="ml-2 font-bold text-yellow-300 hover:underline">독박 슬롯머신도 →</Link>
        </div>
      </div>
    </div>
  );
}
