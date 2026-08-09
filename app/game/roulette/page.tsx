import type { Metadata } from "next";
import Link from "next/link";
import RouletteGame from "@/components/RouletteGame";

export const metadata: Metadata = {
  title: "독박 룰렛 돌리기 — 벌칙 정하기 (무료, 최대 10명)",
  description:
    "이름만 입력하면 바로! 룰렛을 돌려 한 명씩 세이프로 빼고 최후 1인이 독박(벌칙). 회식·모임·친구끼리 복불복 벌칙 정할 때 딱. 설치·회원가입 없이 무료.",
  keywords: ["룰렛 돌리기", "독박 룰렛", "벌칙 룰렛", "랜덤 뽑기", "복불복", "돌림판", "회식 벌칙 게임"],
  alternates: { canonical: "/game/roulette" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "독박 룰렛",
  applicationCategory: "GameApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function RoulettePage() {
  return (
    <div className="min-h-[85vh] bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(255,46,136,0.2),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(0,229,255,0.15),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <nav className="mb-4 flex items-center gap-1 text-[12.5px] text-white/40">
          <Link href="/game" className="hover:text-lime-300">독박게임</Link>
          <span>›</span><span>독박 룰렛</span>
        </nav>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">🎯 독박 룰렛</h1>
        <p className="mt-1 text-[14px] text-white/60">돌려서 한 명씩 세이프로 빠지고, <b className="text-white">마지막 1인이 독박(벌칙)!</b> 최대 10명.</p>

        <div className="mt-6">
          <RouletteGame />
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · 인원과 이름을 입력하고 ‘적용하기’ → GO를 눌러 룰렛을 돌립니다. 걸린 사람은 세이프로 빠지고, 끝까지 남은 최후 1인이 벌칙을 맡아요.
          <Link href="/game/ladder" className="ml-2 font-bold text-cyan-300 hover:underline">사다리타기도 해보기 →</Link>
        </div>
      </div>
    </div>
  );
}
