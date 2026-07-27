import Link from "next/link";
import { SITE } from "@/lib/site";
import SearchBox from "./SearchBox";
import BackButton from "./BackButton";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6 lg:px-8">
        <BackButton />
        <Link href="/" aria-label={`${SITE.name} 홈`} className="flex shrink-0 items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 shrink-0 text-free sm:h-7 sm:w-7">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
          </svg>
          <span className="flex flex-col leading-none">
            <span className="font-logo text-[20px] font-bold tracking-[-0.02em] sm:text-[24px]">
              <span className="text-ink">주말에</span>
              <span className="text-free">뭐하지</span>
            </span>
            <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-ink-faint sm:text-[10px]">
              {SITE.nameEn}
            </span>
          </span>
        </Link>

        <nav className="ml-1 hidden items-center gap-1 sm:flex">
          <Link href="/events" className="rounded-full px-3 py-1.5 text-[14px] font-bold text-ink-soft transition hover:bg-tint hover:text-free">
            문화행사
          </Link>
          <Link href="/places" className="rounded-full px-3 py-1.5 text-[14px] font-bold text-ink-soft transition hover:bg-tint hover:text-free">
            나들이
          </Link>
          <Link href="/camping" className="rounded-full px-3 py-1.5 text-[14px] font-bold text-ink-soft transition hover:bg-tint hover:text-free">
            캠핑
          </Link>
        </nav>

        <div className="ml-auto w-full max-w-md sm:max-w-xs">
          <SearchBox size="sm" />
        </div>
      </div>
    </header>
  );
}
