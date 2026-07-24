// 분류/코드 헬퍼 — 수집 스크립트와 앱이 공유.
// 가격 판별 로직은 lib/price.js 로 분리했습니다.

/**
 * HTML 엔티티/공백 정리
 * @param {string} s
 * @returns {string}
 */
export function decodeEntities(s) {
  if (!s) return "";
  return String(s)
    .replace(/&amp;#39;|&#39;|&#039;/g, "'")
    .replace(/&amp;#34;|&#34;|&quot;/g, '"')
    .replace(/&amp;lt;|&lt;/g, "<")
    .replace(/&amp;gt;|&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// 가격 판별 로직 (하위 호환 위해 재-export)
export {
  CHEAP_LIMIT,
  extractAmounts,
  analyzePrice,
  classifyEvent,
  isEstimatedFree,
  priceLabel,
  PRICE_LABELS,
  PRICE_TYPES,
  FREE_LIKE,
} from "./price.js";

// 분야명 → URL slug 매핑 (realmName 문자열 기준으로 그룹핑)
const GENRE_MAP = [
  { key: "exhibition", label: "전시", match: ["전시"] },
  { key: "concert", label: "음악·콘서트", match: ["음악", "콘서트", "국악"] },
  { key: "theater", label: "연극", match: ["연극"] },
  { key: "musical", label: "뮤지컬·오페라", match: ["뮤지컬", "오페라"] },
  { key: "dance", label: "무용·발레", match: ["무용", "발레"] },
  { key: "kids", label: "아동·가족", match: ["아동", "가족"] },
  { key: "festival", label: "행사·축제", match: ["행사", "축제"] },
  { key: "edu", label: "교육·체험", match: ["교육", "체험"] },
];

/**
 * realmName 문자열을 장르 키로
 * @param {string} realmName
 * @returns {string}
 */
export function genreKeyOf(realmName) {
  const r = String(realmName || "");
  for (const g of GENRE_MAP) {
    if (g.match.some((m) => r.includes(m))) return g.key;
  }
  return "etc";
}

export function genreLabelOf(key) {
  const g = GENRE_MAP.find((x) => x.key === key);
  return g ? g.label : "기타";
}

export const GENRES = [...GENRE_MAP, { key: "etc", label: "기타", match: [] }];

// 17개 시도 (지역 필터/페이지용)
export const SIDO_LIST = [
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];

// 시도명 → URL slug (영문)
export const SIDO_SLUG = {
  서울: "seoul",
  부산: "busan",
  대구: "daegu",
  인천: "incheon",
  광주: "gwangju",
  대전: "daejeon",
  울산: "ulsan",
  세종: "sejong",
  경기: "gyeonggi",
  강원: "gangwon",
  충북: "chungbuk",
  충남: "chungnam",
  전북: "jeonbuk",
  전남: "jeonnam",
  경북: "gyeongbuk",
  경남: "gyeongnam",
  제주: "jeju",
};

export function sidoFromSlug(slug) {
  const entry = Object.entries(SIDO_SLUG).find(([, v]) => v === slug);
  return entry ? entry[0] : "";
}

/**
 * "큰 행사" 판별 — 자동 팝업/피처링 대상
 * @param {{realmName?:string, place?:string, title?:string}} ev
 * @returns {{featured:boolean, score:number}}
 */
export function computeFeatured(ev) {
  let score = 0;
  const place = String(ev.place || "");
  const realm = String(ev.realmName || "");
  const title = String(ev.title || "");

  const BIG_VENUES = [
    "예술의전당",
    "블루스퀘어",
    "세종문화회관",
    "국립극장",
    "국립현대미술관",
    "국립중앙박물관",
    "롯데콘서트홀",
    "샤롯데씨어터",
    "디큐브",
    "충무아트센터",
    "LG아트센터",
    "고척",
    "올림픽공원",
    "KSPO",
    "잠실",
    "코엑스",
    "DDP",
    "동대문디자인플라자",
    "국립국악원",
    "아트센터",
    "문화회관",
    "아트홀",
  ];
  for (const v of BIG_VENUES) {
    if (place.includes(v) || title.includes(v)) {
      score += 3;
      break;
    }
  }

  if (/뮤지컬|오페라/.test(realm)) score += 3;
  else if (/음악|콘서트/.test(realm)) score += 2;
  else if (/무용|발레|연극/.test(realm)) score += 1;

  if (/특별전|기획전|국제|비엔날레|페스티벌|대전\b/.test(title)) score += 1;

  return { featured: score >= 3, score };
}

// 대상(누구와) 축 — 여러 개 태깅 가능
export const AUDIENCES = [
  { key: "kids", label: "아이와 함께", emoji: "👨‍👩‍👧" },
  { key: "seniors", label: "어르신 추천", emoji: "🧓" },
  { key: "couple", label: "연인·데이트", emoji: "💕" },
  { key: "solo", label: "혼자 가기 좋은", emoji: "🚶" },
  { key: "group", label: "친구·단체", emoji: "🧑‍🤝‍🧑" },
];

export function audienceLabelOf(key) {
  const a = AUDIENCES.find((x) => x.key === key);
  return a ? a.label : "";
}

/**
 * 대상 태깅 — 제목/분야/설명/무료조건 키워드 매칭
 * @param {{title?:string, realmName?:string, genreKey?:string, contents?:string, freeCondition?:string, priceRaw?:string}} ev
 * @returns {string[]}
 */
export function computeAudiences(ev) {
  const title = String(ev.title || "");
  const genre = String(ev.genreKey || "");
  const text = `${title} ${String(ev.contents || "")}`;
  const cond = `${String(ev.freeCondition || "")} ${String(ev.priceRaw || "")}`;
  const out = new Set();

  if (
    genre === "kids" ||
    genre === "edu" ||
    /어린이|아동|가족|키즈|유아|체험|인형|동화|캐릭터|놀이|미취학|초등/.test(text)
  )
    out.add("kids");

  if (/경로|65\s*세|노인|어르신|실버/.test(cond) || /국악|전통|트로트|명창/.test(text))
    out.add("seniors");

  if (
    genre === "musical" ||
    genre === "dance" ||
    /재즈|클래식|콘서트|낭만|야경|와인|오페라|발레|뮤지컬|로맨|감성/.test(text)
  )
    out.add("couple");

  if (
    genre === "exhibition" ||
    /사진|미디어|아카이브|회화|조각|명상|북토크|독서|도서|고요|산책/.test(text)
  )
    out.add("solo");

  if (
    genre === "festival" ||
    genre === "concert" ||
    /축제|페스티벌|파티|불꽃|마켓|플리마|버스킹|난장/.test(text)
  )
    out.add("group");

  return [...out];
}
