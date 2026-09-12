import Link from "next/link";

const shortcuts = [
  { href: "/game/roulette", label: "독박 룰렛" },
  { href: "/game/ladder", label: "사다리타기" },
  { href: "/game/bomb", label: "폭탄 돌리기" },
];

export default function GamePromoBanner() {
  return (
    <section aria-label="독박게임" className="mx-auto w-full max-w-[1120px] px-5 pt-5 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b18] bg-[radial-gradient(ellipse_at_top_right,rgba(192,38,211,0.24),transparent_65%)] text-white">
        <Link href="/game" prefetch={false} className="group flex flex-wrap items-center justify-between gap-4 p-5 outline-offset-[-4px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-wide text-lime-300">설치 없이 무료로 즐기는 18종</p>
            <h2 className="mt-1 text-[23px] font-black leading-tight tracking-tight sm:text-[27px]">나만 아니면 돼! <span className="text-fuchsia-300">독박게임</span></h2>
            <p className="mt-2 text-[13px] leading-5 text-white/75">친구와 모였을 때, 오늘의 독박은 누구?</p>
          </div>
          <span className="inline-flex min-h-11 shrink-0 items-center gap-4 rounded-xl bg-lime-300 px-4 text-[13px] font-extrabold text-[#0b0b18] transition-colors group-hover:bg-lime-200">게임 고르기 <span aria-hidden="true">→</span></span>
        </Link>
        <nav aria-label="인기 독박게임 바로가기" className="grid grid-cols-3 border-t border-white/10 bg-white/[0.03]">
          {shortcuts.map(({ href, label }) => (
            <Link key={href} href={href} prefetch={false} className="flex min-h-11 items-center justify-center border-r border-white/10 px-2 py-3 text-center text-[12px] font-bold text-white/85 transition-colors last:border-r-0 hover:bg-white/10 hover:text-lime-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-lime-300">{label}</Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
