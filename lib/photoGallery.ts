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
      if (seen.has(item.id)) return false;
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

/** 관광지명·주소로 미리 수집한 한국관광공사 관광사진을 빠르게 찾는다. */
export function galleryForSpot(title: string, address = "", limit = 6): GalleryPhoto[] {
  const name = clean(title);
  const addr = clean(address);
  if (name.length < 2) return [];
  return PHOTOS.filter((photo) => {
    const haystack = clean(`${photo.title} ${photo.location} ${photo.keywords}`);
    return haystack.includes(name) || (addr.length >= 4 && haystack.includes(addr.slice(0, 6)));
  }).slice(0, limit);
}
