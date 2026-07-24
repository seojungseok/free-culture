import Link from "next/link";
import { SITE } from "@/lib/site";
import { SIDO_LIST, SIDO_SLUG } from "@/lib/classify";
import VisitorCount from "./VisitorCount";
import ShareLinkButton from "./ShareLinkButton";

export default function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-5 py-9 sm:px-6 lg:px-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="text-lg font-extrabold text-ink">{SITE.name}</div>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-faint">
            {SITE.tagline}. 매일 새벽 전국 문화행사 정보를 자동으로 모아
            정리합니다.
          </p>
          <p className="mt-4 text-sm text-ink-soft">
            광고·제보·문의:{" "}
            <a
              href={`mailto:${SITE.email}`}
              className="font-semibold text-ink hover:underline"
            >
              {SITE.email}
            </a>
          </p>
          <p className="mt-2 text-xs text-ink-faint">출처: {SITE.source}</p>
          <div className="mt-3 -ml-2.5">
            <ShareLinkButton label="사이트 주소 복사" size="md" target="origin" />
          </div>
        </div>

        <nav className="text-sm">
          <div className="mb-3 font-semibold text-ink">둘러보기</div>
          <ul className="space-y-2 text-ink-soft">
            <li><Link href="/free" className="hover:text-ink">무료 행사</Link></li>
            <li><Link href="/cheap" className="hover:text-ink">1만원 이하</Link></li>
            <li><Link href="/weekend" className="hover:text-ink">이번 주말</Link></li>
            <li><Link href="/ending-soon" className="hover:text-ink">곧 종료</Link></li>
            <li><Link href="/kids" className="hover:text-ink">아이와 갈만한 곳</Link></li>
          </ul>
        </nav>

        <nav className="text-sm">
          <div className="mb-3 font-semibold text-ink">안내</div>
          <ul className="space-y-2 text-ink-soft">
            <li><Link href="/about" className="hover:text-ink">소개</Link></li>
            <li><Link href="/privacy" className="hover:text-ink">개인정보처리방침</Link></li>
            <li><Link href="/terms" className="hover:text-ink">이용약관</Link></li>
            <li><Link href="/contact" className="hover:text-ink">문의</Link></li>
          </ul>
        </nav>
      </div>
      {/* 지역별 바로가기 (SEO) */}
      <div className="border-t border-black/5">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-5 sm:px-6 lg:px-8">
          <div className="mb-2 text-xs font-semibold text-ink-faint">지역별 문화행사</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[13px] text-ink-soft">
            {SIDO_LIST.map((sido) => (
              <Link
                key={sido}
                href={`/region/${(SIDO_SLUG as Record<string, string>)[sido]}`}
                className="hover:text-free"
              >
                {sido}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5 border-t border-black/5 py-5 text-center text-xs text-ink-faint">
        <VisitorCount />
        <p>
          © {new Date().getFullYear()} {SITE.name}. 행사 정보의 정확성은 각
          주최기관의 공식 페이지를 확인해 주세요.
        </p>
      </div>
    </footer>
  );
}
