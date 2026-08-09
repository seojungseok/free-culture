import type { Metadata } from "next";
import Link from "next/link";
import FingerRoulette from "@/components/FingerRoulette";
import GameShare from "@/components/GameShare";
import SoundToggle from "@/components/SoundToggle";

export const metadata: Metadata = {
  title: "손가락 뱀 룰렛 — 뱀이 물면 벌칙 (무료 벌칙 게임)",
  description:
    "다 같이 화면에 손가락을 올리면 가운데서 뱀이 나와 손가락 사이를 돌아다니다 한 명을 콱! 물어요. 물린 사람이 독박! 기기가 지원하는 손가락 수만큼(아이패드 최대 11명) 함께 즐기는 긴장감 넘치는 무료 손가락 뱀 룰렛.",
  keywords: ["손가락 룰렛", "뱀 룰렛", "터치 룰렛", "손가락 게임", "벌칙 게임", "복불복", "술자리 게임", "긴장감 게임"],
  alternates: { canonical: "/game/finger" },
};

const jsonLd = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "손가락 뱀 룰렛",
  applicationCategory: "GameApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function FingerPage() {
  return (
    <div className="min-h-screen bg-[#0b0b18] bg-[radial-gradient(circle_at_15%_0%,rgba(177,75,255,0.22),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(0,229,255,0.14),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-[12.5px] text-white/40">
            <Link href="/game" className="hover:text-fuchsia-300">← 독박게임</Link>
            <span>›</span><span>손가락 룰렛</span>
          </nav>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <GameShare label="🔗 뱀룰렛 공유하기" text="🐍 손가락 올리면 뱀이 돌아다니다 한 명을 콱! 물면 독박! 무료 손가락 뱀 룰렛" />
          </div>
        </div>
        <h1 className="text-[26px] font-black tracking-tight sm:text-[32px]">🐍 손가락 뱀 룰렛</h1>
        <p className="mt-1 text-[14px] text-white/60">다 같이 손가락을 올리면 가운데서 뱀이 나와 돌아다니다 <b className="text-white">한 명을 콱! 물어요.</b> 물린 사람이 독박! <b className="text-white">기기가 지원하는 손가락 수만큼</b> 함께.</p>

        <div className="mt-6"><FingerRoulette /></div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
          <b className="text-white">규칙</b> · 2명 이상이 화면에 손가락을 대고 있으면 카운트다운 후 뱀이 깨어나 손가락 사이를 돌아다녀요(인원 많을수록 오래). 뱀이 콱! 문 손가락(💀)의 주인이 벌칙 독박!<br /><span className="text-white/40">📱 기기별 동시 터치: 아이폰 5개 · 아이패드 최대 11개 · 안드로이드 대부분 10개 · PC 터치스크린은 기기마다 달라요. (하드웨어 제한이라 그 수만큼만 동시에 인식돼요)</span>
          <Link href="/game/reaction" className="ml-2 font-bold text-lime-300 hover:underline">반응속도 대결도 →</Link>
        </div>
      </div>
    </div>
  );
}
