// 통합 검색 코어 (서버) — 나들이·문화행사·축제·맛집을 한 번에.
//  파싱(지역/가격/유형·장르) + 유의어 + 세부지역(구·동) + 띄어쓰기무관 + 순서무관 + 관련도 정렬.
import { getAllPlaces } from "@/lib/tour";
import { getAllEvents } from "@/lib/data";
import { getAdmission } from "@/lib/fees";
import { getAllCamps } from "@/lib/camping";
import { SIDO_LIST } from "@/lib/classify";
import festivalsData from "@/data/festivals.json";
import restaurantsData from "@/data/restaurants.json";

export type Kind = "place" | "camping" | "event" | "festival" | "food";
export const KIND_LABEL: Record<Kind, string> = { place: "나들이", camping: "캠핑", event: "문화행사", festival: "축제", food: "맛집" };

export interface SearchDoc {
  kind: Kind; id: string; title: string; area: string; sub: string;
  url: string; image: string;
  genre?: string; placeType?: string;
  price: "free" | "cheap" | "partial" | "paid" | "unknown";
  hasImg: boolean;
  titleN: string; // 정규화 제목(공백제거·소문자)
  hay: string;    // 정규화 전체 검색 대상
}

const norm = (s: string) => String(s || "").toLowerCase().replace(/\s+/g, "");
const guOf = (addr: string) => (addr.match(/([가-힣]+[시군구])(?=\s|$|[가-힣]*[동읍면로길])/g) || []).slice(1, 3).join(" ");

// ── 문서 인덱스(모듈 로드 시 1회) ──────────────────────────────
let DOCS: SearchDoc[] | null = null;
function build(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  // 나들이
  for (const p of getAllPlaces()) {
    const adm = getAdmission(p.id);
    docs.push({
      kind: "place", id: p.id, title: p.title, area: p.area, sub: guOf(p.addr || ""),
      url: `/places/spot/${p.id}`, image: p.image || "",
      placeType: p.type, price: adm === "free" ? "free" : adm === "paid" ? "paid" : "unknown",
      hasImg: Boolean(p.image),
      titleN: norm(p.title), hay: norm(`${p.title} ${p.addr} ${p.area}`),
    });
  }

  // 문화행사 + 축제(genreKey=festival) 분리
  const freeish = new Set(["free", "free_estimated", "partial_free"]);
  for (const e of getAllEvents()) {
    const isFest = e.genreKey === "festival";
    const price = freeish.has(e.priceType) ? (e.priceType === "partial_free" ? "partial" : "free")
      : e.priceType === "cheap" ? "cheap" : e.priceType === "paid" ? "paid" : "unknown";
    docs.push({
      kind: isFest ? "festival" : "event", id: e.id, title: e.title, area: e.area,
      sub: e.sigungu || "", url: `/event/${e.id}`, image: e.imgUrl || "",
      genre: e.genreKey, price,
      hasImg: Boolean(e.imgUrl),
      titleN: norm(e.title),
      hay: norm(`${e.title} ${e.place} ${e.area} ${e.sigungu} ${e.address} ${e.realmName}`),
    });
  }

  // 캠핑(고캠핑)
  for (const c of getAllCamps()) {
    const themes = [c.pet ? "반려동물 애견" : "", c.lctCl, ...c.types].join(" ");
    docs.push({
      kind: "camping", id: c.id, title: c.name, area: c.area, sub: c.sigungu,
      url: `/camping/${c.id}`, image: c.image || "", price: "unknown", hasImg: Boolean(c.image),
      titleN: norm(c.name),
      hay: norm(`${c.name} ${c.addr} ${c.area} ${c.sigungu} 캠핑 캠핑장 ${themes}`),
    });
  }

  // 축제(TourAPI, festivals.json) — 수집 전이면 빈 배열
  const fests = (festivalsData as { festivals?: { id: string; title: string; addr: string; area: string; image?: string }[] }).festivals || [];
  for (const f of fests) {
    docs.push({
      kind: "festival", id: f.id, title: f.title, area: f.area, sub: guOf(f.addr || ""),
      url: `/festivals?query=${encodeURIComponent(f.title)}`, image: f.image || "", price: "unknown", hasImg: Boolean(f.image),
      titleN: norm(f.title), hay: norm(`${f.title} ${f.addr} ${f.area} 축제`),
    });
  }

  // 맛집(restaurants.json) — 수집 전이면 빈 배열
  const foods = (restaurantsData as { restaurants?: { id: string; title: string; addr: string; area: string; image?: string; cat3?: string }[] }).restaurants || [];
  for (const r of foods) {
    const catHay = FOOD_CAT_HAY[r.cat3 || ""] || "";
    docs.push({
      kind: "food", id: r.id, title: r.title, area: r.area, sub: guOf(r.addr || ""),
      url: `/food/spot/${r.id}`, image: r.image || "", price: "unknown", hasImg: Boolean(r.image),
      titleN: norm(r.title), hay: norm(`${r.title} ${r.addr} ${r.area} 맛집 음식점 식당 ${catHay}`),
    });
  }

  return docs;
}
function docs() { return (DOCS ||= build()); }

// ── 유의어·사전 ────────────────────────────────────────────────
const SIDO_ALIAS: Record<string, string> = { 서울특별시: "서울", 인천광역시: "인천", 부산광역시: "부산", 대구광역시: "대구", 대전광역시: "대전", 광주광역시: "광주", 울산광역시: "울산", 세종특별자치시: "세종", 경기도: "경기", 강원도: "강원", 강원특별자치도: "강원", 충청북도: "충북", 충청남도: "충남", 전라북도: "전북", 전북특별자치도: "전북", 전라남도: "전남", 경상북도: "경북", 경상남도: "경남", 제주도: "제주", 제주특별자치도: "제주" };
const FREE_WORDS = ["무료", "공짜", "프리"];
const CHEAP_WORDS = ["1만원", "만원", "1만원이하", "저렴", "저가"];
const PLACE_WORDS = ["나들이", "가볼만한곳", "가볼만한", "관광지", "명소", "놀거리"];
const FOOD_WORDS = ["맛집", "음식점", "식당", "먹거리", "한식", "중식", "일식", "양식", "분식", "카페"];
const CAMP_WORDS = ["캠핑", "캠핑장", "야영장", "오토캠핑", "자동차야영장", "글램핑", "카라반"];
// 캠핑 유형/테마 토큰 → 캠핑 kind + 텍스트 조건
const CAMP_TYPE_TEXT: Record<string, string[]> = {
  글램핑: ["글램핑"], 오토캠핑: ["오토캠핑", "자동차야영장"], 자동차야영장: ["오토캠핑", "자동차야영장"],
  카라반: ["카라반"], 일반야영장: ["일반야영장"],
};
const PET_WORDS = ["반려동물", "애견", "개동반", "강아지"];
const STOPWORDS = new Set(["곳", "것", "및", "의", "추천", "정보", "근처", "주변", "여행"]);
// 이벤트 장르 유의어
const GENRE_SYN: Record<string, string[]> = {
  공연: ["concert", "musical", "dance", "theater"], 뮤지컬: ["musical"], 콘서트: ["concert"], 음악회: ["concert"],
  클래식: ["concert"], 연극: ["theater"], 무용: ["dance"], 전시: ["exhibition"], 전시회: ["exhibition"],
};
// 텍스트 유의어(장소 유형) — OR 확장
const TEXT_SYN: Record<string, string[]> = {
  박물관: ["박물관", "기념관", "전시관"], 체험: ["체험", "체험관", "체험마을"],
  공원: ["공원", "생태공원", "근린공원"],
  // 데이트 테마 — 풍부한 소스로 확장(단독 키워드로도 결과 넉넉하게)
  수목원: ["수목원", "식물원", "자연휴양림", "정원", "수목"],
  정원: ["정원", "수목원", "식물원", "자연휴양림"],
  미술관: ["미술관", "갤러리", "전시관", "아트센터", "전시"], // 장소 미술관 + 전시(문화행사) 통합
  호수: ["호수", "저수지", "강변", "수변"], // 강변·호수 통합
  // 데이트 코스 — 데이트하기 좋은 장소 유형 OR 확장(공원·미술관·수목원·호수·카페)
  데이트: ["공원", "생태공원", "미술관", "갤러리", "전시관", "수목원", "식물원", "호수", "카페", "전망"],
  과학관: ["과학관"],
};

// 음식점 cat3 → 검색어(hay에 편입해 업종 검색 지원: 카페·한식 등)
const FOOD_CAT_HAY: Record<string, string> = {
  A05020100: "한식", A05020200: "서양식 양식", A05020300: "일식", A05020400: "중식",
  A05020700: "이색음식점", A05020900: "카페 찻집 커피", A05021000: "클럽",
};

export interface ParsedQuery {
  sido: string; price: "" | "free" | "cheap"; kinds: Set<Kind>;
  genres: Set<string>; textGroups: string[][]; raw: string;
}

export function parseQuery(q: string): ParsedQuery {
  const p: ParsedQuery = { sido: "", price: "", kinds: new Set(), genres: new Set(), textGroups: [], raw: q };
  const tokens = q.trim().split(/\s+/).filter(Boolean);
  for (const tok of tokens) {
    const nt = norm(tok);
    if (!nt || STOPWORDS.has(nt)) continue;
    if (FREE_WORDS.includes(nt)) { p.price = "free"; continue; }
    if (CHEAP_WORDS.includes(nt)) { p.price = "cheap"; continue; }
    if (PLACE_WORDS.includes(nt)) { p.kinds.add("place"); continue; }
    if (FOOD_WORDS.includes(nt)) { p.kinds.add("food"); if (nt !== "맛집" && nt !== "음식점" && nt !== "식당" && nt !== "먹거리") p.textGroups.push([nt]); continue; }
    if (CAMP_TYPE_TEXT[nt]) { p.kinds.add("camping"); p.textGroups.push(CAMP_TYPE_TEXT[nt].map(norm)); continue; }
    if (CAMP_WORDS.includes(nt)) { p.kinds.add("camping"); continue; }
    if (PET_WORDS.includes(nt)) { p.textGroups.push(["반려동물", "애견"]); continue; }
    if (/(축제|페스티벌)$/.test(nt)) { p.kinds.add("festival"); const pre = nt.replace(/(축제|페스티벌)$/, ""); if (pre) p.textGroups.push([pre]); continue; }
    if (GENRE_SYN[nt]) { p.kinds.add("event"); GENRE_SYN[nt].forEach((g) => p.genres.add(g)); continue; }
    if (TEXT_SYN[nt]) { p.textGroups.push(TEXT_SYN[nt].map(norm)); continue; }
    if (SIDO_LIST.includes(tok) || SIDO_ALIAS[tok]) { p.sido = SIDO_ALIAS[tok] || tok; continue; }
    p.textGroups.push([nt]); // 일반/세부지역(구·동) 토큰 → 검색 대상에 부분일치
  }
  return p;
}

const FREE_SET = new Set(["free", "partial"]);
function matchDoc(d: SearchDoc, p: ParsedQuery): boolean {
  if (p.kinds.size && !p.kinds.has(d.kind)) return false;
  if (p.sido && d.area !== p.sido) return false;
  if (p.genres.size && !(d.genre && p.genres.has(d.genre))) return false;
  if (p.price === "free" && !FREE_SET.has(d.price)) return false;
  if (p.price === "cheap" && d.price !== "cheap") return false;
  for (const group of p.textGroups) {
    if (!group.some((alt) => d.hay.includes(alt))) return false;
  }
  return true;
}

function score(d: SearchDoc, p: ParsedQuery): number {
  let s = 0;
  for (const group of p.textGroups) {
    if (group.some((alt) => d.titleN.includes(alt))) s += 100; // 제목 일치 우선
    else s += 10; // 설명/주소 일치
  }
  if (p.kinds.has(d.kind)) s += 8;
  if (d.hasImg) s += 5;
  if (d.price === "free") s += 2;
  return s;
}

export interface SearchResult {
  total: number;
  groups: { kind: Kind; label: string; count: number; items: SearchDoc[] }[];
  parsed: ParsedQuery;
}

// 인접 세부지역(연관검색어용)
const ADJACENT: Record<string, string[]> = { 인천: ["강화도", "영종도"], 서울: ["강남", "마포"], 경기: ["가평", "양평"], 강원: ["평창", "홍천"], 부산: ["기장", "해운대"], 제주: ["서귀포"] };
/** 함께 찾는 검색어 — 같은 지역 다른 유형/테마 + 인접 세부지역 */
export function relatedQueries(parsed: ParsedQuery): string[] {
  const out: string[] = [];
  const s = parsed.sido;
  const isCamp = parsed.kinds.has("camping");
  if (s) {
    if (isCamp) out.push(`${s} 글램핑`, `${s} 오토캠핑`, `${s} 반려동물 캠핑장`, `${s} 계곡 캠핑장`);
    else out.push(`${s} 캠핑장`, `${s} 가볼만한 곳`, `${s} 맛집`, `${s} 무료 공연`);
    for (const adj of ADJACENT[s] || []) out.push(isCamp ? `${adj} 캠핑장` : `${adj} 가볼만한 곳`);
  } else if (isCamp) {
    out.push("글램핑", "오토캠핑", "반려동물 캠핑장", "계곡 캠핑장");
  }
  const self = parsed.raw.replace(/\s+/g, "");
  return [...new Set(out)].filter((x) => x.replace(/\s+/g, "") !== self).slice(0, 6);
}

export function search(q: string, perGroup = 60): SearchResult {
  const parsed = parseQuery(q);
  const hasCond = parsed.sido || parsed.price || parsed.kinds.size || parsed.genres.size || parsed.textGroups.length;
  if (!q.trim() || !hasCond) return { total: 0, groups: [], parsed };

  const hits = docs().filter((d) => matchDoc(d, parsed));
  hits.sort((a, b) => score(b, parsed) - score(a, parsed));

  const order: Kind[] = ["place", "camping", "festival", "event", "food"];
  const groups = order
    .map((kind) => {
      const all = hits.filter((h) => h.kind === kind);
      return { kind, label: KIND_LABEL[kind], count: all.length, items: all.slice(0, perGroup) };
    })
    .filter((g) => g.count > 0);

  return { total: hits.length, groups, parsed };
}
