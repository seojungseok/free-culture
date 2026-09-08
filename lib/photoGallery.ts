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
export function galleryForStops(stops: CourseStop[], limit = 8, strictArea?: string): GalleryPhoto[] {
  if (strictArea) return strictGalleryForStops(stops, strictArea, limit);
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

/** Exact place identity plus administrative area; never use area-only/address-only matches. */
export function photoArea(value: string): string {
 const aliases:Record<string,string>={서울특별시:'서울',부산광역시:'부산',인천광역시:'인천',대구광역시:'대구',대전광역시:'대전',광주광역시:'광주',울산광역시:'울산',세종특별자치시:'세종',경기도:'경기',강원도:'강원',강원특별자치도:'강원',충청북도:'충북',충청남도:'충남',전라북도:'전북',전북특별자치도:'전북',전라남도:'전남',전남광주통합특별시:'전남',경상북도:'경북',경상남도:'경남',제주도:'제주',제주특별자치도:'제주'};
 const first=value.trim().split(/\s+/)[0];return aliases[first] || (Object.values(aliases).includes(first)?first:'');
}
export const placePhotoName=(value:string)=>clean(value.replace(/\([^)]*\)/g,''));
function strictGalleryForStops(stops:CourseStop[],area:string,limit:number):GalleryPhoto[]{
 const groups=stops.map(stop=>PHOTOS.filter(photo=>{
  if(photoArea(photo.location)!==area||photoArea(stop.addr || '')!==area)return false;
  const name=placePhotoName(stop.name);if(name.length<3)return false;
  const names=[photo.title,photo.title.replace(/^(서울|부산|인천|대구|대전|광주|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)\s+/, '')].map(placePhotoName);
  const district=(stop.addr || '').split(/\s+/)[1];
  if(district&&/[시군구]$/.test(district)&&!photo.location.includes(district))return false;
  return names.includes(name);
 }));
 const result:GalleryPhoto[]=[],seen=new Set<string>();
 for(let i=0;i<limit;i++)for(const group of groups){const p=group[i];const url=p?.image.replace(/^http:/,'https:');if(p&&!seen.has(url)&&result.length<limit){seen.add(url);result.push({...p,image:url});}}
 return result;
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
