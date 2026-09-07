import { getAllPlaces } from "@/lib/tour";
import { getAllEvents } from "@/lib/data";
import { getAllRestaurants } from "@/lib/food";
import { getAdmission } from "@/lib/fees";
import { todayYmd, addDaysYmd } from "@/lib/dates";
import { straightKm, validCoordinates, type TripStop, type TripOption } from "@/lib/planner";

export function placeStops(): TripStop[] {
  // Undated place records sometimes contain old fairs/festivals. Only dated event records may recommend those.
  return getAllPlaces().filter(p=>!/(?:20\d{2}|축제|페어|박람회|비엔날레|페스티벌|전시회)/.test(p.title)).map(p=>({id:"place:"+p.id,title:p.title,href:"/places/spot/"+p.id,area:p.area,
    kind:"place" as const,image:p.image,address:p.addr,x:Number(p.mapx),y:Number(p.mapy),free:getAdmission(p.id)==="free",kids:!!p.isKid}))
    .filter(p=>validCoordinates(p.x!,p.y!));
}
function eventStops(): TripStop[] {
  return getAllEvents().filter(e=>e.endDate>=todayYmd() && e.startDate<=addDaysYmd(todayYmd(),60))
    .map(e=>({id:"event:"+e.id,title:e.title,href:"/event/"+e.id,area:e.area,kind:"event" as const,
      image:e.imgUrl,address:e.address || e.place,x:Number(e.gpsX),y:Number(e.gpsY),free:e.priceType==="free",
      kids:e.audiences?.includes("kids") || false,start:e.startDate,end:e.endDate}))
    .filter(e=>validCoordinates(e.x!,e.y!));
}
function foodStops(): TripStop[] {
  return getAllRestaurants().map(r=>({id:"food:"+r.id,title:r.title,href:"/food/spot/"+r.id,area:r.area,
    kind:"food" as const,image:r.image,address:r.addr,x:Number(r.mapx),y:Number(r.mapy)})).filter(r=>validCoordinates(r.x!,r.y!));
}
export function nearbyStops(anchor: TripStop, places = placeStops(), food = foodStops()): TripStop[] {
  const tourIds = new Set(getAllPlaces().filter(p=>p.type==="12").map(p=>"place:"+p.id));
  const nearest = (pool: TripStop[], count: number) => pool.filter(s=>s.href!==anchor.href)
    .map(s=>({s,d:straightKm(anchor,s)})).filter(v=>v.d>0.03 && v.d<=3)
    .sort((a,b)=>a.d-b.d).slice(0,count).map(v=>v.s);
  return [...nearest(places.filter(s=>tourIds.has(s.id)),3),...nearest(food,1)];
}
/** Bounded snapshot built on the server/ISR, never fetched from public APIs on a visit. */
export function plannerOptions(): TripOption[] {
  const places = placeStops(), food = foodStops(), events = eventStops();
  const areas = [...new Set(places.map(p=>p.area))].sort();
  const anchors: TripStop[] = [];
  for (const area of areas) {
    // Candidate quality/diversity, not a measured popularity score. Avoid alphabetical gallery-only results.
    const priority = (p: TripStop) => (/어린이|과학|생태|동물원|수목원|공원|박물관|체험|숲/.test(p.title) ? 4 : 0) + (p.free ? 2 : 0) + (p.kids ? 1 : 0);
    const pool = places.filter(p=>p.area===area).sort((a,b)=>priority(b)-priority(a) || a.title.localeCompare(b.title,"ko"));
    const candidates = [...events.filter(e=>e.area===area).slice(0,12),
      ...pool.filter(p=>p.kids && p.free).slice(0,6),...pool.filter(p=>p.kids).slice(0,6),
      ...pool.filter(p=>p.free).slice(0,6),...pool.slice(0,8)];
    const seen = new Set<string>();
    for (const s of candidates) if (!seen.has(s.href)) { seen.add(s.href); anchors.push(s); }
  }
  return anchors.map(anchor=>({anchor,nearby:nearbyStops(anchor,places,food)}));
}
