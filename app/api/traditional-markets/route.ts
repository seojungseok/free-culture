import { NextResponse } from "next/server";
import { normalizeMarket, type TraditionalMarket } from "@/lib/traditionalMarkets";

export const revalidate = 86400;
export const dynamic = "force-dynamic";
let previous: TraditionalMarket[] = [];

async function fetchAll(origin: string): Promise<TraditionalMarket[]> {
  const key = process.env.VWORLD_API_KEY;
  const domain = (process.env.VWORLD_API_DOMAIN || origin || "https://mwohaji.kr").trim();
  if (!key) throw new Error("VWorld API key is missing");
  const all: TraditionalMarket[] = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const params = new URLSearchParams({
      service: "data", version: "2.0", request: "GetFeature", data: "LT_P_TRADSIJANG",
      format: "json", crs: "EPSG:4326", size: "1000", page: String(page), key, domain,
    });
    const response = await fetch("https://api.vworld.kr/req/data?" + params, { next: { revalidate: 86400 } });
    const json = await response.json();
    const code = json?.response?.status;
    if (!response.ok || code !== "OK") throw new Error("VWorld response " + String(code || response.status));
    const recordTotal = Number(json?.response?.record?.total || 0);
    const pageTotal = Number(json?.response?.page?.total || 1);
    totalPages = Math.max(pageTotal, Math.ceil(recordTotal / 1000), 1);
    const features = json?.response?.result?.featureCollection?.features || [];
    for (const [index, feature] of features.entries()) {
      const market = normalizeMarket(feature, (page - 1) * 1000 + index);
      if (market) all.push(market);
    }
    page += 1;
  }
  const deduped = [...new Map(all.map((market) => [
    market.name + "|" + (market.address || market.jibunAddress || market.latitude + "," + market.longitude), market,
  ])).values()];
  previous = deduped;
  return deduped;
}

export async function GET(req: Request) {
  const debug = new URL(req.url).searchParams.get("debug") === "1";
  try {
    const markets = await fetchAll(new URL(req.url).origin);
    return NextResponse.json({ markets, total: markets.length, cachedFor: 86400 });
  } catch (error) {
    console.error("[traditional-markets]", error);
    if (previous.length) return NextResponse.json({ markets: previous, total: previous.length, stale: true });
    return NextResponse.json({ markets: [], total: 0, unavailable: true, ...(debug ? {
      diagnostic: error instanceof Error ? error.message : "unknown error",
      configured: { key: Boolean(process.env.VWORLD_API_KEY), domain: Boolean(process.env.VWORLD_API_DOMAIN) },
    } : {}) }, { status: 200 });
  }
}
