import Link from "next/link";
import { SITE } from "@/lib/site";
import { GENRES } from "@/lib/classify";
import { getRegionCounts } from "@/lib/data";
import SearchBox from "./SearchBox";
import RegionBar from "./RegionBar";

export default function Header() {
  const regionCounts = getRegionCounts();
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-[var(--bg)]/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-3 px-5 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 flex-col justify-center leading-none">
          <span className="text-[22px] font-black tracking-[-0.02em] sm:text-[26px]">
            <span className="text-ink">주말에</span>
            <span className="text-free">뭐하지</span>
          </span>
          <span className="mt-0.5 hidden text-[10px] font-bold uppercase tracking-[0.15em] text-ink-faint sm:block">
            {SITE.nameEn}
          </span>
        </Link>

        <div className="ml-auto hidden w-full max-w-xs md:block">
          <SearchBox size="sm" />
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar md:ml-2">
          <NavLink href="/free" label="무료" accent />
          <NavLink href="/cheap" label="1만원↓" />
          <NavLink href="/weekend" label="주말" />
          <NavLink href="/ending-soon" label="곧종료" />
          <NavLink href="/kids" label="아이와" muted />
        </nav>
      </div>

      {/* 모바일 검색 */}
      <div className="mx-auto w-full max-w-[1280px] px-5 pb-2 sm:px-6 md:hidden">
        <SearchBox size="sm" />
      </div>

      {/* 필터 밴드 (지역 + 분야) — 옅은 회색 띠로 구분 */}
      <div className="border-t border-line bg-panel">
        <RegionBar counts={regionCounts} />
        <div className="border-t border-line">
          <div className="mx-auto flex w-full max-w-[1280px] items-center gap-1 overflow-x-auto no-scrollbar px-5 py-1.5 sm:px-6 lg:px-8">
            {GENRES.map((g) => (
              <Link
                key={g.key}
                href={`/genre/${g.key}`}
                className="whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-medium text-ink-soft transition hover:bg-black/5 hover:text-ink"
              >
                {g.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  label,
  accent,
  muted,
}: {
  href: string;
  label: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition",
        accent
          ? "bg-free text-white hover:brightness-105"
          : muted
          ? "text-ink-faint hover:bg-black/5 hover:text-ink"
          : "text-ink-soft hover:bg-black/5 hover:text-ink",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}
