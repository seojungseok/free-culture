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
const introLabels: Record<string, string> = {
  usetime: "이용시간", usetimeculture: "이용시간", usetimeleports: "이용시간", opentimefood: "영업시간",
  restdate: "휴무일", restdateculture: "휴무일", restdateleports: "휴무일", restdatefood: "휴무일",
  parking: "주차", parkingculture: "주차", parkingleports: "주차", parkingfood: "주차", parkingfee: "주차요금", parkingfeeleports: "주차요금",
  infocenter: "문의 및 안내", infocenterculture: "문의 및 안내", infocenterleports: "문의 및 안내", infocenterfood: "문의 및 안내",
  fee: "이용요금", usefee: "이용요금", usefeeleports: "이용요금", expguide: "체험 안내", reservation: "예약 안내", reservationfood: "예약 안내",
  eventplace: "행사 장소", eventstartdate: "행사 시작", eventenddate: "행사 종료", playtime: "공연 시간", sponsor1: "주최", program: "프로그램",
  scale: "규모", scaleleports: "규모", openperiod: "운영 기간", firstmenu: "대표 메뉴", treatmenu: "취급 메뉴", packing: "포장", kidsfacility: "어린이 시설", seat: "좌석", smoking: "금연 여부",
  chkbabycarriage: "유모차 대여", chkbabycarriageculture: "유모차 대여", chkbabycarriageleports: "유모차 대여", chkpet: "반려동물 동반", chkpetculture: "반려동물 동반", chkpetleports: "반려동물 동반", chkcreditcard: "신용카드", chkcreditcardculture: "신용카드", chkcreditcardleports: "신용카드", chkcreditcardfood: "신용카드",
};
const noisyKey = /^(contentid|contenttypeid|mapx|mapy|mlevel|modifiedtime|createdtime|serialnum|booktour|cpyrhtdivcd|sigungucode|areacode|cat[123])$/i;
const readable = (value: unknown) => {
  const text = clean(value);
  if (!text || /^[-+.,:/()\s\d]+$/.test(text)) return "";
  if (text === "Y") return "가능";
  if (text === "N") return "없음";
  return text;
};
export const normalizePetIntro = (raw: Record<string, unknown>) => Object.fromEntries(
  Object.entries(raw || {}).map(([key, value]) => [introLabels[key] || "", readable(value)])
    .filter(([label, value]) => Boolean(label && value)),
);
const petLabels: Record<string, string> = {
  acmpyneedmtr: "동반 시 준비사항",
  relaacdntriskmtr: "안전 유의사항",
  relaacdntRiskMtr: "안전 유의사항",
  relaposesfclty: "동반 가능 시설",
  relaPosesFclty: "동반 가능 시설",
  relafrnshprdlst: "제공 물품",
  relaFrnshPrdlst: "제공 물품",
  relarntlprdlst: "대여 물품",
  relaRntlPrdlst: "대여 물품",
  relapurcprdlst: "구매 가능 물품",
  relaPurcPrdlst: "구매 가능 물품",
};
const normalizePetInfo = (raw: Record<string, unknown>) => Object.entries(raw || {})
  .map(([key, value]) => [petLabels[key] || petLabels[key.toLowerCase()] || "", readable(value)] as const)
  .filter(([label, value]) => Boolean(label && value))
  .map(([label, value]) => `${label}: ${value}`)
  .join("\n\n");

export const sanitizePetInfoText = (value: unknown) => String(value || "")
  .split(/\s*(?:·|\n)\s*/)
  .map((part) => {
    const match = part.match(/^([^:]+):\s*(.*)$/);
    if (!match) return /[가-힣]/.test(part) ? readable(part) : "";
    const label = petLabels[match[1]] || petLabels[match[1].toLowerCase()];
    return label && readable(match[2]) ? `${label}: ${readable(match[2])}` : "";
  })
  .filter(Boolean)
  .join("\n\n");

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
    return { id, title, address, area: address.split(" ")[0], image: clean(c.firstimage || c.firstimage2), mapx: clean(c.mapx), mapy: clean(c.mapy), type: clean(c.contenttypeid), tel: clean(c.tel), homepage: clean(c.homepage), overview: clean(c.overview), summary: clean(c.overview), petInfo: normalizePetInfo(p), intro: normalizePetIntro(i), info: infoRows, images: [...new Set([clean(c.firstimage || c.firstimage2), ...photoRows].filter(Boolean))] };
  } catch {
    return null;
  }
}
