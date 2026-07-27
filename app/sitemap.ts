import type { MetadataRoute } from "next";
import { getAllEvents } from "@/lib/data";
import { getAllPlaces, getTourAreaCounts } from "@/lib/tour";
import { getAllCamps } from "@/lib/camping";
import { GENRES, SIDO_LIST, SIDO_SLUG } from "@/lib/classify";
import { SITE } from "@/lib/site";

const isFree = (t: string) => t === "free" || t === "free_estimated";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes = [
    "",
    "/events",
    "/places",
    "/camping",
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
    priority: p === "" ? 1 : p === "/events" || p === "/places" ? 0.9 : 0.7,
  }));

  const regionRoutes = Object.values(SIDO_SLUG).map((code) => ({
    url: `${base}/region/${code}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // 가볼만한 곳 지역별 (관광지 데이터 있는 지역만)
  const placeAreaRoutes = getTourAreaCounts().map(({ area }) => ({
    url: `${base}/places/${(SIDO_SLUG as Record<string, string>)[area]}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // 가볼만한 곳 상세 (전량 — 롱테일 색인)
  const placeSpotRoutes = getAllPlaces().map((s) => ({
    url: `${base}/places/spot/${s.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // 캠핑 상세 (전량 — 롱테일 색인)
  const campRoutes = getAllCamps().map((c) => ({
    url: `${base}/camping/${c.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
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

  return [
    ...staticRoutes,
    ...regionRoutes,
    ...placeAreaRoutes,
    ...placeSpotRoutes,
    ...campRoutes,
    ...genreRoutes,
    ...comboRoutes,
    ...eventRoutes,
  ];
}
