import type { Metadata } from "next";
import Link from "next/link";
import PickGame from "@/components/PickGame";
import GameShare from "@/components/GameShare";

export const metadata: Metadata = {
  title: "제비뽑기 폭탄게임 — 카드 뒤집어 벌칙 뽑기 (무료, 최대 10명)",
  description:
    "순서대로 카드를 뒤집다가 💣 폭탄을 뽑은 사람이 독박! 회식·술자리 벌칙 정할 때 딱 좋은 무료 제비뽑기 게임. 설치·회원가입 없이 바로, 최대 10명.",
  keywords: ["제비뽑기", "폭탄게임", "뽑기게임", "벌칙 뽑기", "복불복", "술자리 게임", "회식 벌칙", "랜덤 뽑기"],
  alternates: { canonical: "/game/pick" },
};

const jsonLd = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "제비뽑기 폭탄게임",
  applicationCategory: "GameApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function PickPage() {
  return (
    <div className="min-h-screen bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(255,176,32,0.18),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(255,46,136,0.13),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-[12.5px] text-white/40">
            <Link href="/game" className="hover:text-amber-300">← 독박게임</Link>
            <span>›</span><span>제비뽑기</span>
          </nav>
          <GameShare label="🔗 제비뽑기 공유하기" text="💣 순서대로 카드 뒤집어 폭탄 뽑는 사람이 독박! 무료 제비뽑기" />
        </div>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">🃏 제비뽑기 폭탄게임</h1>
        <p className="mt-1 text-[14px] text-white/60">순서대로 카드를 뒤집다가 <b className="text-white">💣 폭탄을 뽑은 사람이 독박!</b> 최대 10명.</p>

        <div className="mt-6"><PickGame /></div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · 인원과 이름을 입력 → ‘카드 섞기’ → 화면에 뜬 순서대로 한 명씩 카드를 뒤집어요. 💣 폭탄 카드를 뽑은 사람이 벌칙 독박!
          <Link href="/game/dice" className="ml-2 font-bold text-violet-300 hover:underline">주사위 대결도 해보기 →</Link>
        </div>
      </div>
    </div>
  );
}
