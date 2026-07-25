import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = SITE.url.replace(/\/$/, "");
  return {
    rules: [
      // 전체 봇 허용
      { userAgent: "*", allow: "/" },
      // 구글
      { userAgent: "Googlebot", allow: "/" },
      { userAgent: "Googlebot-Image", allow: "/" },
      // 네이버 (Yeti) / 다음
      { userAgent: "Yeti", allow: "/" },
      { userAgent: "Daumoa", allow: "/" },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
