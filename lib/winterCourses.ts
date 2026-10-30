import winterData from '@/data/winter-courses.json';
import reviewedPhotos from '@/data/winter-reviewed-photos.json';
import { isPublicWinterCourse } from '@/lib/winter-course-validation.mjs';

export type WinterStop = { placeId: string; name: string; addr?: string; mapx: string | number; mapy: string | number; day: number; image?: string; officialUrl?: string };
export type WinterCourse = {
  id: string; slug: string; title: string; duration: '당일' | '1박2일'; area: string;
  intro: string; publishedAt: string; sourceCourseId: string; stops: WinterStop[];
  sections: { heading: string; paragraphs: string[] }[];
  sources?: { title: string; url: string; checkedAt?: string }[];
  image?: { src: string; alt: string; caption: string; credit: string; kind: 'tour-api' | 'ai'; reviewed: boolean; width: number; height: number };
};

export function getPublicWinterCourses(): WinterCourse[] {
  const data = winterData as unknown as { courses?: unknown[] };
  if (!Array.isArray(data.courses)) return [];
  const unique = new Map<string, WinterCourse>();
  for (const course of data.courses) {
    if (isPublicWinterCourse(course)) {
      const original = course as WinterCourse;
      const reviewed = (reviewedPhotos as Record<string, WinterCourse['image']>)[original.slug];
      const item = { ...original, image: original.image || (reviewed && original.stops.some((stop) => stop.image === reviewed.src) ? reviewed : undefined) };
      if (!unique.has(item.slug)) unique.set(item.slug, item);
    }
  }
  return [...unique.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getWinterCourse(slug: string): WinterCourse | undefined {
  return getPublicWinterCourses().find((course) => course.slug === slug);
}
