import type { Metadata } from "next";
import Link from "next/link";
import MemoryGame from "@/components/MemoryGame";
import GameShare from "@/components/GameShare";
import SoundToggle from "@/components/SoundToggle";

export const metadata: Metadata = {
  title: "기억력 순서 — 색 순서 기억 벌칙 게임 (무료, 최대 10명)",
  description:
    "점점 길어지는 색 순서를 기억해 그대로 따라치는 기억력 대결! 한 명씩 도전해 성공한 최고 단계로 순위를 매기고, 가장 짧게 기억한 사람이 독박. 순수 실력의 무료 참여형 벌칙 게임, 최대 10명.",
  keywords: ["기억력 게임", "순서 기억 게임", "사이먼 게임", "집중력 게임", "벌칙 게임", "복불복", "술자리 게임", "회식 벌칙"],
  alternates: { canonical: "/game/memory" },
};

const jsonLd = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "기억력 순서",
  applicationCategory: "GameApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function MemoryPage() {
  return (
    <div className="min-h-screen bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(167,139,250,0.2),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(0,229,255,0.13),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-[12.5px] text-white/40">
            <Link href="/game" className="hover:text-violet-300">← 독박게임</Link>
            <span>›</span><span>기억력 순서</span>
          </nav>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <GameShare label="🔗 기억력게임 공유하기" text="🧠 점점 길어지는 색 순서 기억하기! 제일 짧게 기억하면 독박. 순수 실력 무료 기억력 대결" />
          </div>
        </div>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">🧠 기억력 순서</h1>
        <p className="mt-1 text-[14px] text-white/60">점점 길어지는 <b className="text-white">색 순서를 기억해 따라쳐요.</b> 성공한 최고 단계로 순위를 매겨 <b className="text-white">가장 짧게 기억한 사람이 독박!</b> 최대 10명.</p>

        <div className="mt-6"><MemoryGame /></div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · 한 명씩 차례로 진행 → 패드가 색 순서로 반짝여요(잘 보세요!) → 그대로 따라쳐요. 맞히면 순서가 한 칸 길어지고, 틀리면 그 차례 종료. 성공한 최고 단계가 점수예요. 모두 끝나면 <b className="text-white">가장 짧게 기억한(최저 단계) 사람이 벌칙 독박!</b>
          <Link href="/game/tap" className="ml-2 font-bold text-orange-300 hover:underline">연타 대결도 →</Link>
        </div>
      </div>
    </div>
  );
}
