import Link from "next/link";
import { SITE } from "@/lib/site";
import SearchBox from "./SearchBox";
import BackButton from "./BackButton";
import HeaderNav from "./HeaderNav";
import { season } from "@/lib/finder";

export default function Header() {
  const s = season();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-md">
      {/* 1줄: 로고 · 검색(중앙) · 내 위치 */}
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <BackButton />
        <Link href="/" aria-label={`${SITE.name} 홈`} className="flex shrink-0 items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 shrink-0 text-free sm:h-7 sm:w-7">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
          </svg>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="font-logo text-[19px] font-bold tracking-[-0.02em] sm:text-[22px]">
              <span className="text-ink">주말에</span>
              <span className="text-free">뭐하지</span>
            </span>
            <span className="mt-1 hidden text-[9px] font-bold uppercase tracking-[0.16em] text-ink-faint sm:block sm:text-[10px]">
              {SITE.nameEn}
            </span>
          </span>
        </Link>

        {/* 홈 버튼 — 검색창(돋보기) 왼쪽. 테두리+라벨로 '버튼'임을 명확히(내 주변과 통일) */}
        <Link
          href="/"
          aria-label="홈으로"
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line bg-white px-2.5 py-2 text-[13px] font-bold text-ink-soft transition hover:border-free/40 hover:bg-tint hover:text-free sm:px-3"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
          </svg>
          <span>홈</span>
        </Link>

        <div className="w-full flex-1 sm:mx-auto sm:max-w-[560px]">
          <SearchBox size="md" placeholder="인천 나들이, 반려동물 캠핑장, 무료 공연…" />
        </div>

        <Link
          href="/near"
          className="hidden shrink-0 items-center gap-1 rounded-full border border-line bg-white px-3 py-2 text-[13px] font-bold text-ink-soft transition hover:border-free/40 hover:text-free sm:inline-flex"
        >
          <span aria-hidden>📍</span>
          <span>내 주변</span>
        </Link>
      </div>

      {/* 2줄: 통합 상단 메뉴 (현재 탭 그린 밑줄) */}
      <div className="border-t border-line/70">
        <HeaderNav seasonLabel={s.label} />
      </div>

      {/* 3줄: 독박게임 CTA — 한 줄 전체, 흐르는 그라데이션 + 광택으로 클릭 유도 */}
      <Link
        href="/game"
        aria-label="나만 아니면 돼 · 독박게임 하러 가기"
        className="game-cta relative flex items-center justify-center gap-2 overflow-hidden px-4 py-2.5 text-center text-white"
      >
        <span className="relative z-10 flex items-center gap-2 text-[14px] font-black tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] sm:text-[15px]">
          <span className="text-[17px]">🎮</span>
          나만 아니면 돼
          <span className="rounded-full bg-black/25 px-2 py-0.5 text-[11px] font-bold ring-1 ring-white/20">독박게임</span>
          <span className="animate-pulse text-[16px]">›</span>
        </span>
      </Link>
    </header>
  );
}
