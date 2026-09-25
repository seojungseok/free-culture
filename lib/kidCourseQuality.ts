import { getKidCourses, type KidCourse } from "@/lib/kidCourses";

const clean = (value: string | undefined) => (value || "").replace(/\s+/g, " ").trim();
const narrative = (course: KidCourse) => [
  clean(course.editorial?.intro),
  clean(course.editorial?.spot),
  ...(course.park ? [clean(course.editorial?.park)] : []),
  clean(course.editorial?.food),
  clean(course.editorial?.route),
].filter(Boolean);
const sentences = (course: KidCourse) => narrative(course)
  .flatMap((paragraph) => paragraph.split(/(?<=[.!?。])\s+|\n+/))
  .map((sentence) => sentence.trim()).filter(Boolean);
const signature = (sentence: string, course: KidCourse) => {
  let text = sentence.toLowerCase();
  for (const value of [course.spot.title, course.park?.title, course.food?.title,
    course.spot.addr, course.park?.addr, course.food?.addr].filter(Boolean) as string[]) {
    text = text.replaceAll(value.toLowerCase(), "장소");
  }
  return text.replace(/\d+(?:[.,]\d+)?\s*(?:km|m|분|시간)?/gi, "수치").replace(/\s+/g, " ").trim();
};

let sharedSentences: Map<string, number> | undefined;
function sentenceFrequency() {
  if (sharedSentences) return sharedSentences;
  sharedSentences = new Map();
  for (const course of getKidCourses()) {
    for (const key of new Set(sentences(course).map((sentence) => signature(sentence, course)))) {
      sharedSentences.set(key, (sharedSentences.get(key) || 0) + 1);
    }
  }
  return sharedSentences;
}

export function assessKidCourse(course: KidCourse) {
  const prose = sentences(course).map((text) => ({
    text, repeated: (sentenceFrequency().get(signature(text, course)) || 0) > 1,
  }));
  const allChars = prose.reduce((sum, sentence) => sum + sentence.text.length, 0);
  const repeatedChars = prose.filter((sentence) => sentence.repeated)
    .reduce((sum, sentence) => sum + sentence.text.length, 0);
  const uniqueChars = allChars - repeatedChars;
  const repeatedRatio = allChars ? repeatedChars / allChars : 0;
  const stops = [course.spot, course.park, course.food].filter((stop): stop is NonNullable<typeof stop> => Boolean(stop));
  const factualChars = stops
    .reduce((sum, stop) => sum + stop.title.length + stop.addr.length + String(stop.distKm).length, 0);
  const stopDescriptions = [course.editorial?.spot, ...(course.park ? [course.editorial?.park] : []), course.editorial?.food];
  const failures = {
    shortUniqueDescription: uniqueChars < 300,
    missingIntroduction: !clean(course.editorial?.intro),
    missingStopDescriptions: stopDescriptions.some((text) => !clean(text)),
    mostlyNamesAddressesDistances: stops.length === 3 && allChars < factualChars,
    repeatedTemplateAtLeast70Percent: allChars > 0 && repeatedRatio >= 0.7,
    missingRouteExplanation: !clean(course.editorial?.route),
  };
  const failureCount = Object.values(failures).filter(Boolean).length;
  const indexable = failureCount < 2 && uniqueChars >= 300 &&
    !failures.missingIntroduction && !failures.missingStopDescriptions &&
    !failures.missingRouteExplanation && repeatedRatio < 0.7;
  return { indexable, failureCount, uniqueChars, repeatedRatio, failures };
}

export const isIndexableKidCourse = (course: KidCourse) => assessKidCourse(course).indexable;
