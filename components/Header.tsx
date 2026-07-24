import Link from "next/link";
import { SITE } from "@/lib/site";
import SearchBox from "./SearchBox";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-3 px-5 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 flex-col justify-center leading-none">
          <span className="text-[20px] font-black tracking-[-0.02em] sm:text-[26px]">
            <span className="text-ink">주말에</span>
            <span className="text-free">뭐하지</span>
          </span>
          <span className="mt-0.5 hidden text-[10px] font-bold uppercase tracking-[0.15em] text-ink-faint sm:block">
            {SITE.nameEn}
          </span>
        </Link>

        <div className="ml-auto w-full max-w-md">
          <SearchBox size="sm" />
        </div>
      </div>
    </header>
  );
}
