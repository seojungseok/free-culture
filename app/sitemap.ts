import type { MetadataRoute } from "next";
import { getAllEvents } from "@/lib/data";
import { getAllPlaces, getTourAreaCounts } from "@/lib/tour";
import { getAllCamps, campAreaCounts } from "@/lib/camping";
import { getAllRestaurants, foodAreas } from "@/lib/food";
import { getAllArticles } from "@/lib/articles";
import {
  getAllCourses, getCourseAreaCounts, isIndexableCourse,
} from "@/lib/courses";
import { GENRES, SIDO_SLUG } from "@/lib/classify";
import { SITE } from "@/lib/site";
import { getAllFestivals } from "@/lib/festivals";
import { getCityTours } from "@/lib/cityTours";
import { getPetTravelPlaces } from "@/lib/petTravel";
import { getPrepArticles, isCookingPrepArticle } from '@/lib/weekend-prep/data';
import { hasSubstantivePlaceInfo, hasSubstantiveRestaurantInfo, hasSubstantiveCampInfo } from "@/lib/placeQuality";
import { hasSubstantiveEventInfo } from "@/lib/eventQuality";
import { monthRangeYmd, todayYmd } from "@/lib/dates";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/$/, "");
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

  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const currentMonth = kstNow.getUTCMonth() + 1;
  const currentYear = kstNow.getUTCFullYear();
  const allEvents = getAllEvents();
  const monthlyRoutes = Array.from({ length: 12 }, (_, i) => i + 1).filter((month) => {
    if (month < currentMonth) return false;
    const range = monthRangeYmd(currentYear, month - 1);
    return allEvents.filter((event) => event.startDate <= range.end && event.endDate >= range.start).length >= 3;
  }).map((month) => ({
    url: `${base}/month/${month}`,

    changeFrequency: "daily" as const,
    priority: month === currentMonth ? 0.8 : 0.6,
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

  // 캠핑 지역 허브는 유지하고 유형 필터는 탐색용으로만 제공한다.
  const campRegionRoutes = campAreaCounts().map(({ area }) => ({
    url: `${base}/camping/region/${(SIDO_SLUG as Record<string, string>)[area]}`,

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

  // 분야 허브는 유지하고 지역×분야 필터는 탐색용으로만 제공한다.
  const eventRoutes = allEvents.filter((e) => e.endDate >= todayYmd() && hasSubstantiveEventInfo(e)).map((e) => ({
    url: `${base}/event/${e.id}`,

    changeFrequency: "weekly" as const,
    priority: 0.4,
  }));

  const festivalRoutes = getAllFestivals().filter((festival) => !festival.id.startsWith("event-") && festival.endDate >= todayYmd() && (festival.description || "").trim().length >= 150).map((festival) => ({
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
  // 기간·테마 목록은 개별 편집 콘텐츠 없이 같은 코스를 다시 나열하므로 탐색용으로만 둔다.
  // 개별 코스 상세 (/course/c/[id])
  const courseDetailRoutes = getAllCourses().filter((c) => isIndexableCourse(c.id)).map((c) => ({
    url: `${base}/course/c/${c.id}`,
    lastModified: c.publishedAt && Number.isFinite(Date.parse(c.publishedAt)) ? new Date(c.publishedAt) : undefined,
    changeFrequency: "monthly" as const, priority: 0.6,
  }));

  return [
    // 1) 홈·주요 목록·허브 (높은 우선순위 — 크롤 예산 집중)
    ...staticRoutes,
    ...monthlyRoutes,
    ...regionRoutes,
    ...genreRoutes,
    ...placeAreaRoutes,
    ...foodAreaRoutes,
    ...campRegionRoutes,
    ...courseAreaRoutes,
    ...dateRoutes,
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
