import type { Course, CourseStop } from "@/lib/courses";
import { selectCourseStops, splitCourseDays } from "@/lib/courseSelect";
import { getAllPlaces, samePlaceTarget, type TourSpot } from "@/lib/tour";
import { getIntro, introRows, isUsefulVisitText } from "@/lib/tourExtra";
import { distanceKm } from "@/lib/nearby";
import { eventContentsText } from "@/lib/eventContents";
import { displayAddress } from "@/lib/address";

const places = getAllPlaces();
const placesById = new Map(places.map((place) => [place.id, place]));
const fullName = (name: string) => name.replace(/\s+/g, "").trim();
const baseName = (name: string) => fullName(name.replace(/\([^)]*\)/g, ""));
const fullNames = new Map<string, TourSpot[]>();
const localBaseNames = new Map<string, TourSpot[]>();
for (const place of places) {
  const full = fullName(place.title);
  fullNames.set(full, [...(fullNames.get(full) || []), place]);
  const local = `${place.area}|${baseName(place.title)}`;
  localBaseNames.set(local, [...(localBaseNames.get(local) || []), place]);
}

/** Never attach opening hours or a detail URL using a partial name match. */
export function resolveCoursePlace(stop: CourseStop, area: string): TourSpot | undefined {
  if (stop.placeId) {
    const id = samePlaceTarget(stop.placeId) || stop.placeId;
    const exactId = placesById.get(id);
    if (exactId) return exactId;
  }
  const exact = fullNames.get(fullName(stop.name)) || [];
  // Official routes can cross a provincial border. A nationally unique full
  // name remains usable; ambiguous names must be unique within this region.
  if (exact.length === 1) return exact[0];
  const localExact = exact.filter((place) => place.area === area);
  if (localExact.length === 1) return localExact[0];
  if (exact.length > 1) return undefined;
  const localBase = localBaseNames.get(`${area}|${baseName(stop.name)}`) || [];
  return localBase.length === 1 ? localBase[0] : undefined;
}

export interface CourseVisitStop extends CourseStop {
  area: string;
  address: string;
  detailHref?: string;
  mapHref: string;
  facts: { label: string; value: string }[];
  sourceCollectedAt?: string;
}
export interface CourseVisitDay {
  stops: CourseVisitStop[];
  /** One entry per pair of adjacent stops. Null means no usable coordinates. */
  segmentsKm: (number | null)[];
  totalStraightKm: number | null;
}
export interface CourseVisitPlan {
  days: CourseVisitDay[];
  hasVisitFacts: boolean;
}

const planningLabels = new Set(["이용시간", "휴무일", "이용요금", "예약", "운영기간", "주차", "문의처"]);
function enrichStop(stop: CourseStop, area: string): CourseVisitStop {
  const place = resolveCoursePlace(stop, area);
  const coords = place && Number.isFinite(distanceKm(place, place)) ? place : stop;
  const mapx = coords.mapx || "", mapy = coords.mapy || "";
  const address = displayAddress(place?.addr || stop.addr || "");
  const facts = place ? introRows(place.id)
    .filter((row) => planningLabels.has(row.label))
    .map((row) => ({ label: row.label, value: eventContentsText(row.value) }))
    .filter((row) => isUsefulVisitText(row.value)) : [];
  return {
    ...stop,
    ...(place ? { placeId: place.id, detailHref: `/places/spot/${place.id}` } : {}),
    mapx, mapy, address, facts, area: place?.area || area,
    ...(place && getIntro(place.id)?.checkedAt ? { sourceCollectedAt: getIntro(place.id)!.checkedAt } : {}),
    mapHref: Number.isFinite(distanceKm({ mapx, mapy }, { mapx, mapy }))
      ? `https://map.kakao.com/link/map/${encodeURIComponent(stop.name)},${mapy},${mapx}`
      : `https://map.kakao.com/link/search/${encodeURIComponent(`${address || area} ${stop.name}`)}`,
  };
}

/** Stored facts and coordinate distances only; no rendering-time API requests. */
export function courseVisitPlan(course: Course): CourseVisitPlan {
  const stops = (selectCourseStops(course) as CourseStop[])
    .filter((stop) => stop.name.trim())
    .map((stop) => enrichStop(stop, course.area));
  const dayStops = course.format === "list" ? [stops] : splitCourseDays(stops, course.duration) as CourseVisitStop[][];
  const days: CourseVisitDay[] = dayStops.filter((day) => day.length).map((day) => {
    const segmentsKm = course.format === "list" ? [] : day.slice(1).map((stop, index) => {
      const distance = distanceKm(day[index], stop);
      return Number.isFinite(distance) ? distance : null;
    });
    const totalStraightKm = segmentsKm.length && segmentsKm.every((distance) => distance !== null)
      ? segmentsKm.reduce<number>((total, distance) => total + (distance ?? 0), 0)
      : null;
    return { stops: day, segmentsKm, totalStraightKm };
  });
  return {
    days,
    hasVisitFacts: stops.some((stop) => stop.facts.length > 0),
  };
}
