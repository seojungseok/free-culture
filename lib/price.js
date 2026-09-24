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

/**
 * 확인된 요금 안내만 분류한다. 빈 요금은 행사명이나 장소로 추측하지 않는다.
 * @param {{priceRaw?:string, genreKey?:string, title?:string, place?:string}} ev
 * @returns {{type:string, min:number|null, max:number|null, freeCondition:string}}
 */
export function classifyEvent(ev) {
  return analyzePrice(ev.priceRaw || "");
}

export const PRICE_LABELS = {
  free: "무료",
  partial_free: "일부 무료 / 조건 확인 필요",
  cheap: "1만원 이하",
  paid: "유료",
  unknown: "요금 정보 확인 필요",
};

export const PRICE_TYPES = [
  "free",
  "partial_free",
  "cheap",
  "paid",
  "unknown",
];

/** 무료로 확인된 행사만 포함 */
export const FREE_LIKE = new Set(["free"]);

/**
 * 배지 라벨. 유료/저렴은 가능하면 실제 가격 범위 표시.
 * @param {{type:string, min:number|null, max:number|null}} p
 */
export function priceLabel(p) {
  if (!p || typeof p === "string") return PRICE_LABELS[p] || "요금 정보 확인 필요";
  if ((p.type === "paid" || p.type === "cheap") && p.max) {
    if (p.min && p.min !== p.max)
      return `${p.min.toLocaleString()}~${p.max.toLocaleString()}원`;
    return `${p.max.toLocaleString()}원`;
  }
  return PRICE_LABELS[p.type] || "요금 정보 확인 필요";
}
