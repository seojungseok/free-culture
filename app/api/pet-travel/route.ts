import { NextResponse } from "next/server";

export const revalidate = 43200;

const BASE = "https://apis.data.go.kr/B551011/KorService2";
const clean = (v: unknown) => String(v ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const arr = (v: any) => v == null ? [] : Array.isArray(v) ? v : [v];

function key() { return (process.env.TOUR_API_KEY || process.env.DATA_GO_KR_KEY || "").trim(); }
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
  const petText = clean(Object.entries(item || {}).filter(([k]) => /pet|animal|dog|cat|반려|동물/i.test(k)).map(([, v]) => v).filter(Boolean).join(" · "));
  return {
    id: String(item.contentid), title, address, area: clean(item.areaname || item.sigunguname),
    image: clean(item.firstimage || item.firstimage2), mapx: clean(item.mapx), mapy: clean(item.mapy),
    type: clean(item.contenttypeid), homepage: clean(item.homepage), tel: clean(item.tel), petInfo: petText,
    summary: clean(item.overview || item.addr2 || "반려동물과 함께 여행할 수 있는 장소"), index,
  };
}

export async function GET() {
  try {
    const found = new Map<string, any>();
    for (const keyword of ["반려동물", "애견동반", "강아지 동반"]) {
      const body = await call("searchKeyword2", { keyword, numOfRows: "100", pageNo: "1", arrange: "A" });
      for (const [i, item] of arr(body?.items?.item).entries()) {
        const row = normalize(item, found.size + i);
        if (row) found.set(row.id, { ...found.get(row.id), ...row });
      }
    }
    const items = [...found.values()].slice(0, 240);
    return NextResponse.json({ items, total: items.length, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("[pet-travel]", error);
    return NextResponse.json({ items: [], total: 0, unavailable: true }, { status: 200 });
  }
}
