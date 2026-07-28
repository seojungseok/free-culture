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
        <HeaderNav seasonLabel={s.label} seasonQuery={s.query} />
      </div>
    </header>
  );
}
