import type { Course, CourseStop } from "@/lib/courses";
import { selectCourseStops, splitCourseDays } from "@/lib/courseSelect";
import { getAllPlaces, getTourById, isCampingDupe, campingDupeTarget, samePlaceTarget, type TourSpot } from "@/lib/tour";
import { getAllCamps } from "@/lib/camping";
import { getAllRestaurants } from "@/lib/food";
import courseDetailsData from '@/data/course-place-details.json';
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
type CourseDestination = TourSpot & {detailHref?:string;sourceOnly?:boolean;visitFacts?:{label:string;value:string}[];sourceCollectedAt?:string};
const camps=getAllCamps(), foods=new Map(getAllRestaurants().map(p=>[p.id,p]));
const courseDetails=courseDetailsData as unknown as {places:Record<string,{id:string;title:string;type:string;addr:string;mapx:string;mapy:string;tel:string;homepage:string;overview:string;intro?:Record<string,string>;introCheckedAt?:string;info?:{name:string;text:string}[]}>};
const sourceFactLabels:Record<string,string>={usetime:'이용시간',restdate:'휴무일',parking:'주차',fee:'이용요금',reservation:'예약',openperiod:'운영기간',infocenter:'문의처',expguide:'체험 안내',firstmenu:'대표 메뉴',playtime:'공연시간',program:'프로그램',agelimit:'관람연령'};
export function resolveCoursePlace(stop: CourseStop, area: string): CourseDestination | undefined {
  if (stop.placeId) {
    const id = samePlaceTarget(stop.placeId) || stop.placeId;
    const exactId = placesById.get(id);
    if (exactId) return exactId;
    const raw=getTourById(id);
    if(raw&&isCampingDupe(id)) {
      const target=campingDupeTarget(id);
      const matches=target?camps.filter(c=>c.id===target):camps.filter(c=>fullName(c.name)===fullName(raw.title)&&c.area===raw.area&&distanceKm(raw,c)<1);
      if(matches.length===1) {
        const camp=matches[0];
        return {...raw,addr:camp.addr,mapx:camp.mapx,mapy:camp.mapy,detailHref:`/camping/${camp.id}`,visitFacts:[{label:'예약',value:camp.resve},{label:'운영기간',value:camp.operPd},{label:'문의처',value:camp.tel},{label:'동반 조건',value:camp.petRaw}].filter(f=>isUsefulVisitText(f.value))};
      }
      return {...raw,sourceOnly:true};
    }
    const food=foods.get(id);
    if(food) return {...food,type:'39',detailHref:`/food/spot/${food.id}`};
    const proof=stop.placeIdSource;
    if(proof&&['detailInfo2','searchKeyword2'].includes(proof.endpoint)&&proof.subcontentid===id&&fullName(proof.subname)===fullName(stop.name)) {
      const detail=courseDetails.places[id];
      if(detail?.id===id) return {id,title:detail.title,type:detail.type,addr:detail.addr,area:'',image:stop.image,mapx:detail.mapx,mapy:detail.mapy,tel:detail.tel,homepage:detail.homepage,overview:detail.overview||stop.sourceOverview||stop.overview,sourceOnly:true,sourceCollectedAt:detail.introCheckedAt,visitFacts:Object.entries(detail.intro||{}).filter(([key,value])=>sourceFactLabels[key]&&isUsefulVisitText(value)).map(([key,value])=>({label:sourceFactLabels[key],value}))};
      return {id,title:proof.subname,addr:stop.addr||'',area:'',image:stop.image,mapx:stop.mapx||'',mapy:stop.mapy||'',tel:'',type:'',overview:stop.sourceOverview||stop.overview,sourceOnly:true,sourceCollectedAt:proof.checkedAt};
    }
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
  sourceOverview?: string;
  sourceProvider?: string;
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

const planningLabels = new Set(["이용시간", "영업시간", "휴무일", "이용요금", "예약", "운영기간", "주차", "문의처", "동반 조건", "체험 안내", "대표 메뉴", "공연시간", "프로그램", "관람연령"]);
function enrichStop(stop: CourseStop, area: string): CourseVisitStop {
  const place = resolveCoursePlace(stop, area);
  const coords = place && Number.isFinite(distanceKm(place, place)) ? place : stop;
  const mapx = coords.mapx || "", mapy = coords.mapy || "";
  const address = displayAddress(place?.addr || stop.addr || "");
  const facts = place ? (place.visitFacts || introRows(place.id))
    .filter((row) => planningLabels.has(row.label))
    .map((row) => ({ label: row.label, value: eventContentsText(row.value) }))
    .filter((row) => isUsefulVisitText(row.value)) : [];
  return {
    ...stop,
    ...(place ? { placeId: place.id, ...(!place.sourceOnly?{detailHref:place.detailHref||`/places/spot/${place.id}`}:{}) } : {}),
    ...(place?.sourceOnly&&place.overview?{sourceOverview:eventContentsText(place.overview),sourceProvider:'한국관광공사 공식 코스'}:{}),
    mapx, mapy, address, facts, area: place?.area || area,
    ...(place&&(place.sourceCollectedAt||getIntro(place.id)?.checkedAt)?{sourceCollectedAt:place.sourceCollectedAt||getIntro(place.id)!.checkedAt}:{}),
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
