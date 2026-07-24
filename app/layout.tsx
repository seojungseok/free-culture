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
      <body className="flex min-h-screen flex-col bg-panel font-sans antialiased">
        <Header />
        {/* flex-1 로 콘텐츠가 짧아도 남는 공간을 본문(회색)이 채워 푸터를 화면 맨 아래에 고정 */}
        <main className="flex w-full flex-1 flex-col">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
