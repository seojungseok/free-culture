import type { Metadata } from "next";
import Link from "next/link";
import GameShare from "@/components/GameShare";

export const metadata: Metadata = {
  title: "독박게임 — 룰렛·사다리·러시안룰렛·슬롯·타이머 등 14종 (무료, 최대 10명)",
  description:
    "친구·회식·술자리에서 벌칙 정할 때! 이름만 입력하면 끝나는 무료 독박게임 14종 — 룰렛·사다리·제비뽑기·주사위·폭탄·벌칙룰렛·손가락·반응속도·슬롯·풍선·타이머·병돌리기·러시안룰렛·버스트21. 설치 없이 바로.",
  keywords: ["독박게임", "벌칙게임", "룰렛 돌리기", "사다리타기", "러시안룰렛", "제비뽑기", "주사위 게임", "폭탄 돌리기", "슬롯머신 게임", "풍선 터뜨리기", "타이머 게임", "병 돌리기", "버스트 21", "술자리 게임", "회식 벌칙", "복불복 게임"],
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
  { href: "/game/bomb", emoji: "💣", name: "폭탄 돌리기", desc: "넘기다 터지는 순간 든 사람 독박", accent: "from-rose-500 to-orange-500", ready: true },
  { href: "/game/mission", emoji: "🎡", name: "벌칙 룰렛", desc: "무슨 벌칙일지 랜덤으로 뽑기", accent: "from-amber-400 to-rose-500", ready: true },
  { href: "/game/finger", emoji: "🐍", name: "손가락 뱀 룰렛", desc: "뱀이 돌아다니다 문 사람이 독박", accent: "from-emerald-500 to-green-600", ready: true },
  { href: "/game/reaction", emoji: "⚡", name: "반응속도 대결", desc: "가장 느린 사람이 독박", accent: "from-lime-400 to-emerald-500", ready: true },
  { href: "/game/slot", emoji: "🎰", name: "독박 슬롯머신", desc: "💀 해골 잭팟 뜨면 독박", accent: "from-yellow-400 to-amber-500", ready: true },
  { href: "/game/balloon", emoji: "🎈", name: "풍선 터뜨리기", desc: "펌프하다 터뜨리면 독박", accent: "from-pink-400 to-rose-500", ready: true },
  { href: "/game/timer", emoji: "⏱️", name: "근접 타이머", desc: "5초·10초에 가깝게 멈추기", accent: "from-cyan-400 to-sky-500", ready: true },
  { href: "/game/bottle", emoji: "🍾", name: "병 돌리기", desc: "병이 가리킨 사람이 독박", accent: "from-emerald-400 to-teal-500", ready: true },
  { href: "/game/russian", emoji: "🔫", name: "러시안룰렛", desc: "불발되는 사람이 독박 (스릴)", accent: "from-rose-500 to-red-700", ready: true },
  { href: "/game/bust", emoji: "🎴", name: "버스트 21", desc: "합이 21 넘기면 독박", accent: "from-amber-400 to-orange-600", ready: true },
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
          <GameShare label="🔗 독박게임 공유하기" text="🎯🪜🃏🎲💣🎡👆⚡🎰🎈⏱️🍾🔫🎴 룰렛·사다리·러시안룰렛·슬롯·타이머 등! 무료 독박게임 14종" />
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

        <p className="mt-8 text-center text-[12px] text-white/40">✦ 게임을 고르면 각자 짧은 규칙이 있어요 · 한 번의 클릭, 피할 수 없는 운명 ✦</p>
      </div>
    </div>
  );
}
