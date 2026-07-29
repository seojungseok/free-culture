import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = SITE.url.replace(/\/$/, "");
  // 필터 쿼리(?area=·?cat=·?type=·?q= 등)는 대표 URL의 중복본 → 크롤 차단.
  //  대역폭↓(no-store 오리진 렌더 방지) + 중복 색인↓(SEO 이득). 정적 라우트(/food/[지역]/[업종])만 색인.
  const disallowQuery = "/*?*";
  return {
    rules: [
      // 구글: 쿼리만 차단(크롤 딜레이 무시하므로 미지정 — 속도는 Search Console에서 조절)
      { userAgent: "Googlebot", allow: "/", disallow: disallowQuery },
      { userAgent: "Googlebot-Image", allow: "/" },
      // 네이버(Yeti)·다음: 쿼리 차단 + 크롤 딜레이로 부하 분산
      { userAgent: "Yeti", allow: "/", disallow: disallowQuery, crawlDelay: 10 },
      { userAgent: "Daumoa", allow: "/", disallow: disallowQuery, crawlDelay: 10 },
      { userAgent: "bingbot", allow: "/", disallow: disallowQuery, crawlDelay: 10 },
      // 그 외 전체 봇: 쿼리 차단 + 딜레이
      { userAgent: "*", allow: "/", disallow: disallowQuery, crawlDelay: 10 },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
