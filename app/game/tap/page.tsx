import type { Metadata } from "next";
import Link from "next/link";
import TapBattleGame from "@/components/TapBattleGame";
import GameShare from "@/components/GameShare";
import SoundToggle from "@/components/SoundToggle";

export const metadata: Metadata = {
  title: "연타 대결 — 5초 광클 벌칙 게임 (무료, 최대 10명)",
  description:
    "모두 같은 5초 동안 버튼을 최대한 빨리 연타! 가장 적게 누른 사람이 독박. 순서 운 없이 노력한 만큼 정직하게 순위가 갈리는 무료 광클(연타) 대결. 회식·술자리 벌칙에 딱, 최대 10명.",
  keywords: ["연타 게임", "광클 대결", "버튼 빨리 누르기", "클릭 게임", "벌칙 게임", "복불복", "술자리 게임", "회식 벌칙"],
  alternates: { canonical: "/game/tap" },
};

const jsonLd = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "연타 대결",
  applicationCategory: "GameApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function TapPage() {
  return (
    <div className="min-h-screen bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(255,140,32,0.2),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(255,82,82,0.14),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-[12.5px] text-white/40">
            <Link href="/game" className="hover:text-orange-300">← 독박게임</Link>
            <span>›</span><span>연타 대결</span>
          </nav>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <GameShare label="🔗 연타대결 공유하기" text="🔥 5초 광클 대결! 제일 적게 누른 사람이 독박. 순서 운 없는 정직한 무료 연타 게임" />
          </div>
        </div>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">🔥 연타 대결</h1>
        <p className="mt-1 text-[14px] text-white/60">모두 같은 5초 동안 버튼을 최대한 빨리 눌러요. <b className="text-white">가장 적게 누른 사람이 독박!</b> 순서 운 없이 노력한 만큼 정직하게. 최대 10명.</p>

        <div className="mt-6"><TapBattleGame /></div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · 인원·이름을 입력하고 시작 → 한 명씩 ‘시작’을 누르면 5초 카운트다운 동안 버튼을 최대한 많이 연타해요. 모두 끝나면 연타 수로 순위를 매겨 <b className="text-white">가장 적게 누른 사람이 벌칙 독박!</b> 누구에게나 공평한 같은 조건이에요.
          <Link href="/game/reaction" className="ml-2 font-bold text-lime-300 hover:underline">반응속도 대결도 →</Link>
        </div>
      </div>
    </div>
  );
}
