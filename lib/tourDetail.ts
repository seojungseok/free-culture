import "server-only";
import storedOverviews from "@/data/place-overviews.json";
import storedDetails from "@/data/place-details.json";
import { isUsefulDisplayValue } from "@/lib/displayValue";
import { classifyAdmission, type Admission } from "@/lib/admission";
import { getIntro } from "@/lib/tourExtra";
import { getAdmission } from "@/lib/fees";
export { classifyAdmission } from "@/lib/admission";

// 방문·빌드에서는 저장된 수집 결과만 사용한다.
// 관리자가 TOUR_RUNTIME_FETCH=1을 명시한 경우에만 외부 API 조회를 허용한다.
// Next fetch 캐시는 계정 전체 요청량을 제한하지 않으므로 기본 동작은 API를 호출하지 않는다.

const KEY = (process.env.TOUR_API_KEY || process.env.DATA_GO_KR_KEY || "").trim();
const keyParam = /%[0-9A-Fa-f]{2}/.test(KEY) ? KEY : encodeURIComponent(KEY);

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
  checkedAt?: string;
  overviewCheckedAt?: string;
}

const https = (u: string) => String(u || "").replace(/^http:\/\//i, "https://");

// 상세 본문을 외부 API 응답 때문에 오래 붙잡지 않도록 제한한다.
const apiSignal = () => AbortSignal.timeout(4500);

export type { Admission } from "@/lib/admission";

/** 저장된 요금 안내를 우선 사용하고, 명시적 opt-in에서만 detailIntro2를 조회한다. */
export async function fetchAdmission(contentId: string, type: string): Promise<Admission> {
  const intro = getIntro(contentId);
  const saved = intro?.fee?.trim() ? classifyAdmission(intro.fee) : getAdmission(contentId) ?? intro?.admission ?? "unknown";
  if (process.env.TOUR_RUNTIME_FETCH !== "1" || !KEY || !contentId) return saved;
  if (type !== "14" && type !== "28") return saved; // 요금 필드 없는 유형은 호출 생략
  const url = `https://apis.data.go.kr/B551011/KorService2/detailIntro2?serviceKey=${keyParam}&MobileOS=ETC&MobileApp=mwohaji&_type=json&contentId=${contentId}&contentTypeId=${type}`;
  try {
    const res = await fetch(url, { next: { revalidate: 604800 }, signal: apiSignal() });
    if (!res.ok) return saved;
    const j = await res.json();
    if (j?.response?.header?.resultCode !== "0000") return saved;
    const item = j?.response?.body?.items?.item;
    const it = Array.isArray(item) ? item[0] : item;
    if (!it) return saved;
    const fee = type === "14" ? it.usefee : it.usefeeleports;
    // 새 요금 안내에 유료 예외가 있으면 오래된 무료 배지로 되돌리지 않는다.
    return isUsefulDisplayValue(fee) ? classifyAdmission(fee) : saved;
  } catch {
    return saved;
  }
}

export interface PlaceImage {
  full: string;
  thumb: string;
}

const detailRecords = (storedDetails as unknown as { details?: Record<string, PlaceOverview & { images?: PlaceImage[] }> }).details || {};

function savedImages(contentId: string): PlaceImage[] {
  const images = detailRecords[contentId]?.images;
  if (!Array.isArray(images)) return [];
  const seen = new Set<string>();
  const out: PlaceImage[] = [];
  for (const image of images) {
    const full = String(image?.full || "").trim();
    if (!/^https?:\/\//i.test(full) || seen.has(full)) continue;
    seen.add(full);
    const thumb = String(image?.thumb || "").trim();
    out.push({ full, thumb: /^https?:\/\//i.test(thumb) ? thumb : full });
  }
  return out;
}

/** 저장된 공식 추가 사진을 반환한다. 명시적 opt-in에서만 detailImage2를 조회한다. */
export async function fetchPlaceImages(contentId: string): Promise<PlaceImage[]> {
  const saved = savedImages(contentId);
  if (process.env.TOUR_RUNTIME_FETCH !== "1" || !KEY || !contentId) return saved;
  const url = `https://apis.data.go.kr/B551011/KorService2/detailImage2?serviceKey=${keyParam}&MobileOS=ETC&MobileApp=mwohaji&_type=json&imageYN=Y&numOfRows=30&contentId=${contentId}`;
  try {
    const res = await fetch(url, { next: { revalidate: 604800 }, signal: apiSignal() }); // 1주 캐시
    if (!res.ok) return saved;
    const j = await res.json();
    if (j?.response?.header?.resultCode !== "0000") return saved;
    const item = j?.response?.body?.items?.item;
    const arr = Array.isArray(item) ? item : item ? [item] : [];
    const out: PlaceImage[] = [];
    const seen = new Set<string>();
    for (const it of arr) {
      const full = https(it.originimgurl || "");
      if (!full || seen.has(full)) continue;
      seen.add(full);
      out.push({ full, thumb: https(it.smallimageurl || "") || full });
    }
    return out.length ? out : saved;
  } catch {
    return saved;
  }
}

export async function fetchPlaceOverview(contentId: string): Promise<PlaceOverview> {
  const detailCache = detailRecords[contentId];
  const cached = (storedOverviews as Record<string, string>)[contentId];
  const empty: PlaceOverview = { overview: isUsefulDisplayValue(detailCache?.overview) ? cleanText(detailCache.overview) : isUsefulDisplayValue(cached) ? cleanText(cached) : "", homepage: detailCache?.homepage || "", tel: detailCache?.tel || "", checkedAt: detailCache?.checkedAt, overviewCheckedAt: detailCache?.overviewCheckedAt };
  if (detailCache?.checkedAt && Date.now() - Date.parse(detailCache.checkedAt) < 30 * 86400000) return empty;
  if (process.env.TOUR_RUNTIME_FETCH !== "1" || !KEY || !contentId) return empty;
  const url = `https://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${keyParam}&MobileOS=ETC&MobileApp=mwohaji&_type=json&contentId=${contentId}`;
  try {
    const res = await fetch(url, { next: { revalidate: 604800 }, signal: apiSignal() }); // 1주 캐시
    if (!res.ok) return empty;
    const j = await res.json();
    if (j?.response?.header?.resultCode !== "0000") return empty;
    const item = j?.response?.body?.items?.item;
    const it = Array.isArray(item) ? item[0] : item;
    if (!it) return empty;
    const overview = cleanText(it.overview);
    const tel = String(it.tel ?? "").trim();
    return {
      overview: isUsefulDisplayValue(overview) ? overview : empty.overview,
      homepage: extractUrl(it.homepage) || empty.homepage,
      tel: isUsefulDisplayValue(tel) ? tel : empty.tel,
    };
  } catch {
    return empty;
  }
}
