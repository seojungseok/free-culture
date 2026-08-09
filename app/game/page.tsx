import type { Metadata } from "next";
import Link from "next/link";
import GameShare from "@/components/GameShare";

export const metadata: Metadata = {
  title: "독박게임 — 룰렛·사다리·제비뽑기·주사위로 벌칙 정하기 (무료, 최대 10명)",
  description:
    "친구·회식·술자리에서 벌칙 정할 때! 이름만 입력하면 끝나는 무료 독박게임 4종 — 룰렛 돌리기·사다리타기·제비뽑기·주사위 대결. 설치 없이 바로, 최대 10명.",
  keywords: ["독박게임", "벌칙게임", "룰렛 돌리기", "사다리타기", "제비뽑기", "주사위 게임", "술자리 게임", "회식 벌칙", "복불복 게임", "랜덤 뽑기"],
  alternates: { canonical: "/game" },
  openGraph: { title: "독박게임 — 룰렛·사다리로 벌칙 정하기", description: "이름만 입력하면 끝! 무료 벌칙 뽑기 게임", type: "website" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "독박게임 (룰렛·사다리타기)",
  applicationCategory: "GameApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
  description: "이름을 입력하고 룰렛이나 사다리로 벌칙 당첨자를 뽑는 무료 온라인 게임.",
};

const GAMES = [
  { href: "/game/roulette", emoji: "🎯", name: "독박 룰렛", desc: "돌려서 한 명씩 세이프! 마지막 1인이 독박", accent: "from-fuchsia-500 to-rose-500", ready: true },
  { href: "/game/ladder", emoji: "🪜", name: "사다리타기", desc: "이름 적고 쭉~ 내려와 벌칙 한 명 당첨", accent: "from-cyan-400 to-sky-500", ready: true },
  { href: "/game/pick", emoji: "🃏", name: "제비뽑기", desc: "카드 뒤집다 💣 폭탄 뽑으면 독박", accent: "from-amber-400 to-orange-500", ready: true },
  { href: "/game/dice", emoji: "🎲", name: "주사위 대결", desc: "다 같이 굴려 최저 눈이 독박", accent: "from-violet-500 to-purple-600", ready: true },
];

export default function GameHub() {
  return (
    <div className="min-h-[80vh] bg-[#0b0b18] bg-[radial-gradient(circle_at_20%_0%,rgba(120,0,180,0.25),transparent_45%),radial-gradient(circle_at_90%_20%,rgba(0,180,255,0.18),transparent_40%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[980px] px-5 py-10 sm:px-6">
        <p className="text-[12px] font-black uppercase tracking-[0.25em] text-lime-300">FREE MINI GAMES</p>
        <h1 className="mt-2 text-[30px] font-black leading-tight tracking-tight sm:text-[40px]">
          오늘의 <span className="bg-gradient-to-r from-fuchsia-400 to-lime-300 bg-clip-text text-transparent">독박</span>은 누구?
        </h1>
        <p className="mt-2 max-w-[560px] text-[15px] text-white/70">
          친구·회식·모임에서 벌칙 정할 때. <b className="text-white">이름만 입력하면 끝.</b> 설치도 회원가입도 없이 바로, 최대 10명.
        </p>
        <div className="mt-4">
          <GameShare label="🔗 독박게임 공유하기" text="🎯🪜🃏🎲 룰렛·사다리·제비뽑기·주사위로 벌칙 정하기! 무료 독박게임" />
        </div>

        {/* 게임 카드 */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {GAMES.map((g) => {
            const inner = (
              <div className={`group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition ${g.ready ? "hover:-translate-y-1 hover:border-white/25" : "opacity-55"}`}>
                <div className={`mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${g.accent} text-[28px] shadow-lg`}>{g.emoji}</div>
                <h2 className="text-[17px] font-black">{g.name}</h2>
                <p className="mt-1 text-[12.5px] leading-snug text-white/60">{g.desc}</p>
                {g.ready ? (
                  <span className="mt-3 inline-block text-[12px] font-black text-lime-300">시작하기 →</span>
                ) : (
                  <span className="mt-3 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/50">COMING SOON</span>
                )}
              </div>
            );
            return g.ready ? <Link key={g.name} href={g.href} className="block">{inner}</Link> : <div key={g.name}>{inner}</div>;
          })}
        </div>

        {/* 규칙 */}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="text-[18px] font-black">규칙은 아주 간단해요</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[14px] font-black text-fuchsia-300">🎯 독박 룰렛</p>
              <ol className="mt-2 space-y-1 text-[13.5px] text-white/70">
                <li>1. 인원(2~10명)과 이름을 입력</li>
                <li>2. GO를 눌러 룰렛을 돌려요</li>
                <li>3. 걸린 사람은 <b className="text-white">세이프</b>로 빠짐</li>
                <li>4. 끝까지 남은 <b className="text-white">최후 1인이 독박(벌칙)!</b></li>
              </ol>
            </div>
            <div>
              <p className="text-[14px] font-black text-cyan-300">🪜 사다리타기</p>
              <ol className="mt-2 space-y-1 text-[13.5px] text-white/70">
                <li>1. 인원과 이름을 입력</li>
                <li>2. ‘사다리 만들기’로 랜덤 생성 (가로줄 숨김)</li>
                <li>3. 번호·랜덤 버튼으로 <b className="text-white">쭉쭉 자동 하강</b></li>
                <li>4. <b className="text-white">벌칙 칸</b>에 도착하면 독박 당첨!</li>
              </ol>
            </div>
            <div>
              <p className="text-[14px] font-black text-amber-300">🃏 제비뽑기</p>
              <ol className="mt-2 space-y-1 text-[13.5px] text-white/70">
                <li>1. 인원과 이름을 입력</li>
                <li>2. ‘카드 섞기’로 폭탄 숨기기</li>
                <li>3. 순서대로 카드를 한 장씩 뒤집어요</li>
                <li>4. <b className="text-white">💣 폭탄</b>을 뽑은 사람이 독박!</li>
              </ol>
            </div>
            <div>
              <p className="text-[14px] font-black text-violet-300">🎲 주사위 대결</p>
              <ol className="mt-2 space-y-1 text-[13.5px] text-white/70">
                <li>1. 인원과 이름을 입력</li>
                <li>2. ‘주사위 굴리기’로 다 함께 굴려요</li>
                <li>3. <b className="text-white">가장 낮은 눈</b>이 독박</li>
                <li>4. 동점이면 그들끼리 자동 재대결!</li>
              </ol>
            </div>
          </div>
          <p className="mt-4 text-[12px] text-white/40">✦ 한 번의 클릭, 피할 수 없는 운명 ✦</p>
        </section>
      </div>
    </div>
  );
}
