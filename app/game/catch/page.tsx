import type { Metadata } from "next";
import Link from "next/link";
import SnakeCatchGame from "@/components/SnakeCatchGame";
import GameShare from "@/components/GameShare";
import SoundToggle from "@/components/SoundToggle";

export const metadata: Metadata = {
  title: "뱀 잡기 — 도망치는 뱀 잡기 벌칙 게임 (무료, 최대 10명)",
  description:
    "구불구불 도망치는 뱀을 5초 안에 최대한 많이 탭해서 잡는 순발력 게임! 잡을 때마다 뱀이 홱 도망가요. 모두 같은 조건, 가장 적게 잡은 사람이 독박. 순수 반응·조준 실력의 무료 참여형 벌칙 게임.",
  keywords: ["뱀 잡기", "순발력 게임", "반응 게임", "조준 게임", "벌칙 게임", "복불복", "술자리 게임", "회식 벌칙"],
  alternates: { canonical: "/game/catch" },
};

const jsonLd = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "뱀 잡기",
  applicationCategory: "GameApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function CatchPage() {
  return (
    <div className="min-h-screen bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(0,255,157,0.18),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(0,229,255,0.13),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-[12.5px] text-white/40">
            <Link href="/game" className="hover:text-emerald-300">← 독박게임</Link>
            <span>›</span><span>뱀 잡기</span>
          </nav>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <GameShare label="🔗 뱀잡기 공유하기" text="🐍 도망치는 뱀을 5초 안에 많이 잡기! 제일 적게 잡으면 독박. 순발력 무료 게임" />
          </div>
        </div>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">🐍 뱀 잡기</h1>
        <p className="mt-1 text-[14px] text-white/60">구불구불 도망치는 뱀을 <b className="text-white">5초 안에 최대한 많이 탭해서 잡아요.</b> 모두 같은 조건, <b className="text-white">가장 적게 잡은 사람이 독박!</b> 최대 10명.</p>

        <div className="mt-6"><SnakeCatchGame /></div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · 인원·이름을 입력하고 시작 → 한 명씩 ‘시작’을 누르면 5초 동안 아레나에서 뱀이 구불구불 도망쳐요. 뱀을 탭하면 포획(+1), 잡힐 때마다 홱 도망가요. 모두 끝나면 잡은 수로 순위를 매겨 <b className="text-white">가장 적게 잡은 사람이 벌칙 독박!</b>
          <Link href="/game/reaction" className="ml-2 font-bold text-lime-300 hover:underline">반응속도 대결도 →</Link>
        </div>
      </div>
    </div>
  );
}
