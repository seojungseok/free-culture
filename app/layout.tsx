import type { Metadata } from "next";
import "./globals.css";
import { SITE } from "@/lib/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Analytics from "@/components/Analytics";
import FloatingShare from "@/components/FloatingShare";
import ChromeGate from "@/components/ChromeGate";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} · 전국 무료 전시·공연 정보`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "무료 전시",
    "무료 공연",
    "무료 문화행사",
    "전시회",
    "주말 나들이",
    "아이와 갈만한 곳",
    "전국 전시",
    "문화행사 일정",
  ],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: "주말에 뭐하지? · 이번 주말 나들이와 문화행사",
    description:
      "이번 주말 갈 만한 전국 문화행사·나들이·여행코스를 지역과 테마로 빠르게 찾아보세요.",
    url: SITE.url,
    images: [{ url: "/opengraph-image" }],
    locale: "ko_KR",
  },
  twitter: { card: "summary_large_image", title: "주말에 뭐하지? · 이번 주말 나들이와 문화행사", description: "전국 문화행사·나들이·여행코스를 한곳에서 찾아보세요.", images: ["/opengraph-image"] },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    alternateName: SITE.nameEn,
    url: SITE.url,
    inLanguage: "ko-KR",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE.url}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    email: SITE.email,
  };
  return (
    <html lang="ko">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8120273282543163"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-white font-sans antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
        {/* 게임 상세는 집중 화면(헤더·푸터 숨김), 그 외는 사이트 크롬 유지 */}
        <ChromeGate header={<Header />} footer={<Footer />} floating={<FloatingShare />}>
          {children}
        </ChromeGate>
        <Analytics />
      </body>
    </html>
  );
}
