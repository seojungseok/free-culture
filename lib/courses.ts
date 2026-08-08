// 여행코스 데이터 접근 — data/courses.json(공식 코스 재료) + data/course-articles.json(블로그 글)
// 목록·상세는 "블로그 글이 발행된 코스"만 노출(품질 보장). 필터: 지역·기간·테마.
import coursesData from "@/data/courses.json";
import courseArticles from "@/data/course-articles.json";
import { SIDO_LIST, SIDO_SLUG } from "@/lib/classify";

export interface CourseStop {
  num: number;
  name: string;
  overview: string;
  image: string;
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
  duration: string; // "당일" | "1박2일" | "2박3일" ...
  themes: string[];
  source: string; // "official" | "auto"
}
export interface CourseArticle {
  status: string;
  content: string;
  publishedAt?: string;
  generatedAt?: string;
  length?: number;
}
export interface Course extends CourseRaw {
  content: string;
  publishedAt: string;
  themeLabels: string[];
}

const RAW = (coursesData as unknown as { courses: CourseRaw[] }).courses || [];
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

  // 테마 기반(여름 우선) — 있으면
  const tc = getThemeCounts();
  if (tc["바다피서"]) add("여름 바다·피서 여행코스", "/course/theme/beach");
  if (tc["자연힐링"]) add("자연·힐링 여행코스", "/course/theme/nature");
  if (tc["문화유적"]) add("문화유적 여행코스", "/course/theme/heritage");
  if (tc["가족체험"]) add("아이랑 가족 여행코스", "/course/theme/family");

  // 지역 + 지역×기간
  for (const { area } of getCourseAreaCounts()) {
    const slug = areaSlug(area);
    add(`${area} 여행코스`, `/course/${slug}`);
    const dc = getDurationCounts(area);
    for (const d of DURATIONS) if (dc[d.key]) add(`${area} ${d.label} 코스`, `/course/${slug}/${d.slug}`);
  }

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
