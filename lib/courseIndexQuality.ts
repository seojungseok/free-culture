import type { Course } from "@/lib/courses";

// A long generated article is not enough by itself: require place-specific
// detail, a usable sequence, and a distinct set of stops before indexing it.
function stopKey(course: Course): string {
  return [...new Set(course.stops.map((stop) => stop.placeId || stop.name.trim()))].sort().join("|");
}

function articleScore(course: Course): number {
  const content = course.content || "";
  const uncertainty = (content.match(/제공된 자료|자료에는|자료에|확인되지|정보가 없|정보는 없|현장 확인|현장에서 확인/g) || []).length;
  const concreteDetails = (content.match(/\d{3,4}년|\d+(?:\.\d+)?km|\d{2,4}m|전시실|체험장|문화재|지정|역사|건축|운영시간|이용요금|입장료|박물관|미술관|산책로/g) || []).length;
  const sourceDescriptions = course.stops.filter((stop) => (stop.overview || "").trim().length >= 80).length;
  if (course.format === "list" || course.stops.length < 2 || content.length < 1800) return -1;
  if (course.source === "official") return 10000 + concreteDetails * 10 + content.length;
  if (course.stops.length < 3 || content.length < 3400) return -1;
  if (new Set(course.stops.map((stop) => stop.placeId || stop.name.trim())).size !== course.stops.length) return -1;
  if (!/이동/.test(content) || !/(오전|오후|1일차|당일)/.test(content)) return -1;
  if (concreteDetails < 12 || !(uncertainty <= 3 || (sourceDescriptions >= 2 && uncertainty <= course.stops.length + 2))) return -1;
  return sourceDescriptions * 1000 + concreteDetails * 10 + content.length - uncertainty * 100;
}

export function indexableCourseIds(courses: Course[]): Set<string> {
  const selected = new Map<string, { id: string; score: number }>();
  for (const course of courses) {
    const score = articleScore(course);
    if (score < 0) continue;
    const key = stopKey(course);
    const prior = selected.get(key);
    if (!prior || score > prior.score) selected.set(key, { id: course.id, score });
  }
  return new Set([...selected.values()].map((row) => row.id));
}
