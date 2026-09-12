import Link from "next/link";

export default function GamePromoBanner() {
  return (
    <section className="mx-auto w-full max-w-[1120px] px-5 pt-4 sm:px-6 sm:pt-5 lg:px-8">
      <Link
        href="/game"
        prefetch={false}
        aria-label="나만 아니면 돼 독박게임 하러 가기"
        className="group relative flex min-h-[62px] items-center justify-between gap-3 overflow-hidden rounded-2xl border border-[#dfe8f7] bg-gradient-to-r from-[#eef6ff] via-white to-[#edf8f3] px-4 py-2.5 text-[#102344] shadow-sm transition hover:border-brandblue/30 hover:shadow-card sm:min-h-[70px] sm:px-6"
      >
        <span className="absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(circle_at_15%_50%,rgba(45,127,249,0.16),transparent_42%)]" />
        <span className="relative z-10 flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brandblue/10 text-[20px] ring-1 ring-brandblue/15">🎮</span>
          <span className="min-w-0">
            <span className="block truncate text-[12px] font-bold text-ink-faint sm:text-[13px]">심심할 때 한 판</span>
            <span className="block truncate text-[16px] font-black tracking-tight text-[#102344] sm:text-[19px]">나만 아니면 돼 · 독박게임</span>
          </span>
        </span>
        <span className="relative z-10 inline-flex shrink-0 items-center gap-1 rounded-full bg-brandblue px-3 py-1.5 text-[12px] font-black text-white transition group-hover:translate-x-0.5 sm:px-4 sm:text-[13px]">
          게임하러 가기
          <span aria-hidden>›</span>
        </span>
      </Link>
    </section>
  );
}
