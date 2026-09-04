import petData from "@/data/pet-travel.json";

export type PetTravelPlace = {
  id: string;
  title: string;
  address?: string;
  addr?: string;
  area?: string;
  image?: string;
  mapx?: string;
  mapy?: string;
  type?: string;
  tel?: string;
  homepage?: string;
  summary?: string;
  petInfo?: string;
  overview?: string;
  intro?: Record<string, string>;
  images?: string[];
  petRaw?: Record<string, string>;
  info?: Array<{ name: string; text: string }>;
  enrichedAt?: string;
};

const places = (petData as unknown as { places?: Record<string, PetTravelPlace> }).places || {};

export function getPetTravelPlace(id: string) {
  return places[id] || null;
}

export function getPetTravelPlaces() {
  return Object.values(places);
}

const clean = (value: unknown) => String(value ?? "").replace(/<br\s*\/?>(?=\S)/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const arr = (value: any) => value == null ? [] : Array.isArray(value) ? value : [value];

/** 캐시가 아직 갱신되지 않은 장소도 상세 URL에서 API 상세정보를 제공한다. */
export async function fetchPetTravelDetail(id: string): Promise<PetTravelPlace | null> {
  const key = (process.env.PET_TOUR_API_KEY || process.env.TOUR_API_KEY || process.env.DATA_GO_KR_KEY || "").trim();
  if (!key) return null;
  const base = "https://apis.data.go.kr/B551011/KorPetTourService2";
  const request = async (endpoint: string, extra: Record<string, string> = {}) => {
    const qs = new URLSearchParams({ serviceKey: key, MobileOS: "ETC", MobileApp: "mwohaji", _type: "json", contentId: id, ...extra });
    const response = await fetch(`${base}/${endpoint}?${qs}`, { next: { revalidate: 43200 } });
    if (!response.ok) throw new Error(`TourAPI ${response.status}`);
    return response.json();
  };
  try {
    const common = await request("detailCommon2");
    const c = arr(common?.response?.body?.items?.item)[0] || {};
    const contentTypeId = clean(c.contenttypeid) || places[id]?.type || "12";
    const [intro, pet, info, images] = await Promise.all([
      request("detailIntro2", { contentTypeId }),
      request("detailPetTour2"),
      request("detailInfo2", { contentTypeId }),
      request("detailImage2", { numOfRows: "30", pageNo: "1" }),
    ]);
    const i = arr(intro?.response?.body?.items?.item)[0] || {};
    const p = arr(pet?.response?.body?.items?.item)[0] || {};
    const infoRows = arr(info?.response?.body?.items?.item).map((row: any) => ({ name: clean(row?.infoname || row?.name || row?.title), text: clean(row?.infotext || row?.text || Object.values(row || {}).join(" ")) })).filter((row: { name: string; text: string }) => row.name || row.text);
    const photoRows = arr(images?.response?.body?.items?.item).map((row: any) => clean(row?.originimgurl || row?.smallimageurl)).filter(Boolean);
    const title = clean(c.title);
    if (!title) return null;
    const address = clean(c.addr1 || c.addr2);
    return { id, title, address, area: address.split(" ")[0], image: clean(c.firstimage || c.firstimage2), mapx: clean(c.mapx), mapy: clean(c.mapy), type: clean(c.contenttypeid), tel: clean(c.tel), homepage: clean(c.homepage), overview: clean(c.overview), summary: clean(c.overview), petInfo: clean(Object.values(p).join(" ")), intro: Object.fromEntries(Object.entries(i).map(([name, value]) => [name, clean(value)]).filter(([, value]) => value)), info: infoRows, images: [...new Set([clean(c.firstimage || c.firstimage2), ...photoRows].filter(Boolean))] };
  } catch {
    return null;
  }
}
