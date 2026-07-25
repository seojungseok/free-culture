import "server-only";

// 상세 페이지에서만 호출: detailCommon2 로 장소 소개글(overview)·홈페이지를 가져옴.
// Next fetch 캐시(revalidate)로 한 번 부르면 재사용 → 일 1,000회 제한 방어.

const KEY = (process.env.TOUR_API_KEY || process.env.DATA_GO_KR_KEY || "").trim();

const cleanText = (s: string) =>
  String(s || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#3[49];/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const extractUrl = (s: string) => {
  const raw = String(s || "");
  const m = raw.match(/href=["']?(https?:\/\/[^"'\s>]+)/i);
  if (m) return m[1];
  const m2 = raw.match(/https?:\/\/[^\s"'<>]+/i);
  return m2 ? m2[0] : "";
};

export interface PlaceOverview {
  overview: string;
  homepage: string;
  tel: string;
}

export async function fetchPlaceOverview(contentId: string): Promise<PlaceOverview> {
  const empty: PlaceOverview = { overview: "", homepage: "", tel: "" };
  if (!KEY || !contentId) return empty;
  const url = `https://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${encodeURIComponent(
    KEY
  )}&MobileOS=ETC&MobileApp=mwohaji&_type=json&contentId=${contentId}`;
  try {
    const res = await fetch(url, { next: { revalidate: 604800 } }); // 1주 캐시
    if (!res.ok) return empty;
    const j = await res.json();
    if (j?.response?.header?.resultCode !== "0000") return empty;
    const item = j?.response?.body?.items?.item;
    const it = Array.isArray(item) ? item[0] : item;
    if (!it) return empty;
    return {
      overview: cleanText(it.overview),
      homepage: extractUrl(it.homepage),
      tel: String(it.tel || "").trim(),
    };
  } catch {
    return empty;
  }
}
