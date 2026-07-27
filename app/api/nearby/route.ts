import { NextResponse } from "next/server";
import { getAllPlaces } from "@/lib/tour";
import { getAllCamps } from "@/lib/camping";

// 내 주변 — 좌표로 가까운 나들이·캠핑 정렬(내부 데이터만). 위치는 저장하지 않음.
const rad = (d: number) => (d * Math.PI) / 180;
function distKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return Infinity;
  const R = 6371, dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
const distLabel = (km: number) => (km < 1 ? `${Math.max(50, Math.round((km * 1000) / 50) * 50)}m` : `${km.toFixed(1)}km`);

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const lat = parseFloat(sp.get("lat") || ""), lng = parseFloat(sp.get("lng") || "");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ error: "bad coords" }, { status: 400 });

  const near = <T extends { mapx: string; mapy: string }>(list: T[], n: number) =>
    list.map((x) => ({ x, d: distKm(lat, lng, parseFloat(x.mapy), parseFloat(x.mapx)) }))
      .filter((r) => Number.isFinite(r.d)).sort((a, b) => a.d - b.d).slice(0, n);

  const places = near(getAllPlaces(), 4).map(({ x, d }) => ({ id: x.id, title: x.title, area: x.area, image: x.image, url: `/places/spot/${x.id}`, dist: distLabel(d) }));
  const camps = near(getAllCamps(), 4).map(({ x, d }) => ({ id: x.id, title: x.name, area: x.area, image: x.image, url: `/camping/${x.id}`, dist: distLabel(d) }));
  return NextResponse.json({ places, camps });
}
