import type { Metadata } from "next";
import HomeExplorer, { type HomeItem } from "@/components/HomeExplorer";
import { getWeekend, getFree } from "@/lib/data";
import { getAllPlaces } from "@/lib/tour";
import { getAllCourses, slimCourse } from "@/lib/courses";
import { getAllCamps } from "@/lib/camping";
import { getDateCourses } from "@/lib/dateCourses";
import { SIDO_LIST, SIDO_SLUG } from "@/lib/classify";
import { SITE } from "@/lib/site";
import { fmtRange } from "@/lib/format";
import { todayYmd } from "@/lib/dates";
import { eventContentsText } from "@/lib/eventContents";
import { filterSeasonPlaces } from "@/lib/season";
import { getPrepArticles } from "@/lib/weekend-prep/data";
import { getAllArticles } from "@/lib/articles";
import { hasSubstantivePlaceInfo, hasSubstantiveCampInfo } from "@/lib/placeQuality";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: { absolute: "이번 주말 어디 가지? 전국 가볼만한 곳·축제·여행코스 추천 · 주말에 뭐하지?" },
  description: "이번 주말 갈 만한 전국 문화행사·나들이·여행코스를 지역과 테마로 빠르게 찾아보세요. 무료 행사, 아이와 갈 곳, 데이트 코스도 한곳에 모았습니다.",
  alternates: { canonical: "/" },
};

const regionGroups: Record<string, string[]> = {
  서울: ["서울"], 경기: ["경기"], 인천: ["인천"], 강원: ["강원"],
  충청: ["충북", "충남", "대전", "세종"], 경상: ["경북", "경남", "부산", "대구", "울산"],
  전라: ["전북", "전남", "광주"], 제주: ["제주"], 전국: [],
};

function eventItem(event: ReturnType<typeof getWeekend>[number]): HomeItem {
  return { id: `event-${event.id}`, href: `/event/${event.id}`, title: eventContentsText(event.title), meta: [event.area, fmtRange(event.startDate, event.endDate)].filter(Boolean).join(" · "), image: event.imgUrl || "", badge: event.realmName || "문화행사", area: event.area, start: event.startDate, end: event.endDate };
}

function mixForRegion(groups: HomeItem[][], limit = 8): HomeItem[] {
  const mixed: HomeItem[] = [];
  for (let index = 0; mixed.length < limit; index++) {
    let added = false;
    for (const group of groups) {
      if (group[index]) { mixed.push(group[index]); added = true; }
      if (mixed.length === limit) break;
    }
    if (!added) break;
  }
  return Array.from(new Map(mixed.map((item) => [item.id, item])).values()).slice(0, limit);
}

function rotateItems(items: HomeItem[], key: string): HomeItem[] {
  if (items.length < 2) return items;
  const offset = Array.from(key).reduce((sum, char) => sum + char.charCodeAt(0), 0) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

export default function HomePage() {
  const weekendEvents = getWeekend().filter((item) => item.imgUrl);
  const today = todayYmd();
  const places = getAllPlaces().filter((item) => item.image && hasSubstantivePlaceInfo(item.id));
  const courses = getAllCourses().map(slimCourse).filter((item) => item.image);
  const camps = getAllCamps().filter((item) => item.image && hasSubstantiveCampInfo(item));
  const dateCourses = getDateCourses().filter((item) => item.image);
  const placeItems: HomeItem[] = places.map((item) => ({ id: `place-${item.id}`, href: `/places/spot/${item.id}`, title: item.title, meta: item.area, image: item.image, badge: item.isKid ? "아이와" : "나들이", area: item.area }));
  const courseItems: HomeItem[] = courses.map((item) => ({ id: `course-${item.id}`, href: `/course/c/${item.id}`, title: item.title, meta: [item.area, item.duration].filter(Boolean).join(" · "), image: item.image, badge: "여행코스", area: item.area }));
  const campItems: HomeItem[] = camps.map((item) => ({ id: `camp-${item.id}`, href: `/camping/${item.id}`, title: item.name, meta: [item.area, item.sigungu].filter(Boolean).join(" · "), image: item.image, badge: "캠핑", area: item.area }));
  const dateItems: HomeItem[] = dateCourses.map((item) => ({ id: `date-${item.id}`, href: `/date/c/${item.id}`, title: item.title, meta: `${item.area} ${item.city} · 도보 이동 약 ${item.walkMin}분`, image: item.image, badge: "데이트 코스", area: item.area }));
  const weekendItems = weekendEvents.map(eventItem);
  const regional = Object.fromEntries(Object.entries(regionGroups).map(([region, areas]) => {
    const within = <T extends { area?: string }>(items: T[]) => areas.length ? items.filter((item) => item.area && areas.includes(item.area)) : items;
    const items = mixForRegion([within(weekendItems), within(placeItems), within(courseItems), within(campItems), within(dateItems)]);
    return [region, rotateItems(items, `${today}:${region}`)];
  }));
  const freeItems = getFree(true).filter((item) => item.imgUrl && item.endDate >= today).slice(0, 8).map((item) => ({ ...eventItem(item), badge: item.priceLabel || "무료 여부 확인" }));
  const kidItems = placeItems.filter((_, index) => places[index]?.isKid).slice(0, 6);
  const seasonItems: HomeItem[] = filterSeasonPlaces().filter((item) => hasSubstantivePlaceInfo(item.id)).slice(0, 8).map((item) => ({ id: `season-${item.id}`, href: `/places/spot/${item.id}`, title: item.title, meta: item.area, image: item.image, badge: "계절 나들이", area: item.area }));
  const prepItems: HomeItem[] = getPrepArticles().slice(0, 8).map((item) => ({ id: `prep-${item.slug}`, href: `/weekend-prep/${item.slug}`, title: item.title, meta: item.category, image: item.cover.url, badge: "준비 가이드" }));
  const publishedPlaces = getAllArticles().filter((article) => article.status === "published" && article.publishedAt && article.content.length >= 300).sort((a, b) => Date.parse(b.publishedAt || "") - Date.parse(a.publishedAt || ""));
  const byPlaceId = new Map(placeItems.map((item) => [item.id.slice(6), item]));
  const editorialPlaces = publishedPlaces.map((article) => byPlaceId.get(article.id)).filter((item): item is HomeItem => Boolean(item));
  const representativeItems = editorialPlaces.slice(-6).reverse();
  const newItems = editorialPlaces.filter((item) => !representativeItems.some((representative) => representative.id === item.id)).slice(0, 6);
  return <HomeExplorer regional={regional} eventItems={weekendItems.slice(0, 8)} kidItems={kidItems} dateItems={dateItems.slice(0, 6)} campItems={campItems.slice(0, 6)} courseItems={courseItems.filter((_, index) => courses[index].duration === "당일").slice(0, 6)} seasonItems={seasonItems} prepItems={prepItems} placeItems={representativeItems} newItems={newItems} freeItems={freeItems} regions={SIDO_LIST.map((name) => ({ name, href: `/region/${(SIDO_SLUG as Record<string, string>)[name]}` }))} siteName={SITE.name} />;
}
