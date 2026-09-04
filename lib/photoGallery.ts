import galleryData from "@/data/photo-gallery.json";
import type { CourseStop } from "@/lib/courses";

export interface GalleryPhoto {
  id: string;
  title: string;
  image: string;
  month: string;
  location: string;
  keywords: string;
  photographer: string;
}

const PHOTOS = (galleryData as unknown as { photos?: GalleryPhoto[] }).photos || [];
const clean = (value: string) => String(value || "").toLowerCase().replace(/[\s·,./()\[\]·_-]/g, "");

function candidates(stop: CourseStop): string[] {
  const raw = `${stop.name} ${stop.addr || ""}`.split(/[·,/|()[\]]/g);
  return raw.map((x) => clean(x)).filter((x) => x.length >= 3);
}

/** 코스 경유지명과 사진 제목·촬영장소를 매칭해 상세 페이지용 사진을 만든다. */
export function galleryForStops(stops: CourseStop[], limit = 8): GalleryPhoto[] {
  const matched: GalleryPhoto[] = [];
  const seen = new Set<string>();
  for (const stop of stops) {
    const names = candidates(stop);
    const photo = PHOTOS.find((item) => {
      const haystack = clean(`${item.title} ${item.location} ${item.keywords}`);
      return names.some((name) => haystack.includes(name) || name.includes(clean(item.title)) && clean(item.title).length >= 3);
    });
    if (photo && !seen.has(photo.id)) {
      seen.add(photo.id);
      matched.push(photo);
    }
    if (matched.length >= limit) break;
  }
  return matched;
}

export function galleryCount(): number {
  return PHOTOS.length;
}
