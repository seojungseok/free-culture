import winterData from '@/data/winter-courses.json';
import overnightData from '@/data/winter-overnight-courses.json';
import metropolitanDaytrips from '@/data/winter-metropolitan-daytrips.json';
import metropolitanOvernights from '@/data/winter-metropolitan-overnights.json';
import reviewedPhotos from '@/data/winter-reviewed-photos.json';
import { isPublicWinterCourse } from '@/lib/winter-course-validation.mjs';

export type WinterPhoto = { src: string; sourceUrl?: string; alt: string; caption: string; credit: string; kind: 'tour-api' | 'ai'; reviewed: boolean; width: number; height: number };
export type WinterStop = { placeId: string; name: string; addr?: string; mapx: string | number; mapy: string | number; day: number; image?: string; officialUrl?: string; description?: string; timeLabel?: string; stay?: string; photo?: WinterPhoto; gallery?: WinterPhoto[] };
export type WinterCourse = {
  id: string; slug: string; title: string; duration: '당일' | '1박2일'; area: string;
  intro: string; publishedAt: string; sourceCourseId: string; stops: WinterStop[];
  city?: string; startPoint?: string; transport?: string; durationLabel?: string; overnightArea?: string; updatedAt?: string; lastReviewedAt?: string;
  sections: { heading: string; paragraphs: string[] }[];
  sources?: { title: string; url: string; checkedAt?: string }[];
  image?: WinterPhoto;
};

export function getPublicWinterCourses(): WinterCourse[] {
  const collections = [winterData, overnightData, metropolitanDaytrips, metropolitanOvernights] as unknown as { courses?: unknown[] }[];
  const unique = new Map<string, WinterCourse>();
  for (const course of collections.flatMap(data=>Array.isArray(data.courses)?data.courses:[])) {
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
