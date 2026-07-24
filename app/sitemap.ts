import type { MetadataRoute } from "next";
import { getAllEvents } from "@/lib/data";
import { GENRES, SIDO_SLUG } from "@/lib/classify";
import { SITE } from "@/lib/site";

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

  const eventRoutes = getAllEvents().map((e) => ({
    url: `${base}/event/${e.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...regionRoutes, ...genreRoutes, ...eventRoutes];
}
