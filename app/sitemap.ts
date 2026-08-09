import type { MetadataRoute } from "next";
import { getAllEvents } from "@/lib/data";
import { getAllPlaces, getTourAreaCounts } from "@/lib/tour";
import { getAllCamps, campAreaCounts, filterCamps, CAMP_TYPE_SLUG } from "@/lib/camping";
import { getAllRestaurants, foodAreas, FOOD_CATS, filterRestaurants } from "@/lib/food";
import { getAllArticles } from "@/lib/articles";
import {
  getAllCourses, getCourseAreaCounts, getDurationCounts, getThemeCounts,
  DURATIONS, THEMES,
} from "@/lib/courses";
import { GENRES, SIDO_LIST, SIDO_SLUG } from "@/lib/classify";
import { SITE } from "@/lib/site";

const COURSE_INDEX_MIN = 3; // 얇은 조합은 sitemap 제외(구글 크롤 예산 보호)

const isFree = (t: string) => t === "free" || t === "free_estimated";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/$/, "");
  const now = new Date();

  // 주요 목록/홈은 높은 우선순위·잦은 갱신. 정보성 정적 페이지는 낮게.
  const MAJOR = new Set(["/events", "/places", "/course", "/camping", "/food"]);
  const LOW = new Set(["/about", "/privacy", "/terms", "/contact"]);
  const staticRoutes = [
    "",
    "/events",
    "/places",
    "/course",
    "/camping",
    "/food",
    "/free",
    "/cheap",
    "/weekend",
    "/ending-soon",
    "/kids",
    "/game",
    "/game/roulette",
    "/game/ladder",
    "/about",
    "/privacy",
    "/terms",
    "/contact",
  ].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: LOW.has(p) ? ("monthly" as const) : ("daily" as const),
    priority: p === "" ? 1 : MAJOR.has(p) ? 0.9 : LOW.has(p) ? 0.3 : 0.6,
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

  // 발행글 있는 상세 → 최신 lastmod + 높은 우선순위로 별도 그룹(구글이 새 글 먼저 크롤)
  const articleAt = new Map<string, string>();
  for (const a of getAllArticles()) {
    if (a.status === "published") articleAt.set(a.id, a.publishedAt || a.generatedAt || now.toISOString());
  }
  const articleSpotRoutes = [...articleAt].map(([id, at]) => ({
    url: `${base}/places/spot/${id}`,
    lastModified: new Date(at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // 가볼만한 곳 상세 (전량 — 롱테일 색인). 발행글 있는 건 위 그룹에서 처리(중복 제외).
  const placeSpotRoutes = getAllPlaces()
    .filter((s) => !articleAt.has(s.id))
    .map((s) => ({
      url: `${base}/places/spot/${s.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    }));

  // 음식점 상세 (전량 — 롱테일 색인, /places/spot/[id]로 렌더)
  const restaurantRoutes = getAllRestaurants().map((r) => ({
    url: `${base}/places/spot/${r.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));

  // 맛집 지역 허브 (/food/[area]) — 데이터 있는 지역만
  const foodAreaRoutes = foodAreas().map((sido) => ({
    url: `${base}/food/${(SIDO_SLUG as Record<string, string>)[sido]}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // 맛집 전국 업종 (/food/category/[cat]) — "전국 한식 맛집" 등
  const foodCatRoutes = FOOD_CATS.filter((c) => filterRestaurants({ cat3: c.code }).length).map((c) => ({
    url: `${base}/food/category/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // 맛집 지역×업종 조합 (/food/[area]/[cat]) — 음식점 ≥1 조합만(검색의도 높은 롱테일)
  const foodComboRoutes: MetadataRoute.Sitemap = [];
  for (const sido of foodAreas()) {
    const areaSlug = (SIDO_SLUG as Record<string, string>)[sido];
    for (const c of FOOD_CATS) {
      if (filterRestaurants({ area: sido, cat3: c.code }).length) {
        foodComboRoutes.push({
          url: `${base}/food/${areaSlug}/${c.slug}`,
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        });
      }
    }
  }

  // 캠핑 지역 허브 (/camping/region/[area]) + 전국 유형 (/camping/type/[type])
  const campRegionRoutes = campAreaCounts().map(({ area }) => ({
    url: `${base}/camping/region/${(SIDO_SLUG as Record<string, string>)[area]}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  const campTypeRoutes = CAMP_TYPE_SLUG.filter((t) => filterCamps({ type: t.label }).length).map((t) => ({
    url: `${base}/camping/type/${t.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // 캠핑 상세 (전량 — 롱테일 색인)
  const campRoutes = getAllCamps().map((c) => ({
    url: `${base}/camping/${c.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.4,
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
    priority: 0.4,
  }));

  // ── 여행코스 ──
  // 지역 허브 (/course/[area])
  const courseAreaRoutes = getCourseAreaCounts().map(({ area }) => ({
    url: `${base}/course/${(SIDO_SLUG as Record<string, string>)[area]}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  // 지역×기간 (/course/[area]/[duration]) — 코스 ≥3 조합만
  const courseDurRoutes: MetadataRoute.Sitemap = [];
  for (const { area } of getCourseAreaCounts()) {
    const dc = getDurationCounts(area);
    for (const d of DURATIONS) {
      if ((dc[d.key] || 0) >= COURSE_INDEX_MIN) {
        courseDurRoutes.push({
          url: `${base}/course/${(SIDO_SLUG as Record<string, string>)[area]}/${d.slug}`,
          lastModified: now, changeFrequency: "weekly" as const, priority: 0.7,
        });
      }
    }
  }
  // 전국 테마 (/course/theme/[theme]) — 코스 ≥3 테마만
  const themeCounts = getThemeCounts();
  const courseThemeRoutes = THEMES.filter((t) => (themeCounts[t.key] || 0) >= COURSE_INDEX_MIN).map((t) => ({
    url: `${base}/course/theme/${t.slug}`,
    lastModified: now, changeFrequency: "weekly" as const, priority: 0.7,
  }));
  // 개별 코스 상세 (/course/c/[id])
  const courseDetailRoutes = getAllCourses().map((c) => ({
    url: `${base}/course/c/${c.id}`,
    lastModified: c.publishedAt ? new Date(c.publishedAt) : now,
    changeFrequency: "monthly" as const, priority: 0.6,
  }));

  return [
    // 1) 홈·주요 목록·허브 (높은 우선순위 — 크롤 예산 집중)
    ...staticRoutes,
    ...regionRoutes,
    ...comboRoutes,
    ...genreRoutes,
    ...placeAreaRoutes,
    ...foodAreaRoutes,
    ...foodCatRoutes,
    ...foodComboRoutes,
    ...campRegionRoutes,
    ...campTypeRoutes,
    ...courseAreaRoutes,
    ...courseDurRoutes,
    ...courseThemeRoutes,
    // 2) 발행글 있는 상세 (최신 lastmod — 새 글 우선 크롤)
    ...articleSpotRoutes,
    ...courseDetailRoutes,
    // 3) 대량 롱테일 상세 (낮은 우선순위·가끔)
    ...placeSpotRoutes,
    ...restaurantRoutes,
    ...campRoutes,
    ...eventRoutes,
  ];
}
