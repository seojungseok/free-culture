import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = SITE.url.replace(/\/$/, "");
  // Restrict known faceted duplicates, not all query URLs: Next assets carry ?dpl
  // and search pages must be crawlable for their noindex directive to be read.
  const disallowQuery = ['/events','/places','/camping','/food','/course','/season','/date','/kids','/pet-travel','/weekend']
    .map(route => `${route}?*`);
  const allow = ["/", "/_next/", "/api/"];
  return {
    rules: [
      { userAgent: "Googlebot", allow, disallow: disallowQuery },
      { userAgent: "Googlebot-Image", allow: "/" },
      { userAgent: "Yeti", allow, disallow: disallowQuery, crawlDelay: 10 },
      { userAgent: "Daumoa", allow, disallow: disallowQuery, crawlDelay: 10 },
      { userAgent: "bingbot", allow, disallow: disallowQuery, crawlDelay: 10 },
      { userAgent: "*", allow, disallow: disallowQuery, crawlDelay: 10 },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
