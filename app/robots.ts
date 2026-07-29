import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = SITE.url.replace(/\/$/, "");
  // 필터 쿼리(?area=·?cat= 등)는 대표 URL의 중복본 → 상시 차단(대역폭·중복색인↓).
  //  (Pro 전환으로 상세 크롤 차단은 해제 — ISR Writes 여유. 상세 색인 재개.)
  const disallowQuery = "/*?*";
  return {
    rules: [
      { userAgent: "Googlebot", allow: "/", disallow: disallowQuery },
      { userAgent: "Googlebot-Image", allow: "/" },
      { userAgent: "Yeti", allow: "/", disallow: disallowQuery, crawlDelay: 10 },
      { userAgent: "Daumoa", allow: "/", disallow: disallowQuery, crawlDelay: 10 },
      { userAgent: "bingbot", allow: "/", disallow: disallowQuery, crawlDelay: 10 },
      { userAgent: "*", allow: "/", disallow: disallowQuery, crawlDelay: 10 },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
