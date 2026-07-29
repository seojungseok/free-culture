import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = SITE.url.replace(/\/$/, "");
  // 필터 쿼리(?area= 등)는 대표 URL 중복본 → 상시 차단(대역폭·중복색인↓).
  const disallowQuery = "/*?*";

  // ⚠️ 2026-07-29 ISR Writes 100% 임시 방어 — 크롤로 재생성(=Writes)되는 "온디맨드 상세"만 차단.
  //   정적 페이지(홈·목록·허브·조합: /food/[지역]/[업종], /camping/region·type 등)는 크롤 유지 → SEO 손실 최소.
  //   다음 달 Writes 리셋되면 아래 disallowDetails 를 제거(빈 배열)해 상세 색인 재개할 것.
  const disallowDetails = ["/places/spot/", "/event/", "/camping/"];
  // 캠핑 정적 허브는 계속 크롤 허용(상세 /camping/[id]만 차단하려는 것)
  const allowCampStatic = ["/camping/region/", "/camping/type/", "/camping/collections/"];
  const blockDetails = [disallowQuery, ...disallowDetails];

  return {
    rules: [
      // 구글: 쿼리 + 상세 임시 차단. 정적 허브·목록은 계속 크롤.
      { userAgent: "Googlebot", allow: ["/", ...allowCampStatic], disallow: blockDetails },
      { userAgent: "Googlebot-Image", allow: "/" },
      { userAgent: "Yeti", allow: ["/", ...allowCampStatic], disallow: blockDetails, crawlDelay: 10 },
      { userAgent: "Daumoa", allow: ["/", ...allowCampStatic], disallow: blockDetails, crawlDelay: 10 },
      { userAgent: "bingbot", allow: ["/", ...allowCampStatic], disallow: blockDetails, crawlDelay: 10 },
      { userAgent: "*", allow: ["/", ...allowCampStatic], disallow: blockDetails, crawlDelay: 10 },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
