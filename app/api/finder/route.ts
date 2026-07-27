import { NextResponse } from "next/server";
import { countFor, altRegion, type Cat } from "@/lib/finder";

// 홈 필터 실시간 카운트 — 내부 캐시 데이터만 집계(외부 API 호출 없음). 결과 캐시.
export const revalidate = 3600;

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const cat = (sp.get("cat") || "camping") as Cat;
  const f: Record<string, string | undefined> = {};
  for (const k of ["area", "sigungu", "type", "facility", "pet", "who", "price", "genre", "when"]) {
    const v = sp.get(k);
    if (v) f[k] = v;
  }
  const count = countFor(cat, f);
  const alt = count === 0 ? altRegion(cat, f) : null;
  return NextResponse.json({ count, alt }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
