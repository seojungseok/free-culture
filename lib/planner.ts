/** Client-safe planner rules. No API, geolocation, or paid service calls. */
export type TripStop = {
  id: string; title: string; href: string; area: string; kind: "place" | "event" | "food" | "camp" | "course" | "pet";
  address?: string; image?: string; x?: number; y?: number; free?: boolean; kids?: boolean; start?: string; end?: string;
  summary?: string; hoursText?: string; restText?: string; parkingText?: string; parkingAvailable?: boolean; accessText?: string; wheelchairEntry?: boolean; walk?: boolean; culture?: boolean;
};
export type TripOption = { anchor: TripStop; nearby: TripStop[] };
export type SavedTrip = { id: string; title: string; date?: string; stops: TripStop[] };
export type PlanPreferences = { area: string; date: string; hours: number; kids: boolean; free: boolean; purpose?: string; meal?: boolean; parking?: string; access?: string; query?: string };
export function validCoordinates(x: number, y: number) {
  return Number.isFinite(x) && Number.isFinite(y) && x >= 124 && x <= 132 && y >= 33 && y <= 39.5;
}
export function straightKm(a: TripStop, b: TripStop): number {
  if (!validCoordinates(a.x!, a.y!) || !validCoordinates(b.x!, b.y!)) return Infinity;
  const rad = Math.PI / 180;
  const dLat = (b.y! - a.y!) * rad, dLon = (b.x! - a.x!) * rad;
  const h = Math.sin(dLat/2)**2 + Math.cos(a.y!*rad)*Math.cos(b.y!*rad)*Math.sin(dLon/2)**2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
export function isActive(stop: TripStop, date: string) {
  if (stop.kind !== "event") return true;
  return !!stop.start && !!stop.end && stop.start <= date && stop.end >= date;
}
export function makePlans(options: TripOption[], p: PlanPreferences): SavedTrip[] {
  const date = p.date.replace(/-/g, "");
  if (!/^\d{8}$/.test(date)) return [];
  const eligible = (s: TripStop) => isActive(s, date) && (!p.kids || s.kids === true) && (!p.free || s.kind==='food' && p.meal || s.free === true) &&
    (p.parking!=='required'||s.parkingAvailable===true) && (!p.access||p.access==='any'||p.access==='info'&&!!s.accessText||p.access==='wheelchair'&&s.wheelchairEntry===true);
  const purpose=(s:TripStop)=>!p.purpose||p.purpose==='all'||p.purpose==='walk'&&s.walk===true||p.purpose==='culture'&&s.culture===true||p.purpose==='event'&&s.kind==='event'||p.purpose==='food'&&s.kind==='food';
  const matches = options.filter(o => (!p.area || o.anchor.area === p.area) && eligible(o.anchor)&&purpose(o.anchor)&&(!p.query||[o.anchor.title,o.anchor.address].join(' ').includes(p.query.trim())));
  const used = new Set<string>();
  const result: SavedTrip[] = [];
  // Events with a verified date first, followed by places. Stable ordering, not a popularity ranking.
  const events = matches.filter(o=>o.anchor.kind==="event"), places = matches.filter(o=>o.anchor.kind!=="event");
  const ordered: TripOption[] = [];
  for (let i=0;i<Math.max(events.length,places.length);i++) {if(events[i])ordered.push(events[i]);if(places[i])ordered.push(places[i]);}
  if(p.parking==='prefer')ordered.sort((a,b)=>Number(!!b.anchor.parkingAvailable)-Number(!!a.anchor.parkingAvailable));
  for (const o of ordered) {
    if (used.has(o.anchor.href)) continue;
    const maxStops = p.hours === 0 ? 3 : p.hours <= 2 ? 1 : p.hours <= 4 ? 2 : p.hours >= 8 ? 4 : 3;
    const stops = [o.anchor];
    const meal = p.meal&&o.anchor.kind!=='food' ? o.nearby.find(s=>s.kind==='food'&&eligible(s)&&(!p.area||s.area===p.area)&&!used.has(s.href)&&straightKm(o.anchor,s)<=3) : undefined;
    if(p.meal&&o.anchor.kind!=='food'&&!meal)continue;
    for (const s of o.nearby) {
      if (stops.length >= maxStops-(meal?1:0)) break;
      if (s.kind!=='food' && purpose(s) && eligible(s) && (!p.area||s.area===p.area) && !used.has(s.href) && !stops.some(t => t.href === s.href) && straightKm(stops[stops.length-1], s) <= 3 && (!meal||straightKm(s,meal)<=3)) stops.push(s);
    }
    if(meal)stops.push(meal);
    stops.forEach(s => used.add(s.href));
    result.push({ id: "plan:" + date + ":" + stops.map(s=>s.id).join(":"), title: o.anchor.title + (stops.length > 1 ? " 주변 나들이" : " 방문 후보"), date: p.date, stops });
    if (result.length === 3) break;
  }
  return result;
}
export const SAVED_KEY = "mwohaji.saved.v1";
export function validStop(v: unknown): v is TripStop {
  if (!v || typeof v !== "object") return false;
  const s = v as TripStop;
  return typeof s.id === "string" && s.id.length <= 200 && typeof s.title === "string" && s.title.length <= 300 &&
    typeof s.area === "string" && s.area.length <= 40 &&
    typeof s.href === "string" && /^\/(?:places\/spot|event|food\/spot|camping|course\/c|date\/c|pet-travel|city-tour)\/[a-zA-Z0-9_-]+$/.test(s.href) &&
    ["place","event","food","camp","course","pet"].includes(s.kind);
}
export function parseSaved(raw: string | null): SavedTrip[] {
  try {
    const value: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((v): v is SavedTrip => !!v && typeof v.id === "string" && v.id.length <= 1000 &&
      typeof v.title === "string" && v.title.length <= 400 &&
      (v.date === undefined || (typeof v.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.date))) &&
      Array.isArray(v.stops) && v.stops.length > 0 && v.stops.length <= 12 && v.stops.every(validStop)).slice(0,100);
  } catch { return []; }
}
