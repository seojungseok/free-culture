import Link from "next/link";
import { SITE } from "@/lib/site";
import { SIDO_LIST, SIDO_SLUG } from "@/lib/classify";
import VisitorCount from "./VisitorCount";
import ShareLinkButton from "./ShareLinkButton";

const BROWSE = [
  { href: "/free", label: "무료 행사" },
  { href: "/cheap", label: "1만원 이하" },
  { href: "/weekend", label: "이번 주말" },
  { href: "/ending-soon", label: "곧 종료" },
  { href: "/kids", label: "아이와" },
];
const INFO = [
  { href: "/about", label: "소개" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/terms", label: "이용약관" },
  { href: "/contact", label: "문의" },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-white text-[13px] text-ink-soft">
      <div className="mx-auto grid w-full max-w-[1280px] gap-x-6 gap-y-5 px-5 py-6 sm:px-6 lg:px-8 sm:grid-cols-[1.6fr_1fr_1fr]">
        {/* 브랜드 */}
        <div>
          <div className="text-[15px] font-extrabold text-ink">{SITE.name}</div>
          <p className="mt-1.5 text-ink-faint">{SITE.tagline}</p>
          <p className="mt-2">
            광고·제보·문의:{" "}
            <a href={`mailto:${SITE.email}`} className="font-semibold text-ink hover:underline">
              {SITE.email}
            </a>
          </p>
          <div className="mt-1.5 -ml-2.5">
            <ShareLinkButton label="사이트 주소 복사" target="origin" />
          </div>
        </div>

        {/* 둘러보기 */}
        <nav>
          <div className="mb-2 font-bold text-ink">둘러보기</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {BROWSE.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-free">{l.label}</Link>
            ))}
          </div>
        </nav>

        {/* 안내 */}
        <nav>
          <div className="mb-2 font-bold text-ink">안내</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {INFO.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-free">{l.label}</Link>
            ))}
          </div>
        </nav>
      </div>

      {/* 지역별 바로가기 — SEO용 작은 텍스트 링크 (필터는 상단에 있음) */}
      <div className="border-t border-line">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-ink-faint">
            <span className="font-semibold">지역별:</span>
            {SIDO_LIST.map((sido) => (
              <Link
                key={sido}
                href={`/region/${(SIDO_SLUG as Record<string, string>)[sido]}`}
                className="hover:text-free hover:underline"
              >
                {sido}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 border-t border-line py-4 text-center text-xs text-ink-faint">
        <VisitorCount />
        <p>
          © {new Date().getFullYear()} {SITE.name} · 출처: {SITE.source}. 정확한
          정보는 각 주최기관 공식 페이지를 확인해 주세요.
        </p>
      </div>
    </footer>
  );
}
