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
import { getAllFestivals } from "@/lib/festivals";
import { getCityTours } from "@/lib/cityTours";
import { getPetTravelPlaces } from "@/lib/petTravel";
import { getPrepArticles, isCookingPrepArticle } from '@/lib/weekend-prep/data';
import { hasSubstantivePlaceInfo, hasSubstantiveRestaurantInfo, hasSubstantiveCampInfo } from "@/lib/placeQuality";
import { hasSubstantiveEventInfo } from "@/lib/eventQuality";
import { todayYmd } from "@/lib/dates";

const COURSE_INDEX_MIN = 3; // 얇은 조합은 sitemap 제외(구글 크롤 예산 보호)

const isFree = (t: string) => t === "free";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/$/, "");
  const now = new Date();

  // 주요 목록/홈은 높은 우선순위·잦은 갱신. 정보성 정적 페이지는 낮게.
  const MAJOR = new Set(["/events", "/festivals", "/places", "/course", "/camping", "/food"]);
  const LOW = new Set(["/about", "/privacy", "/terms", "/contact"]);
  const staticRoutes = [
    ...(getPrepArticles().length ? ['/weekend-prep'] : []),
    ...(getPrepArticles().some(isCookingPrepArticle) ? ['/camping/cooking'] : []),
    "",
    "/events",
    "/festivals",
    "/places",
    "/course",
    "/city-tour",
    "/camping",
    "/food",
    "/pet-travel",
    "/free",
    "/cheap",
    "/weekend",
    "/ending-soon",
    "/kids",
    "/season",
    "/about",
    "/privacy",
    "/terms",
    "/contact",
  ].map((p) => ({
    url: `${base}${p}`,

    changeFrequency: LOW.has(p) ? ("monthly" as const) : ("daily" as const),
    priority: p === "" ? 1 : MAJOR.has(p) ? 0.9 : LOW.has(p) ? 0.3 : 0.6,
  }));

  const monthlyRoutes = Array.from({ length: 12 }, (_, i) => ({
    url: `${base}/month/${i + 1}`,

    changeFrequency: "daily" as const,
    priority: i + 1 === now.getMonth() + 1 ? 0.8 : 0.6,
  }));

  const regionRoutes = Object.values(SIDO_SLUG).map((code) => ({
    url: `${base}/region/${code}`,

    changeFrequency: "daily" as const,
    priority: 0.7,
  }));


  // 가볼만한 곳 지역별 (관광지 데이터 있는 지역만)
  const placeAreaRoutes = getTourAreaCounts().map(({ area }) => ({
    url: `${base}/places/${(SIDO_SLUG as Record<string, string>)[area]}`,

    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // 발행글 있는 상세 → 최신 lastmod + 높은 우선순위로 별도 그룹(구글이 새 글 먼저 크롤)
  const articleAt = new Map<string, string>();
  const livePlaceIds = new Set(getAllPlaces().map(p => p.id));
  for (const a of getAllArticles()) {
    if (a.status === "published" && livePlaceIds.has(a.id) && hasSubstantivePlaceInfo(a.id)) articleAt.set(a.id, a.publishedAt || a.generatedAt || "");
  }
  const articleSpotRoutes = [...articleAt].map(([id, at]) => ({
    url: `${base}/places/spot/${id}`,
    lastModified: at && Number.isFinite(Date.parse(at)) ? new Date(at) : undefined,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // 저장된 설명이나 방문 정보가 충분한 장소만 포함한다.
  const placeSpotRoutes = getAllPlaces()
    .filter((s) => !articleAt.has(s.id) && hasSubstantivePlaceInfo(s.id))
    .map((s) => ({
      url: `${base}/places/spot/${s.id}`,

      changeFrequency: "monthly" as const,
      priority: 0.4,
    }));

  // Generated cafe/park/restaurant combinations remain browsable but lack
  // independent editorial content for search indexing.
  const dateRoutes = [{ url: `${base}/date`, changeFrequency: "weekly" as const, priority: 0.7 }];

  // 확인된 영업·메뉴 정보가 있는 음식점만 검색용 목록에 포함한다.
  const restaurantRoutes = getAllRestaurants().filter((r) => hasSubstantiveRestaurantInfo(r.id)).map((r) => ({
    url: `${base}/food/spot/${r.id}`,

    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));

  // 맛집 지역 허브 (/food/[area]) — 데이터 있는 지역만
  const foodAreaRoutes = foodAreas().map((sido) => ({
    url: `${base}/food/${(SIDO_SLUG as Record<string, string>)[sido]}`,

    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // 맛집 전국 업종 (/food/category/[cat]) — "전국 한식 맛집" 등
  const foodCatRoutes = FOOD_CATS.filter((c) => filterRestaurants({ cat3: c.code }).length).map((c) => ({
    url: `${base}/food/category/${c.slug}`,

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

          changeFrequency: "weekly" as const,
          priority: 0.7,
        });
      }
    }
  }

  // 캠핑 지역 허브 (/camping/region/[area]) + 전국 유형 (/camping/type/[type])
  const campRegionRoutes = campAreaCounts().map(({ area }) => ({
    url: `${base}/camping/region/${(SIDO_SLUG as Record<string, string>)[area]}`,

    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  const campTypeRoutes = CAMP_TYPE_SLUG.filter((t) => filterCamps({ type: t.label }).length).map((t) => ({
    url: `${base}/camping/type/${t.slug}`,

    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // 소개 또는 여러 확인된 시설·운영 정보가 있는 캠핑장만 포함한다.
  const campRoutes = getAllCamps().filter(hasSubstantiveCampInfo).map((c) => ({
    url: `${base}/camping/${c.id}`,

    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));

  const genreRoutes = GENRES.map((g) => ({
    url: `${base}/genre/${g.key}`,

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

          changeFrequency: "daily" as const,
          priority: 0.8,
        });
      }
    }
  }

  const eventRoutes = all.filter((e) => e.endDate >= todayYmd() && hasSubstantiveEventInfo(e)).map((e) => ({
    url: `${base}/event/${e.id}`,

    changeFrequency: "weekly" as const,
    priority: 0.4,
  }));

  const festivalRoutes = getAllFestivals().filter((festival) => !festival.id.startsWith("event-") && (festival.description || "").trim().length >= 150).map((festival) => ({
    url: `${base}/festivals/${festival.id}`,

    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // ── 여행코스 ──
  // 지역 허브 (/course/[area])
  const courseAreaRoutes = getCourseAreaCounts().map(({ area }) => ({
    url: `${base}/course/${(SIDO_SLUG as Record<string, string>)[area]}`,

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
           changeFrequency: "weekly" as const, priority: 0.7,
        });
      }
    }
  }
  // 전국 테마 (/course/theme/[theme]) — 코스 ≥3 테마만
  const themeCounts = getThemeCounts();
  const courseThemeRoutes = THEMES.filter((t) => (themeCounts[t.key] || 0) >= COURSE_INDEX_MIN).map((t) => ({
    url: `${base}/course/theme/${t.slug}`,
     changeFrequency: "weekly" as const, priority: 0.7,
  }));
  // 개별 코스 상세 (/course/c/[id])
  const courseDetailRoutes = getAllCourses().map((c) => ({
    url: `${base}/course/c/${c.id}`,
    lastModified: c.publishedAt && Number.isFinite(Date.parse(c.publishedAt)) ? new Date(c.publishedAt) : undefined,
    changeFrequency: "monthly" as const, priority: 0.6,
  }));

  return [
    // 1) 홈·주요 목록·허브 (높은 우선순위 — 크롤 예산 집중)
    ...staticRoutes,
    ...monthlyRoutes,
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
    ...dateRoutes,
    ...courseDurRoutes,
    ...courseThemeRoutes,
    ...getPetTravelPlaces().map(p => ({url: `${base}/pet-travel/${p.id}`, lastModified:p.enrichedAt, changeFrequency: "weekly" as const})),
    // 2) 발행글 있는 상세 (최신 lastmod — 새 글 우선 크롤)
    ...articleSpotRoutes,
    ...courseDetailRoutes,
    ...getCityTours().map(t => ({url: `${base}/city-tour/${t.id}`, lastModified: new Date(t.publishedAt), changeFrequency: "monthly" as const, priority: 0.7})),
    // 3) 대량 롱테일 상세 (낮은 우선순위·가끔)
    ...placeSpotRoutes,
    ...restaurantRoutes,
    ...campRoutes,
    ...eventRoutes,
    ...festivalRoutes,
    ...getPrepArticles().map(a=>({url:`${base}/weekend-prep/${a.slug}`,lastModified:new Date(a.updatedAt),changeFrequency:'monthly' as const,priority:0.6})),
  ];
}
