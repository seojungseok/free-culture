import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const revalidate = 43200;

const BASE = "https://apis.data.go.kr/B551011/KorPetTourService2";
const clean = (v: unknown) => String(v ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const arr = (v: any) => v == null ? [] : Array.isArray(v) ? v : [v];
const SIDO = ["서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
const AREA_TO_SIDO: Record<string, string> = { "1": "서울", "2": "인천", "3": "대전", "4": "대구", "5": "광주", "6": "부산", "7": "울산", "8": "세종", "31": "경기", "32": "강원", "33": "충북", "34": "충남", "35": "경북", "36": "경남", "37": "전북", "38": "전남", "39": "제주" };
const SIDO_PREFIXES: Record<string, string[]> = { 경기: ["경기", "경기도"], 강원: ["강원", "강원도", "강원특별자치도"], 충북: ["충북", "충청북도"], 충남: ["충남", "충청남도"], 전북: ["전북", "전라북도", "전북특별자치도"], 전남: ["전남", "전라남도"], 경북: ["경북", "경상북도"], 경남: ["경남", "경상남도"], 제주: ["제주", "제주특별자치도"] };
function areaFrom(address: string) { return SIDO.find((x) => (SIDO_PREFIXES[x] || [x]).some((prefix) => address.startsWith(prefix))) || ""; }

function key() { return (process.env.PET_TOUR_API_KEY || process.env.TOUR_API_KEY || process.env.DATA_GO_KR_KEY || "").trim(); }
function encKey(k: string) { return /%[0-9A-F]{2}/i.test(k) ? k : encodeURIComponent(k); }

async function call(endpoint: string, params: Record<string, string>) {
  const k = key();
  if (!k) throw new Error("TourAPI key is missing");
  const qs = new URLSearchParams({ serviceKey: encKey(k), MobileOS: "ETC", MobileApp: "mwohaji", _type: "json", ...params });
  const response = await fetch(`${BASE}/${endpoint}?${qs}`, { next: { revalidate: 43200 } });
  const json = await response.json();
  if (!response.ok || json?.response?.header?.resultCode !== "0000") throw new Error(json?.response?.header?.resultMsg || `TourAPI ${response.status}`);
  return json?.response?.body;
}

function normalize(item: any, index: number) {
  const title = clean(item?.title || item?.name);
  if (!title || !item?.contentid) return null;
  const address = clean(item.addr1 || item.addr2);
  const petText = clean(Object.entries(item || {}).filter(([k]) => /pet|animal|dog|cat|반려|동물|acmpy|rela/i.test(k)).map(([, v]) => v).filter(Boolean).join(" · "));
  return {
    id: String(item.contentid), title, address, area: areaFrom(address) || clean(item.areaname),
    image: clean(item.firstimage || item.firstimage2), mapx: clean(item.mapx), mapy: clean(item.mapy),
    type: clean(item.contenttypeid), homepage: clean(item.homepage), tel: clean(item.tel), petInfo: petText,
    summary: clean(item.overview || item.addr2 || "반려동물과 함께 여행할 수 있는 장소"), index,
  };
}

export async function GET() {
  try {
    try {
      const cached = JSON.parse(await readFile(path.join(process.cwd(), "data", "pet-travel.json"), "utf8"));
      const items = Object.values(cached?.places || {}).slice(0, 1200);
      if (items.length) return NextResponse.json({ items, total: items.length, generatedAt: cached.generatedAt, source: "pet-cache" });
    } catch { /* 수집 전에는 실시간 검색 fallback */ }
    const found = new Map<string, any>();
    for (const areaCode of ["1", "2", "3", "4", "5", "6", "7", "8", "31", "32", "33", "34", "35", "36", "37", "38", "39"]) {
      const body = await call("areaBasedList2", { areaCode, numOfRows: "1000", pageNo: "1", arrange: "A" });
      for (const [i, item] of arr(body?.items?.item).entries()) {
        const row = normalize(item, found.size + i);
        if (row) found.set(row.id, { ...found.get(row.id), ...row, area: row.area || AREA_TO_SIDO[areaCode] || "" });
      }
    }
    const items = [...found.values()].slice(0, 1200);
    return NextResponse.json({ items, total: items.length, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("[pet-travel]", error);
    return NextResponse.json({ items: [], total: 0, unavailable: true }, { status: 200 });
  }
}
