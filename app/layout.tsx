import type { Metadata } from "next";
import "./globals.css";
import { SITE } from "@/lib/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Analytics from "@/components/Analytics";

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
    title: `${SITE.name} · 전국 무료 전시·공연 정보`,
    description: SITE.description,
    url: SITE.url,
    locale: "ko_KR",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-white font-sans antialiased">
        <Header />
        {/* 콘텐츠 자연 흐름 — 푸터가 내용 바로 뒤에 옴. 짧은 페이지에선 흰 배경이 푸터와 이어져 빈 띠가 안 생김 */}
        <main className="w-full">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
