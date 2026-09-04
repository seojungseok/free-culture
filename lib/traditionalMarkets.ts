export interface TraditionalMarket {
  id: string;
  type: "traditional_market";
  name: string;
  category: string;
  address: string;
  jibunAddress: string;
  storeCount: string;
  items: string;
  giftcard: boolean | null;
  hasToilet: boolean | null;
  hasParking: boolean | null;
  openingType: string;
  phone: string;
  latitude: number;
  longitude: number;
  region: string;
}

export const MARKET_REGIONS = ["서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

export function flag(value: unknown): boolean | null {
  const s = String(value ?? "").trim().toUpperCase();
  if (s === "Y" || s === "YES" || s === "1" || s === "TRUE") return true;
  if (s === "N" || s === "NO" || s === "0" || s === "FALSE") return false;
  return null;
}

export function regionOf(address: string): string {
  return MARKET_REGIONS.find((region) => address.startsWith(region) || address.includes(" " + region + " ")) || "";
}

export function normalizeMarket(feature: any, index: number): TraditionalMarket | null {
  const p = feature?.properties || {};
  const address = String(p.adr_road || p.adr_jibun || "").trim();
  const coords = feature?.geometry?.coordinates || feature?.geometry?.geometries?.[0]?.coordinates || [];
  const longitude = Number(coords[0] ?? p.lon ?? p.longitude);
  const latitude = Number(coords[1] ?? p.lat ?? p.latitude);
  const name = String(p.name || p.mrkt_nm || p.market_name || "").trim();
  if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    id: String(p.id || feature.id || "vworld-market-" + index),
    type: "traditional_market",
    name,
    category: String(p.category || "").trim(),
    address,
    jibunAddress: String(p.adr_jibun || "").trim(),
    storeCount: String(p.market || "").trim(),
    items: String(p.items || "").trim(),
    giftcard: flag(p.giftcard),
    hasToilet: flag(p.toilet),
    hasParking: flag(p.park),
    openingType: String(p.opn_per || "").trim(),
    phone: String(p.tel_num || "").trim(),
    latitude,
    longitude,
    region: regionOf(address),
  };
}
