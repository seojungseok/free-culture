// 여행코스 데이터 접근 — data/courses.json(공식 코스 재료) + data/course-articles.json(블로그 글)
// 목록·상세는 "블로그 글이 발행된 코스"만 노출(품질 보장). 필터: 지역·기간·테마.
import coursesData from "@/data/courses.json";
import coursesAuto from "@/data/courses-auto.json";
import courseArticles from "@/data/course-articles.json";
import { SIDO_LIST, SIDO_SLUG } from "@/lib/classify";
import { season } from "@/lib/finder";
import { getAllPlaces } from "@/lib/tour";

export interface CourseStop {
  num: number;
  name: string;
  overview: string;
  image: string;
  mapx?: string;
  mapy?: string;
  addr?: string;
}
export interface CourseRaw {
  id: string;
  title: string;
  area: string;
  image: string;
  mapx: string;
  mapy: string;
  tel: string;
  overview: string;
  stops: CourseStop[];
  stopCount: number;
  duration: string; // "당일" | "1박2일" | "2박3일" | "베스트"
  themes: string[];
  source: string; // "official" | "auto"
  format?: string; // "list" = 베스트 리스트형(동선 아님)
}
export interface CourseArticle {
  status: string;
  content: string;
  title?: string; // LLM이 만든 SEO 제목(지역+기간+여행코스)
  publishedAt?: string;
  generatedAt?: string;
  length?: number;
}
export interface Course extends CourseRaw {
  content: string;
  publishedAt: string;
  themeLabels: string[];
}

const RAW: CourseRaw[] = [
  ...((coursesData as unknown as { courses: CourseRaw[] }).courses || []),   // 공식(정부) 코스
  ...((coursesAuto as unknown as { courses: CourseRaw[] }).courses || []),   // 자동 조합 코스
];
const ARTS = (courseArticles as unknown as { articles?: Record<string, CourseArticle> }).articles || {};

// ── 기간·테마 라벨/슬러그 (URL·SEO용) ──
export const DURATIONS: { key: string; slug: string; label: string }[] = [
  { key: "당일", slug: "day", label: "당일치기" },
  { key: "1박2일", slug: "1n2d", label: "1박2일" },
  { key: "2박3일", slug: "2n3d", label: "2박3일" },
];
export const THEMES: { key: string; slug: string; label: string; emoji: string }[] = [
  { key: "바다피서", slug: "beach", label: "바다·피서", emoji: "🌊" },
  { key: "문화유적", slug: "heritage", label: "문화유적", emoji: "🏛" },
  { key: "자연힐링", slug: "nature", label: "자연·힐링", emoji: "🌿" },
  { key: "가족체험", slug: "family", label: "가족·체험", emoji: "👨‍👩‍👧" },
  { key: "맛집", slug: "food", label: "맛집·먹거리", emoji: "🍴" },
];
export const durationFromSlug = (s?: string) => DURATIONS.find((d) => d.slug === s);
export const durationSlug = (key: string) => DURATIONS.find((d) => d.key === key)?.slug || "day";
export const durationLabel = (key: string) => DURATIONS.find((d) => d.key === key)?.label || key;
// ── 계절 자동 적용 — 현재 계절에 맞는 테마·문구를 반환(여름=바다, 가을=단풍…) ──
const SEASON_MAP: Record<string, { theme: string; phrase: string }> = {
  spring: { theme: "자연힐링", phrase: "봄꽃·나들이" },
  summer: { theme: "바다피서", phrase: "여름 바다·피서" },
  autumn: { theme: "자연힐링", phrase: "가을 단풍·힐링" },
  winter: { theme: "가족체험", phrase: "겨울 실내·체험" },
};
export function courseSeason() {
  const s = season();
  const m = SEASON_MAP[s.key] || SEASON_MAP.summer;
  const t = THEMES.find((x) => x.key === m.theme);
  return { key: s.key, label: s.label, emoji: s.emoji, theme: m.theme, themeSlug: t?.slug || "nature", phrase: m.phrase };
}

export const themeFromSlug = (s?: string) => THEMES.find((t) => t.slug === s);
export const themeLabel = (key: string) => THEMES.find((t) => t.key === key)?.label || key;
export const themeEmoji = (key: string) => THEMES.find((t) => t.key === key)?.emoji || "📍";
export const areaSlug = (area: string) => (SIDO_SLUG as Record<string, string>)[area] || "";
export { sidoFromSlug } from "@/lib/classify";

// ── 발행된 코스(블로그 글 있는 것)만 병합 ──
const PUBLISHED: Course[] = RAW.filter((c) => ARTS[c.id]?.status === "published").map((c) => {
  const a = ARTS[c.id]!;
  return {
    ...c,
    title: a.title || c.title, // SEO 제목 우선(발행글) → 없으면 원 코스명
    content: a.content,
    publishedAt: a.publishedAt || a.generatedAt || "",
    themeLabels: (c.themes || []).map(themeLabel),
  };
}).sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));

export function getAllCourses(): Course[] { return PUBLISHED; }
export function getCourseCount(): number { return PUBLISHED.length; }
export function getCourse(id: string): Course | undefined { return PUBLISHED.find((c) => c.id === id); }

export function filterCourses(
  { area, duration, theme, limit }: { area?: string; duration?: string; theme?: string; limit?: number } = {}
): Course[] {
  let list = PUBLISHED;
  if (area) list = list.filter((c) => c.area === area);
  if (duration) list = list.filter((c) => c.duration === duration);
  if (theme) list = list.filter((c) => (c.themes || []).includes(theme));
  return typeof limit === "number" ? list.slice(0, limit) : list;
}

/** 발행 코스가 있는 시도 + 개수 (시도 순) */
export function getCourseAreaCounts(): { area: string; count: number }[] {
  const c: Record<string, number> = {};
  for (const x of PUBLISHED) c[x.area] = (c[x.area] || 0) + 1;
  return SIDO_LIST.filter((a) => c[a] > 0).map((area) => ({ area, count: c[area] }));
}

/** 기간별 개수 (area 주면 그 지역 안에서) */
export function getDurationCounts(area?: string): Record<string, number> {
  const list = area ? PUBLISHED.filter((c) => c.area === area) : PUBLISHED;
  const out: Record<string, number> = {};
  for (const c of list) out[c.duration] = (out[c.duration] || 0) + 1;
  return out;
}

/** 테마별 개수 (전국) */
export function getThemeCounts(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of PUBLISHED) for (const t of c.themes || []) out[t] = (out[t] || 0) + 1;
  return out;
}

// 한국 좌표 유효성(공식 코스는 0,0으로 비어있는 경우가 많음)
const validCoord = (x?: string, y?: string) => {
  const lon = parseFloat(x || ""), lat = parseFloat(y || "");
  return Number.isFinite(lon) && Number.isFinite(lat) && lon > 120 && lon < 132 && lat > 32 && lat < 40;
};

const norm = (s: string) => String(s || "").replace(/\s|\(.*?\)/g, "");
/** 경유지 → 관광지 데이터 매칭(정규화: 공백·괄호 제거). 공식 코스의 주소·좌표 복원용. */
function matchPlace(name: string) {
  if (!name) return undefined;
  const places = getAllPlaces();
  const n = norm(name);
  return (
    places.find((pl) => pl.title === name) ||
    places.find((pl) => norm(pl.title) === n) ||
    places.find((pl) => norm(pl.title).includes(n) || n.includes(norm(pl.title)))
  );
}

/**
 * 코스 중심 좌표 — 지도 링크용.
 * 공식 코스는 좌표가 (0,0)이라, 경유지 이름을 관광지 데이터와 매칭해 좌표 평균으로 복원.
 */
export function courseCentroid(c: Course): { mapx: string; mapy: string } | null {
  if (validCoord(c.mapx, c.mapy)) return { mapx: c.mapx, mapy: c.mapy };
  const pts: { x: number; y: number }[] = [];
  for (const s of c.stops || []) {
    const p = matchPlace(s.name);
    if (p && validCoord(p.mapx, p.mapy)) pts.push({ x: parseFloat(p.mapx), y: parseFloat(p.mapy) });
  }
  if (!pts.length) return null;
  return {
    mapx: String(pts.reduce((a, p) => a + p.x, 0) / pts.length),
    mapy: String(pts.reduce((a, p) => a + p.y, 0) / pts.length),
  };
}

/** 코스가 속한 대표 시/군/구 — 경유지 주소(자동) 또는 매칭한 관광지 주소(공식)에서 최빈값. 근처 맛집 필터용. */
export function courseCity(c: Course): string {
  const addrs: string[] = [];
  for (const s of c.stops || []) {
    const a = (s as { addr?: string }).addr || matchPlace(s.name)?.addr || "";
    if (a) addrs.push(a);
  }
  const cnt: Record<string, number> = {};
  for (const a of addrs) {
    const city = a.split(/\s+/).find((t) => /(시|군|구)$/.test(t));
    if (city) cnt[city] = (cnt[city] || 0) + 1;
  }
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : "";
}

/** 코스 스팟을 일차별로 분할 — 하루 3~4곳이 현실적. 1박2일=2일, 2박3일=3일로 나눔. */
export function courseDays(c: Course): CourseStop[][] {
  const stops = c.stops || [];
  const n = stops.length;
  const days = c.duration === "2박3일" ? 3 : c.duration === "1박2일" ? 2 : 1;
  if (days <= 1) return [stops];
  const perDay = Math.ceil(n / days);
  const out: CourseStop[][] = [];
  for (let i = 0; i < n; i += perDay) out.push(stops.slice(i, i + perDay));
  // 마지막 날이 비면 제거, 일수보다 많으면 마지막에 합침
  return out.slice(0, days).filter((d) => d.length);
}

/** 같은 지역 다른 코스 추천 */
export function relatedCourses(course: Course, n = 4): Course[] {
  return PUBLISHED.filter((c) => c.id !== course.id && c.area === course.area).slice(0, n)
    .concat(PUBLISHED.filter((c) => c.id !== course.id && c.area !== course.area))
    .slice(0, n);
}

/**
 * 홈 "인기 검색어"용 코스 키워드 — 발행된 코스에서 파생(지역·기간·테마·코스명).
 * 실제 존재하는 페이지로만 링크. 홈에서 날짜 시드로 셔플해 매일 새롭게 노출.
 */
export function getCourseKeywords(): { label: string; href: string }[] {
  const out: { label: string; href: string }[] = [];
  const seen = new Set<string>();
  const add = (label: string, href: string) => {
    const k = label.trim();
    if (k && !seen.has(k)) { seen.add(k); out.push({ label: k, href }); }
  };

  // 계절 자동 — 현재 계절 테마를 맨 앞에 (여름=바다, 가을=단풍…)
  const se = courseSeason();
  const tc = getThemeCounts();
  if (tc[se.theme]) add(`${se.phrase} 여행코스`, `/course/theme/${se.themeSlug}`);

  // 지역별 계절 여행 + 지역 + 지역×기간
  const areasWithCourses = getCourseAreaCounts();
  for (const { area } of areasWithCourses) {
    const slug = areaSlug(area);
    add(`${area} ${se.label}여행`, `/course/${slug}`); // 예: "전남 가을여행"
    add(`${area} 여행코스`, `/course/${slug}`);
    const dc = getDurationCounts(area);
    for (const d of DURATIONS) if (dc[d.key]) add(`${area} ${d.label} 코스`, `/course/${slug}/${d.slug}`);
  }

  // 나머지 테마
  for (const t of THEMES) if (tc[t.key]) add(`${t.label} 여행코스`, `/course/theme/${t.slug}`);

  // 개별 코스명(짧고 매력적인 것)
  for (const c of PUBLISHED) if (c.title.length <= 24) add(c.title, `/course/c/${c.id}`);

  return out;
}

/** 목록 카드용 요약(본문 제외) */
export function slimCourse(c: Course) {
  return {
    id: c.id, title: c.title, area: c.area, image: c.image,
    duration: c.duration, themes: c.themes, stopCount: c.stopCount,
  };
}
export type CourseCardData = ReturnType<typeof slimCourse>;
