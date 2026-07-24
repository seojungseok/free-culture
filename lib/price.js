// 가격 판별 규칙 — 단일 소스 (수집 스크립트 + 앱 공유)
// 규칙 변경/확장은 이 파일 한 곳에서. 나중에 축제 전용 API(B안) 연동 시에도
// classifyEvent() 의 반환만 바꾸면 됩니다.

export const CHEAP_LIMIT = 10000; // 1만원 이하 = "저렴"

function decode(s) {
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

const FREE_WORDS = /(전관\s*)?무료|입장료\s*없음|관람료\s*없음|요금\s*없음|free\b/i;
const CONDITION_WORDS =
  /(만\s*)?\d{1,3}\s*세|경로|어르신|노인|어린이|유아|아동|청소년|학생|군인|국가유공|유공자|장애|기초생활|다자녀|임산부|시민|도민|구민|군민|매월|매주|마지막\s*주?\s*수요일|문화가\s*있는\s*날|평일|주말|오전|오후|시간대|이상|미만|초과|동반|선착순|사전\s*예약|예약자|회원/;

/**
 * 요금 문자열에서 금액(원) 목록 추출. 억/만/천 단위 지원.
 * @param {string} text
 * @returns {number[]}
 */
export function extractAmounts(text) {
  const nums = [];
  const re =
    /(?:([0-9]+)\s*억)?\s*(?:([0-9]+)\s*만)?\s*(?:([0-9]+)\s*천)?\s*(?:([0-9][0-9,]*)\s*)?원/g;
  let m;
  while ((m = re.exec(text))) {
    const [, eok, man, cheon, won] = m;
    if (!eok && !man && !cheon && !won) continue;
    let val = 0;
    if (eok) val += Number(eok) * 100000000;
    if (man) val += Number(man) * 10000;
    if (cheon) val += Number(cheon) * 1000;
    if (won) val += Number(won.replace(/,/g, ""));
    if (val > 0) nums.push(val);
  }
  for (const mm of text.matchAll(/([0-9]+)\s*(만|천)?\s*[~\-–]\s*[0-9]/g)) {
    let n = Number(mm[1]);
    if (mm[2] === "만") n *= 10000;
    else if (mm[2] === "천") n *= 1000;
    if (Number.isFinite(n) && n > 0) nums.push(n);
  }
  return nums;
}

function extractFreeCondition(text) {
  const segs = text.split(/\s*[\/·,\n]\s*|\s{2,}/).map((s) => s.trim());
  const hits = segs.filter((s) => FREE_WORDS.test(s) && CONDITION_WORDS.test(s));
  if (hits.length) return hits.join(", ").slice(0, 60);
  if (FREE_WORDS.test(text) && CONDITION_WORDS.test(text)) return text.slice(0, 60);
  return "";
}

/**
 * 순수 요금 문자열 분석 → free / partial_free / cheap / paid / unknown
 * @param {string} priceRaw
 * @returns {{type:string, min:number|null, max:number|null, freeCondition:string}}
 */
export function analyzePrice(priceRaw) {
  const text = decode(priceRaw);
  if (!text) return { type: "unknown", min: null, max: null, freeCondition: "" };

  const amounts = extractAmounts(text);
  const hasFree = FREE_WORDS.test(text);
  const hasCondition = CONDITION_WORDS.test(text);
  const hasPaidWord = /유료/.test(text);

  if (amounts.length > 0) {
    const max = Math.max(...amounts);
    const min = Math.min(...amounts);
    if (hasFree) {
      return {
        type: "partial_free",
        min: 0,
        max,
        freeCondition: extractFreeCondition(text) || "일부 대상 무료",
      };
    }
    return { type: max <= CHEAP_LIMIT ? "cheap" : "paid", min, max, freeCondition: "" };
  }

  if (hasFree) {
    if (hasCondition)
      return {
        type: "partial_free",
        min: 0,
        max: null,
        freeCondition: extractFreeCondition(text) || text.slice(0, 60),
      };
    return { type: "free", min: 0, max: 0, freeCondition: "" };
  }

  if (hasPaidWord) return { type: "paid", min: null, max: null, freeCondition: "" };
  return { type: "unknown", min: null, max: null, freeCondition: "" };
}

// ─── 무료 추정(free_estimated) 히uristic ────────────────────────────────
// 지역축제/공공기관 문화행사는 API 요금이 비어 있어도 대체로 무료 입장.
// 오분류를 줄이기 위해 포함조건을 좁히고 제외조건을 강하게 둠.

const ESTIMATE_GENRES = new Set(["festival", "edu"]);
const INCLUDE_KW =
  /축제|페스티벌|페스타|한마당|야행|문화제|마켓|장터|거리|광장|박물관|미술관|도서관|문화원|문화재단|주민센터|구청|시청|과학관/;
const EXCLUDE_TITLE = /티켓|예매|초청|공연|콘서트|뮤지컬|오페라|클래스|워크숍|리사이틀|독주회|연주회/;
const EXCLUDE_PLACE =
  /예술의전당|세종문화회관|아트센터|콘서트홀|아트홀|대극장|오페라|블루스퀘어|씨어터|극장/;
const EXCLUDE_INTL = /국제|월드|world|인터내셔널|international|비엔날레/i;

/**
 * 무료 추정 대상인지 (price 비어있을 때만 의미)
 * @param {{genreKey?:string, title?:string, place?:string}} ev
 * @returns {boolean}
 */
export function isEstimatedFree(ev) {
  if (!ESTIMATE_GENRES.has(String(ev.genreKey))) return false;
  const title = String(ev.title || "");
  const place = String(ev.place || "");
  if (EXCLUDE_TITLE.test(title)) return false;
  if (EXCLUDE_PLACE.test(place)) return false;
  if (EXCLUDE_INTL.test(title)) return false;
  return INCLUDE_KW.test(title) || INCLUDE_KW.test(place);
}

/**
 * 행사 전체 맥락으로 최종 가격 분류.
 * price 로 판별 → unknown 이면서 추정조건 만족 시 free_estimated 로 승격.
 * @param {{priceRaw?:string, genreKey?:string, title?:string, place?:string}} ev
 * @returns {{type:string, min:number|null, max:number|null, freeCondition:string, estimated:boolean}}
 */
export function classifyEvent(ev) {
  const a = analyzePrice(ev.priceRaw || "");
  if (a.type === "unknown" && isEstimatedFree(ev)) {
    return { type: "free_estimated", min: 0, max: 0, freeCondition: "", estimated: true };
  }
  return { ...a, estimated: false };
}

export const PRICE_LABELS = {
  free: "무료",
  free_estimated: "무료 추정",
  partial_free: "조건부 무료",
  cheap: "1만원 이하",
  paid: "유료",
  unknown: "요금 확인",
};

export const PRICE_TYPES = [
  "free",
  "free_estimated",
  "partial_free",
  "cheap",
  "paid",
  "unknown",
];

/** 무료 계열(확정+추정) */
export const FREE_LIKE = new Set(["free", "free_estimated"]);

/**
 * 배지 라벨. 유료/저렴은 가능하면 실제 가격 범위 표시.
 * @param {{type:string, min:number|null, max:number|null}} p
 */
export function priceLabel(p) {
  if (!p || typeof p === "string") return PRICE_LABELS[p] || "요금 확인";
  if ((p.type === "paid" || p.type === "cheap") && p.max) {
    if (p.min && p.min !== p.max)
      return `${p.min.toLocaleString()}~${p.max.toLocaleString()}원`;
    return `${p.max.toLocaleString()}원`;
  }
  return PRICE_LABELS[p.type] || "요금 확인";
}
