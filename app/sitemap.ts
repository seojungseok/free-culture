import type { MetadataRoute } from "next";
import { getAllEvents } from "@/lib/data";
import { GENRES, SIDO_LIST, SIDO_SLUG } from "@/lib/classify";
import { SITE } from "@/lib/site";

const isFree = (t: string) => t === "free" || t === "free_estimated";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes = [
    "",
    "/free",
    "/cheap",
    "/weekend",
    "/ending-soon",
    "/kids",
    "/about",
    "/privacy",
    "/terms",
    "/contact",
  ].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  const regionRoutes = Object.values(SIDO_SLUG).map((code) => ({
    url: `${base}/region/${code}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const genreRoutes = GENRES.map((g) => ({
    url: `${base}/genre/${g.key}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // 지역×분야 조합 (무료 행사 ≥1) — generateStaticParams와 동일 기준
  const all = getAllEvents();
  const comboRoutes: MetadataRoute.Sitemap = [];
  for (const sido of SIDO_LIST) {
    for (const g of GENRES) {
      if (g.key === "etc") continue;
      const has = all.some((e) => e.area === sido && e.genreKey === g.key && isFree(e.priceType));
      if (has) {
        comboRoutes.push({
          url: `${base}/region/${(SIDO_SLUG as Record<string, string>)[sido]}/${g.key}`,
          lastModified: now,
          changeFrequency: "daily" as const,
          priority: 0.8,
        });
      }
    }
  }

  const eventRoutes = all.map((e) => ({
    url: `${base}/event/${e.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...regionRoutes, ...genreRoutes, ...comboRoutes, ...eventRoutes];
}
