import Link from "next/link";
import { SITE } from "@/lib/site";
import BackButton from "./BackButton";
import HeaderNav from "./HeaderNav";
import { season } from "@/lib/finder";

export default function Header() {
  const s = season();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] w-full max-w-[1180px] items-center gap-4 px-5 sm:h-[70px] sm:px-6 lg:px-8">
        <BackButton />
        <Link href="/" aria-label={`${SITE.name} 홈`} className="flex shrink-0 items-center gap-2">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 shrink-0 text-brandblue sm:h-7 sm:w-7">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
          </svg>
          <span className="flex flex-col leading-none">
            <span className="font-logo text-[22px] font-bold tracking-tight sm:text-[21px]">
              <span className="text-[#102344]">오늘은 뭐하지?</span>
            </span>
            <span className="mt-1 hidden text-[9px] font-bold uppercase tracking-[0.16em] text-ink-faint sm:block sm:text-[10px]">
              {SITE.nameEn}
            </span>
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 justify-center md:flex">
          <HeaderNav seasonLabel={s.label} />
        </div>

        <Link
          href="/search"
          aria-label="검색"
          className="ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[#07152f] transition hover:bg-tint hover:text-brandblue md:ml-0"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" className="h-8 w-8 md:h-6 md:w-6">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </Link>
        <details className="group relative md:hidden">
          <summary className="flex h-12 w-12 cursor-pointer list-none items-center justify-center rounded-full text-[#07152f] transition hover:bg-tint [&::-webkit-details-marker]:hidden">
            <span className="sr-only">메뉴</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-9 w-9">
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          </summary>
          <div className="absolute right-0 top-[calc(100%+10px)] w-[220px] overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-lg">
            {[
              { href: "/events", label: "문화행사" },
              { href: "/places", label: "나들이" },
              { href: "/course", label: "여행코스" },
              { href: "/camping", label: "캠핑" },
              { href: "/food", label: "맛집 탐방" },
              { href: "/kids", label: "아이와 함께" },
              { href: "/date", label: "데이트" },
              { href: "/season", label: `${s.label} 나들이` },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-2.5 text-[14px] font-bold text-ink-soft hover:bg-tint hover:text-brandblue">
                {item.label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}
