// 로컬 데이터로만 만드는 "주변 맥락" 근거 블록 — API 호출 0회, 추가 비용 0원.
//
// 왜 필요한가:
//  글이 짧고 동어반복이던 원인은 모델이 아니라 재료였다. overview 3~5문장 + 운영정보 몇 줄로는
//  쓸 말이 없어 같은 문장을 돌려쓰게 된다(실측: 중앙값 948자, 11%가 같은 구절 4회 이상 반복).
//  그런데 이 사이트는 맛집 7,496곳·관광지 10,704곳·코스 1,581개·문화행사 944건을 이미 갖고 있다.
//  상세페이지 하단에는 "주변 맛집·주변 나들이 장소"가 카드로 붙는데, 정작 글은 그걸 모르고 쓰였다.
//  그 데이터를 근거로 넘겨주면 검증된 사실로 분량이 늘고, 독자가 다음 페이지로 넘어갈 이유도 생긴다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (f, fb) => {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, "data", f), "utf8")); } catch { return fb; }
};

const PLACES = read("places.json", { spots: [] }).spots || [];
const RESTAURANTS = read("restaurants.json", { restaurants: [] }).restaurants || [];
const REST_INTRO = read("restaurant-intro.json", { intro: {} }).intro || {};
const EVENTS = read("events.json", { events: [] }).events || [];
const FESTIVALS = read("festivals.json", { festivals: [] }).festivals || [];
const COURSES = [
  ...(read("courses.json", { courses: [] }).courses || []),
  ...(read("courses-auto.json", { courses: [] }).courses || []),
];

// 장소 → 그 장소가 들어간 코스 (stops[].placeId 기준)
const COURSE_BY_PLACE = new Map();
for (const c of COURSES) {
  for (const s of c.stops || []) {
    const k = String(s.placeId || "");
    if (!k) continue;
    if (!COURSE_BY_PLACE.has(k)) COURSE_BY_PLACE.set(k, []);
    COURSE_BY_PLACE.get(k).push(c);
  }
}

function distanceKm(a, b) {
  const toRad = (x) => (x * Math.PI) / 180;
  const la1 = parseFloat(a.mapy), lo1 = parseFloat(a.mapx);
  const la2 = parseFloat(b.mapy), lo2 = parseFloat(b.mapx);
  if (![la1, lo1, la2, lo2].every(Number.isFinite)) return NaN;
  const dLa = toRad(la2 - la1), dLo = toRad(lo2 - lo1);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(toRad(la1)) * Math.cos(toRad(la2)) * Math.sin(dLo / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
const kmLabel = (d) => (d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`);
const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();

const FOOD_TYPE = { A05020100: "한식", A05020200: "서양식", A05020300: "일식", A05020400: "중식", A05020700: "이색음식점", A05020900: "카페·전통찻집" };

/** 같은 시도 안에서 가까운 맛집 n곳 — 대표메뉴가 있는 곳을 우선한다(글에 쓸 게 있는 쪽). */
function nearbyFood(place, n = 3, maxKm = 8) {
  return RESTAURANTS
    .filter((r) => r.area === place.area)
    .map((r) => ({ r, d: distanceKm(place, r) }))
    .filter((x) => Number.isFinite(x.d) && x.d <= maxKm)
    .sort((a, b) => {
      const ma = REST_INTRO[a.r.id]?.firstmenu ? 0 : 1;
      const mb = REST_INTRO[b.r.id]?.firstmenu ? 0 : 1;
      return ma - mb || a.d - b.d;
    })
    .slice(0, n);
}

/** 같은 시도 안에서 가까운 다른 나들이 장소 n곳 */
function nearbySpots(place, n = 4, maxKm = 12) {
  return PLACES
    .filter((p) => p.id !== place.id && p.area === place.area)
    .map((p) => ({ p, d: distanceKm(place, p) }))
    .filter((x) => Number.isFinite(x.d) && x.d <= maxKm && x.d > 0.05)
    .sort((a, b) => a.d - b.d)
    .slice(0, n);
}

/** 오늘 기준 같은 시군구에서 진행중인 문화행사·축제 */
function liveEvents(place, today, n = 3) {
  const city = clean(place.addr).split(" ")[1] || "";
  const key = city.slice(0, 2);
  const out = [];
  if (key) {
    for (const e of EVENTS) {
      if (e.area !== place.area || !clean(e.sigungu).startsWith(key)) continue;
      if (String(e.startDate || "") > today || String(e.endDate || "") < today) continue;
      out.push({ title: e.title, place: e.place, price: e.priceLabel || (e.priceType === "free" ? "무료" : ""), end: e.endDate });
      if (out.length >= n) break;
    }
  }
  for (const f of FESTIVALS) {
    if (out.length >= n) break;
    if (f.area !== place.area) continue;
    if (String(f.startDate || "") > today || String(f.endDate || "") < today) continue;
    out.push({ title: f.title, place: clean(f.addr), price: "", end: f.endDate });
  }
  return out;
}

const ymd = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

/**
 * 프롬프트에 넣을 "주변 맥락" 블록을 만든다.
 * 반환 { text, counts } — text가 빈 문자열이면 넣을 재료가 없다는 뜻.
 */
export function buildLocalContext(place, { today = new Date(), includeEvents = false } = {}) {
  const t = ymd(today);
  const food = nearbyFood(place);
  const spots = nearbySpots(place);
  // 문화행사는 일부러 뺀다: 글은 오래 캐시되는데 행사는 곧 끝나 "낡은 글"이 된다.
  //  대신 상세페이지에서 실시간으로 보여주는 편이 항상 최신이고 내부 링크로도 이어진다.
  const evs = includeEvents ? liveEvents(place, t) : [];
  const courses = (COURSE_BY_PLACE.get(place.id) || []).slice(0, 2);

  const lines = [];
  if (food.length) {
    lines.push("· 근처 맛집(우리 사이트에 등록된 실제 업소, 거리는 직선거리):");
    for (const { r, d } of food) {
      const it = REST_INTRO[r.id] || {};
      const menu = clean(it.firstmenu) || clean(it.treatmenu).split("/")[0].trim();
      const type = FOOD_TYPE[r.cat3] || "";
      lines.push(`   - ${r.title}${type ? ` (${type})` : ""} — ${kmLabel(d)}${menu ? ` · 대표메뉴 ${menu}` : ""}`);
    }
  }
  if (spots.length) {
    lines.push("· 함께 묶어 둘러볼 만한 근처 나들이 장소:");
    for (const { p, d } of spots) lines.push(`   - ${p.title} — ${kmLabel(d)}`);
  }
  if (courses.length) {
    lines.push("· 이 장소가 포함된 여행코스:");
    for (const c of courses) lines.push(`   - ${c.title}${c.duration ? ` (${c.duration})` : ""}`);
  }
  if (evs.length) {
    lines.push(`· 지금 이 지역에서 열리는 문화행사·축제(오늘 ${t.slice(4, 6)}월 ${t.slice(6)}일 기준):`);
    for (const e of evs) lines.push(`   - ${e.title}${e.place ? ` @${e.place}` : ""}${e.price ? ` · ${e.price}` : ""}`);
  }

  return {
    text: lines.length ? lines.join("\n") : "",
    counts: { food: food.length, spots: spots.length, courses: courses.length, events: evs.length },
  };
}
