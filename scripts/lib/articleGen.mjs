// 글 자동화 코어 — 프롬프트/Gemini호출/품질검사/우선순위 큐/램프업
// 사이트와 분리된 Node 전용 모듈. 사이트는 data/place-articles.json을 읽기만 함.

// 코스 관광지 선별 규칙은 사이트(lib/courses.ts)와 공유 — 글과 페이지가 어긋나지 않게 단일 모듈 사용.
import {
  selectCourseStops, splitCourseDays, isCourseFoodStop,
  COURSE_ATT_CAP, COURSE_DAY_COUNT, COURSE_MAX_PER_DAY, COURSE_CAP_VERSION,
} from "../../lib/courseSelect.js";
export { COURSE_ATT_CAP, COURSE_DAY_COUNT, COURSE_MAX_PER_DAY, COURSE_CAP_VERSION, selectCourseStops, isCourseFoodStop };

// ── 지역 우선순위 (서울/경기/부산 우선, 여러 지역 섞기용) ──
export const REGION_PRIORITY = {
  서울: 10, 경기: 9, 부산: 8,
  인천: 6, 대구: 6, 대전: 6, 광주: 6, 울산: 6, 제주: 6, 강원: 6,
  충남: 4, 충북: 4, 경남: 4, 경북: 4, 전남: 4, 전북: 4,
  세종: 2,
};

// ── 토큰 사용량 집계 (실비 측정용) ─────────────────────────────
// Luna 5.6 단가: 입력 $0.20 / 출력 $1.20 per 1M (2026-07-30 인하분)
// 캐시된 입력은 90% 싸다($0.20 → $0.02/1M). 프롬프트 앞에 고정 지침을 두는 이유.
export const PRICE = { in: 0.20 / 1e6, cached: 0.02 / 1e6, out: 1.20 / 1e6 };
export const usageTotal = { in: 0, cached: 0, out: 0, calls: 0, search: 0 };
export function addUsage(u, { search = false } = {}) {
  if (!u) return;
  usageTotal.in += u.prompt_tokens || u.input_tokens || 0;
  usageTotal.out += u.completion_tokens || u.output_tokens || 0;
  // OpenAI가 돌려주는 캐시 적중 토큰 수 — 이게 0이면 프롬프트 접두가 깨진 것이니 바로 알 수 있다.
  usageTotal.cached += u.prompt_tokens_details?.cached_tokens || u.input_tokens_details?.cached_tokens || 0;
  usageTotal.calls += 1;
  if (search) usageTotal.search += 1;
}
export function usageCost(t = usageTotal) {
  const cached = Math.min(t.cached || 0, t.in);
  return (t.in - cached) * PRICE.in + cached * PRICE.cached + t.out * PRICE.out; // 검색 도구 호출료는 별도
}
export function resetUsage() { usageTotal.in = 0; usageTotal.cached = 0; usageTotal.out = 0; usageTotal.calls = 0; usageTotal.search = 0; }

export function tourTypeLabel(type) {
  return type === "14" ? "문화시설" : type === "28" ? "체험·레포츠" : "관광지";
}

// ── 램프업: 시작일(월요일) 기준 경과일에 따른 하루 발행 수 ──
export function rampUpCount(startDate, today = new Date()) {
  const s = new Date(startDate + "T00:00:00+09:00");
  const t = new Date(today);
  const day = Math.floor((t - s) / 86400000) + 1; // 시작일 당일 = 1일차
  if (day < 1) return 0;
  if (day <= 14) return 5;
  // 하루 발행량 — daily.yml의 ARTICLE_DAILY로 조절(코드 수정 없이).
  //  비용: 검색 붙는 글 약 $0.019~0.022/건, 검색 없는 글 약 $0.0055~0.0064/건.
  //  가을 시즌은 daily.yml에서 ARTICLE_DAILY=10, ARTICLE_RESEARCH_MAX=10으로 대표명소부터 발행한다.
  return Number(process.env.ARTICLE_DAILY) || 20;
}

// ── 우선순위 큐: 미발행 장소를 지역 라운드로빈으로 N개 ──
export function pickQueue(places, doneIds, n) {
  const buckets = new Map();
  for (const p of places) {
    if (doneIds.has(p.id)) continue;
    if (!buckets.has(p.area)) buckets.set(p.area, []);
    buckets.get(p.area).push(p);
  }
  // 지역 내 정렬: 문화시설(14) 우선 → 제목 짧은(유명 근사) 순
  for (const list of buckets.values()) {
    list.sort((a, b) => (b.type === "14") - (a.type === "14") || a.title.length - b.title.length);
  }
  const regions = [...buckets.keys()].sort(
    (a, b) => (REGION_PRIORITY[b] || 1) - (REGION_PRIORITY[a] || 1)
  );
  const out = [];
  let progressed = true;
  while (out.length < n && progressed) {
    progressed = false;
    for (const r of regions) {
      const list = buckets.get(r);
      if (list && list.length) {
        out.push(list.shift());
        progressed = true;
        if (out.length >= n) break;
      }
    }
  }
  return out;
}

// ── 유사도(문자 3-gram Jaccard) — 원본/기존글 복제 방지 ──
function trigrams(s) {
  const t = String(s || "").replace(/\s+/g, "");
  const set = new Set();
  for (let i = 0; i < t.length - 2; i++) set.add(t.slice(i, i + 3));
  return set;
}
export function similarity(a, b) {
  const A = trigrams(a), B = trigrams(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return inter / (A.size + B.size - inter);
}

function stripMd(md) {
  return String(md || "")
    .replace(/^#+\s/gm, "")
    .replace(/[*_>#`-]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

// ── 3단계: 금지 표현(근거 없는 미사여구) / 추측성 문장 검사 ──
// 근거 없는 미사여구 — 하나라도 있으면 반려/재작성 대상
export const VAGUE_BANNED = [
  "유명한", "유명세", "맛있기로 소문난", "소문난 맛집", "인기 있는", "인기있는", "인기 만점",
  "현지인 맛집", "현지인들이 즐겨찾는", "현지인이 사랑하는",
  "다채로운 경험", "다채로운 볼거리", "다양한 볼거리와 즐길", "다양한 즐길 거리를",
  "경험을 선사", "즐거움을 선사", "즐거움을 선물", "특별한 시간을 선사", "특별한 추억을 선사",
  "잊지 못할 추억", "잊지 못할 경험", "힐링을 선사", "오감을 만족", "감동을 선사",
];
// 메타 문장 — "자료가 없다"고 독자에게 설명하는 글. 근거가 빈약할 때 분량 채우기로 나옴.
// 독자 입장에선 최악이라 한 개만 있어도 반려한다(→ 근거 생길 때까지 발행 안 함).
export const META_BANNED = [
  "제공된 자료", "제공된 근거", "제공된 정보", "주어진 자료", "주어진 근거",
  "이번 안내에서는", "확인된 장소명", "자료에는", "근거에는",
  "포함되어 있지 않", "기재되어 있지 않", "따로 명시되어 있지 않", "안내되어 있지 않",
];
export function metaHits(text) {
  const b = String(text || "");
  return META_BANNED.filter((w) => b.includes(w));
}
// 전달체 — 근거를 그대로 옮기며 "~라고 소개돼 있어요"로 쓰는 문장.
// 독자는 그 장소가 "어떤 곳인지"를 알고 싶지, 어디에 뭐라고 적혀 있는지는 궁금하지 않다.
export const TRANSFER_PATTERNS = [
  /소개(?:돼|되어|되고) ?있/, /소개된 (?:시설|볼거리|공간|장소)/, /(?:라고|으로) 소개(?:해|하고|된|됩니다|돼요)/,
  /기재(?:돼|되어) ?있/, /안내(?:돼|되어) ?있/, /명시(?:돼|되어) ?있/, /표기(?:돼|되어) ?있/,
  /자료에 따라/, /함께 소개되는/,
];
export function transferHits(text) {
  return sentences(text).filter((s) => TRANSFER_PATTERNS.some((re) => re.test(s)));
}
// 추측성(불확실한 존재를 단정처럼 말하는) 패턴 — 여러 개면 속 빈 글
export const SPECULATIVE_PATTERNS = [
  /열릴 수 있|열릴 경우|열릴 예정|열리기도 합니다/,
  /운영될 수 있|운영될 경우|운영되고 있을|운영하기도/,
  /제공할 수 있|제공될 수 있|제공하기도 합니다/,
  /것입니다|것이에요|것으로 보|것으로 예상|일 것으로/,
  /기회가 될|기회를 제공/,
  /만날 수 있습니다|만나볼 수 있습니다|경험할 수 있습니다/,
  /즐길 수 있는 (공간|곳)입니다|즐길 수 있습니다/,
  /선사합니다|선사해요|선사할 거예요/,
  /있을 것으로|듯합니다|듯해요|일 수도 있/,
];

function sentences(text) {
  // 소제목(#)·목록(-,*) 줄 제외 → 본문 서술문만 대상
  const body = String(text || "")
    .split(/\r?\n/)
    .filter((l) => l.trim() && !/^#{1,6}\s/.test(l) && !/^\s*[-*]\s/.test(l))
    .join(" ")
    .replace(/\*\*/g, "");
  return body.split(/(?<=[.!?]|[요다])\s+/).map((s) => s.trim()).filter((s) => s.length > 4);
}
export function vagueHits(text) {
  const b = String(text || "");
  return VAGUE_BANNED.filter((w) => b.includes(w));
}
export function speculativeHits(text) {
  return sentences(text).filter((s) => SPECULATIVE_PATTERNS.some((re) => re.test(s)));
}
export function speculativeRatio(text) {
  const s = sentences(text);
  return s.length ? speculativeHits(text).length / s.length : 0;
}
/** 방문 팁 목록이 전부 "정보 없음"인지 */
export function tipsAllEmpty(text) {
  const tipLines = String(text || "").match(/^\s*[-*]\s*\*\*[^*]+\*\*\s*:.*/gm) || [];
  if (!tipLines.length) return false;
  return tipLines.every((l) => /정보\s*없음/.test(l));
}

// ── 자동 품질검사 (통과분만 발행) ──
// ── 동어반복 검사 (로컬, API 0회) ────────────────────────────────
//  재료가 부족하면 모델은 같은 사실을 표현만 바꿔 되풀이해 분량을 채운다.
//  발행분 실측 결과 11%(59/528)가 같은 두 어절을 4회 이상 반복하고 있었다
//  (예: "전시 관람" 5회, "손재형 선생의" 7회). 독자에게는 "내용 없는 글"로 읽혀 이탈로 이어진다.
//  장소명이 들어간 구절은 자연스러운 반복이므로 제외한다.
export function repetitionHits(text, title = "") {
  const body = String(text || "").replace(/[#*`>\-]/g, " ").replace(/\s+/g, " ");
  const t = String(title || "").replace(/\s+/g, "");
  const words = body.split(" ").filter((w) => w.length > 1);
  const count = new Map();
  for (let i = 0; i < words.length - 1; i++) {
    const g = `${words[i]} ${words[i + 1]}`;
    if (g.length < 7) continue;
    if (t && (t.includes(words[i]) || t.includes(words[i + 1]))) continue; // 장소명 반복은 정상
    count.set(g, (count.get(g) || 0) + 1);
  }
  return [...count.entries()].filter(([, n]) => n >= 5).sort((a, b) => b[1] - a[1]);
}

export function qualityCheck(text, { overview = "", existingTexts = [], minimalMode = false, title = "" } = {}) {
  const body = String(text || "").trim();
  const len = stripMd(body).length;

  // 3단계: 근거 없는 미사여구·추측성 문장 반려
  const vh = vagueHits(body);
  if (vh.length) return { ok: false, reason: `근거없는 미사여구(${vh.slice(0, 3).join(",")})`, len };
  // "자료가 없다"는 메타 서술은 독자에게 무의미 → 근거가 생길 때까지 발행하지 않는다
  const mh = metaHits(body);
  if (mh.length) return { ok: false, reason: `자료없음 메타문장(${mh.slice(0, 2).join(",")})`, len };
  // 전달체("~소개돼 있어요")가 여러 개면 근거를 옮기기만 한 글 → 반려
  const th = transferHits(body);
  if (th.length >= 3) return { ok: false, reason: `전달체 문장 ${th.length}개("${th[0].slice(0, 24)}…")`, len };
  const spec = speculativeHits(body);
  const sr = speculativeRatio(body);
  // 완화: 여행 소개글은 "~할 수 있어요"가 자연스러움 → 지나치게 많을 때만 반려
  if (spec.length >= 4 || sr > 0.4)
    return { ok: false, reason: `추측성 문장 ${spec.length}개(${(sr * 100).toFixed(0)}%)`, len };

  // 원본 풍부 700~900, 빈약/안전버전 300~500 허용(짧은 게 틀린 것보다 나음). 하한 300.
  // 최소가공(minimalMode)은 근거 없는 문장이 잘려 짧아질 수 있어 하한을 280으로 완화.
  const minLen = minimalMode ? 280 : 300;
  if (len < minLen) return { ok: false, reason: `길이 ${len}자(너무 짧음)`, len };
  // 상한 3400 — 목표 2,000~2,800자(주변 정보까지 담는 분량)에 여유를 둔 값.
  if (len > 3400) return { ok: false, reason: `길이 ${len}자(너무 김)`, len };

  const headings = (body.match(/^##\s/gm) || []).length;
  if (headings < 3) return { ok: false, reason: `소제목 ${headings}개(<3)`, len };
  if (!/방문\s*팁/.test(body)) return { ok: false, reason: "방문 팁 없음", len };
  // 형식은 갖췄는데 같은 말만 되풀이하는 글 반려 → 재시도 프롬프트로 되먹여 다시 쓰게 한다.
  const rep = repetitionHits(body, title);
  if (rep.length) return { ok: false, reason: `동어반복("${rep[0][0]}" ${rep[0][1]}회)`, len };
  if (!/^\s*[-*]\s+\S/m.test(body)) return { ok: false, reason: "목록 없음", len };

  if (/[ㅋㅎ]{2,}|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(body))
    return { ok: false, reason: "이모티콘/채팅체", len };
  if (/즐거운 시간 되세요|많은 관심 바랍|강력 추천/.test(body))
    return { ok: false, reason: "광고성/상투구", len };

  // 최소가공 폴백은 원본을 충실히 재구성하는 "안전 바닥"이라 원본 유사도 검사에서 제외한다.
  // (글이 없으면 상세페이지는 어차피 원본 overview를 그대로 노출 → 재구성본이 UX·SEO상 열위가 아님)
  if (!minimalMode && overview && similarity(body, overview) > 0.62)
    return { ok: false, reason: "원본 overview와 과유사", len };
  for (const ex of existingTexts) {
    if (similarity(body, ex) > 0.65) return { ok: false, reason: "기존 발행글과 중복", len };
  }
  return { ok: true, reason: "", len };
}

// ── 안전망 2: 근거에 없는 연도·인물 탐지 ──
// 인물 오탐 방지: 일반어("국내외/지역/여러 작가")·조사 붙은 지명("부산에는 작가")은 인물로 보지 않는다.
const PERSON_TITLES = "화백|화가|선생|장군|박사|여사|작가|대사|창건자|설계자|시인|황제|국왕|왕비|대감|대군";
const PERSON_STOP = new Set([
  "국내외", "국내", "국외", "해외", "전국", "지역", "여러", "다양", "유명", "신진", "지방",
  "현지", "원로", "중견", "세계", "각국", "국제", "동네", "마을", "우리", "젊은", "향토",
]);
const PARTICLE_TAIL = /(에서는|에게서|에서|에게|에는|으로|로서|로써|께서|이라|라는|들이|들의|들을|들과|에|은|는|이|가|의|을|를|도|과|와|들)$/;

/** 글에서 "근거에 없는" 연도·인물을 찾아 목록으로 반환(빈 배열이면 문제 없음) */
export function findUnsupported(text, overview) {
  const body = String(text || "");
  const srcTight = String(overview || "").replace(/\s+/g, "");
  const out = [];

  // 4자리 연도(1000~2099)가 글에 있는데 근거에 없으면 근거없음
  const years = new Set([...body.matchAll(/\b(1\d{3}|20\d{2})\b/g)].map((m) => m[1]));
  for (const y of years) if (!srcTight.includes(y)) out.push({ type: "year", value: y, phrase: y });

  // 인물 직함 앞 이름 토큰이 (조사 제거 후) 근거에 없고 일반어도 아니면 근거없음
  for (const m of body.matchAll(new RegExp(`([가-힣]{2,4})\\s?(${PERSON_TITLES})`, "g"))) {
    const name = m[1].replace(PARTICLE_TAIL, "");
    if (name.length < 2) continue;         // 조사 떼고 1자면 이름으로 보기 어려움
    if (PERSON_STOP.has(name)) continue;    // "국내외 작가" 같은 일반 표현 제외
    if (srcTight.includes(name)) continue;  // 근거에 있는 이름
    out.push({ type: "person", value: name, phrase: m[0] });
  }
  return out;
}

// ── 안전망 2: 정규식 패턴 검사 (원본에 없는 연도·인물 차단) ──
export function patternCheck(text, overview) {
  const bad = findUnsupported(text, overview);
  if (!bad.length) return { ok: true, reason: "" };
  const f = bad[0];
  return {
    ok: false,
    reason: f.type === "year" ? `원본에 없는 연도 "${f.value}"` : `원본에 없는 인물 표현 "${f.phrase}"`,
  };
}

// ── 자가 치유: 글 전체를 버리지 말고, 근거 없는 표현이 든 "문장/줄"만 잘라낸다. ──
// 환각 연도 하나 때문에 좋은 글 전체를 반려하던 손실을 막는 핵심 레버(반려율 급감).
export function sanitizeUnsupported(text, overview) {
  const bad = findUnsupported(text, overview);
  if (!bad.length) return { text: String(text || ""), removed: 0 };
  const needles = [...new Set(bad.map((b) => b.phrase))];
  let removed = 0;
  const outLines = [];
  for (const line of String(text || "").split(/\r?\n/)) {
    if (!needles.some((n) => line.includes(n))) { outLines.push(line); continue; }
    if (/^#{1,6}\s/.test(line)) { outLines.push(line); continue; } // 소제목 줄은 유지
    // 문장 단위로 나눠 "문제 문장"만 제거(나머지 문장은 살림)
    const parts = line.split(/(?<=[.!?]|[요다])\s+/);
    const kept = parts.filter((s) => !needles.some((n) => s.includes(n)));
    if (kept.length) outLines.push(kept.join(" "));
    else removed++;
  }
  return { text: outLines.join("\n").replace(/\n{3,}/g, "\n\n").trim(), removed: removed || bad.length };
}

// ── 안전망 3: OpenAI 검증 + SEO/가독성 개선 (원본 범위 내에서만) ──
// facts: 주소·이용시간·요금·시설 등 TourAPI intro/info에서 온 "확정 사실". 원본과 동등한 근거로 취급(오검출 방지).
export async function verifyAndImprove(overview, article, { apiKey, model, facts = "" } = {}) {
  if (!apiKey) return { result: "SKIP", reason: "OPENAI_API_KEY 없음", improved: "" };
  const mdl = model || "gpt-4o-mini";
  const prompt = `아래 "원본"과 "글"을 받아 두 가지를 수행하라.

<원본>
${overview || "(상세 소개 자료 없음 — 위치·유형·주소 외의 사실은 모두 근거 없음으로 간주)"}
${facts ? `\n[확정 사실 — 아래는 공식 데이터에서 온 근거로, 원본과 동등하게 취급하라. 글에 이 값(주소·이용시간·휴무일·요금·주차·문의처·시설명 등)이 있어도 절대 FAIL하지 마라]\n${facts}` : ""}
</원본>

<글>
${article}
</글>

## 작업 1 - 팩트체크
- 근거 = "원본" + "[확정 사실]" 둘 다. 이 둘 어디에도 없는 사실(연도·인물·사건·구체적 수치)이 글에 있으면 FAIL. 어느 문장인지 reason에 지목.
- ★ [확정 사실]에 있는 주소·이용시간·휴무일·요금·주차·문의처·시설명은 정당한 근거다. 이런 값이 글에 있다는 이유로 FAIL하지 마라.
- 일반적 서술("오랜 역사를 지닌" 등)과 장소의 지역·유형·주소는 허용.
- 추측성 문장("열릴 수 있습니다","운영될 경우","~것입니다","만날 수 있습니다")이 다수(2개 이상)면 FAIL.

## 작업 2 - SEO·가독성 개선 (PASS인 경우만)
- 원본에 있는 사실 범위 내에서만 개선한다. 새 사실(연도·인물·사건·수치) 절대 추가 금지.
- ★ 금지 표현 제거: "유명한/인기 있는/맛있기로 소문난/현지인 맛집/다채로운 경험·볼거리/즐거움을 선사/특별한 시간을 선사" 같은 근거 없는 미사여구와 "~할 수 있습니다/열릴 경우/운영될 경우/~것입니다" 같은 추측 표현은 삭제하거나 근거 있는 구체 표현으로 교체한다. 근거가 없으면 그 문장을 통째로 뺀다(짧아져도 됨).
- ★ 분량은 2,000~2,800자를 지향한다. 원본 근거가 충분하면 문장을 줄이지 말고, 오히려 근거 안에서 풀어 써 채운다. 근거가 빈약하면 억지로 늘리지 말고 짧게 둔다.
- ★ "## 근처에서 함께 둘러보기"의 업소명·장소명·거리는 [확정 사실]에서 온 값이다. 지우지 말고 FAIL하지도 마라.
- ★ 한 소제목 아래 문단이 하나뿐이면 2~4문장 단위로 쪼갠다. 긴 덩어리 금지.
- 개선: 어색한 문장 자연스럽게 / SEO 키워드(지역명+장소유형+장소명) 문맥에 맞게 보강 / 소제목(##)·문단 구조 정리 / 뻔한 미사여구("특별한 시간을 선사" 등)를 원본 근거의 구체적 표현으로.
- 형식 유지: 첫 줄 굵은 한 문장 + ## 어떤 곳인가요 / ## 볼거리·즐길거리 / (## 아이·가족과 함께라면) / (## 가는 길·주차) / ## 방문 팁(목록). 친근한 ~해요체.

## 출력 (JSON만)
{"result":"PASS 또는 FAIL","reason":"이유","improved_article":"개선된 마크다운 글(PASS일 때만, FAIL이면 빈 문자열)"}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: mdl,
        ...(supportsTemperature(mdl) ? { temperature: 0 } : {}),
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "너는 사실 근거 검증기이자 한국어 SEO 에디터다. 원본에 없는 사실은 잡아내 FAIL하고, PASS면 원본 범위 내에서만 글을 개선한다. JSON만 답한다." },
          { role: "user", content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) {
      const t = await res.text();
      return { result: "ERROR", reason: `OpenAI HTTP ${res.status}: ${t.slice(0, 150)}`, improved: "" };
    }
    const j = await res.json();
    addUsage(j?.usage);
    const content = j?.choices?.[0]?.message?.content || "";
    const m = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m ? m[0] : content);
    return {
      result: parsed.result === "PASS" ? "PASS" : "FAIL",
      reason: String(parsed.reason || ""),
      improved: String(parsed.improved_article || "").trim(),
    };
  } catch (e) {
    return { result: "ERROR", reason: String(e instanceof Error ? e.message : e), improved: "" };
  }
}

// ── 보조 안전망: Gemini 독립 팩트체크 (주=Luna와 다른 모델로 환각 교차검증. 판정만, 글 수정 안 함) ──
export async function factCheckGemini(article, { apiKey, model = "gemini-2.5-flash-lite", overview = "", facts = "" } = {}) {
  if (!apiKey) return { result: "SKIP", reason: "GEMINI_API_KEY 없음" };
  const prompt = `너는 사실 근거 검증기다. "글"이 "근거"에 없는 사실을 지어냈는지만 판정하라. 글을 고치지 마라.

<근거>
${overview || "(상세 소개 없음 — 지역·유형·주소 외의 사실은 모두 근거 없음으로 간주)"}
${facts ? `\n[확정 사실 — 아래도 근거로 인정]\n${facts}` : ""}
</근거>

<글>
${article}
</글>

[판정 기준]
- 근거(원본+확정사실)에 없는 구체적 사실(연도·인물·사건·수치·고유명사·시설명)이 글에 있으면 FAIL. 어느 부분인지 reason에 지목.
- 일반적 서술("오랜 역사를 지닌" 등)과 장소의 지역·유형·주소는 허용.
- 확정 사실에 있는 주소·이용시간·휴무일·요금·주차·문의처·시설명은 정당한 근거이므로 FAIL 사유가 아니다.

JSON만 출력: {"result":"PASS 또는 FAIL","reason":"근거 없는 사실 지목 또는 이유"}`;
  try {
    const { text } = await callGemini(prompt, { apiKey, model });
    const m = String(text || "").match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m ? m[0] : text);
    return { result: parsed.result === "FAIL" ? "FAIL" : "PASS", reason: String(parsed.reason || "") };
  } catch (e) {
    return { result: "ERROR", reason: String(e instanceof Error ? e.message : e) };
  }
}

// ── 폴백: "원본 최소 가공" (원본 사실 그대로, 구조·말투만 손봄 → 틀릴 여지 0) ──
export function buildMinimalPrompt(place, overview) {
  const type = tourTypeLabel(place.type);
  return `아래 "원본"의 내용과 사실을 그대로 유지한 채, 딱 두 가지만 손봐서 소개글로 정리해라.
1) 정렬·구조화: 문단을 나누고 소제목(##)으로 묶는다.
2) 말투 변환: "~이다/~된다/~있다" 문어체를 "~해요/~이에요" 친근체로 바꾼다.
그 외 새 문장·새 정보(연도·인물·역사·수치)는 절대 추가하지 마라. 원본에 있는 사실만, 순서만 정리하고 표현만 부드럽게 한다.

<원본>
${overview}
</원본>

[장소] ${place.title} / [지역] ${place.area} / [유형] ${type}

출력(마크다운, 이 형식):
- 첫 줄: 원본을 요약한 굵은 한 문장(**...**). "${place.area}에 자리한 ${type}, ${place.title}"으로 시작하면 좋다(이건 사실이니 허용).
- ## 어떤 곳인가요 : 원본에서 위치·성격 부분
- ## 볼거리·즐길거리 : 원본에서 시설·특징 부분
- ## 방문 팁 : 원본에 요금·시간·주차가 있으면 목록으로, 없으면 아래 그대로
  - **입장료**: 정보 없음 — 방문 전 공식 홈페이지 확인 권장
  - **관람 시간**: 정보 없음 — 방문 전 공식 홈페이지 확인 권장
친근한 안내체. 이모티콘·인사말 금지. 원본에 없는 내용은 한 글자도 넣지 마라. 마크다운 글만 출력.`;
}

// ── 승인 예시 2편 (few-shot: 톤·가독성 고정) ──
const EXAMPLES = `<예시1>
**놀이공원 드림랜드가 있던 자리가, 20만 평 도심 숲으로 다시 태어났어요.**

## 어떤 곳인가요
북서울꿈의숲은 강북구에 자리한, 서울에서 손꼽히는 대형 공원이에요. 지하철 4호선 미아역에서 걸어갈 수 있고 입장료도 무료라, 부담 없이 찾기 좋아요.

넓은 잔디밭과 숲길, 연못이 어우러져 도심 속에서 자연을 만끽하기 좋은 곳이에요.

## 볼거리·즐길거리
공원 한가운데에는 전통 정취가 흐르는 연못 '월영지'와 월광폭포가 있어요. 물가를 따라 천천히 걷기만 해도 마음이 편안해져요.

높이 49.7m 전망대에 오르면 북한산·도봉산·수락산 능선이 한눈에 들어와요. 봄에는 벚꽃길, 가을에는 단풍숲이 특히 아름다워요.

## 아이·가족과 함께라면
여름철 물놀이터와 점핑분수, 사슴을 볼 수 있는 사슴방사장은 아이들에게 인기가 많아요.

올망졸망 놀이숲 같은 자연 놀이 공간도 곳곳에 있어 초등 저학년까지 신나게 뛰어놀 수 있어요.

## 가는 길·주차
지하철 4호선 미아역에서 도보로 닿을 수 있어 대중교통만으로도 충분히 다녀올 수 있어요.

차로 간다면 동문·서문 주차장을 이용하면 되는데, 주말 낮에는 자리가 빨리 차는 편이에요.

## 방문 팁
- **입장료**: 무료 (일부 시설·전시는 별도)
- **주차**: 동문·서문 총 386면 (주말엔 붐벼서 대중교통도 추천)
- **소요 시간**: 2시간 안팎
- **추천 시기**: 봄 벚꽃, 가을 단풍

시설별 운영 시간은 달라질 수 있으니, 방문 전 공식 홈페이지에서 확인하는 것을 권해요.
</예시1>`;

// detailIntro 공통 스키마 → 방문 팁 라벨(생성 프롬프트에 넣을 사실)
const INTRO_LABEL = {
  usetime: "이용시간", restdate: "휴무일", fee: "이용요금", discountinfo: "할인정보",
  parking: "주차", parkingfee: "주차요금", reservation: "예약", openperiod: "운영기간",
  babycarriage: "유모차 대여", pet: "반려동물", creditcard: "신용카드", infocenter: "문의처",
  firstmenu: "대표메뉴", treatmenu: "취급메뉴", kidsfacility: "어린이 시설",
};
/** 2단계 수집분(intro·info)을 "사실 목록"으로 포맷 — 프롬프트에 주입 */
export function buildFactsBlock({ intro, info } = {}) {
  const lines = [];
  if (intro) {
    const rows = Object.entries(INTRO_LABEL)
      .filter(([k]) => intro[k] && String(intro[k]).trim())
      .map(([k, label]) => `- ${label}: ${String(intro[k]).replace(/\s+/g, " ").trim()}`);
    if (rows.length) lines.push(`[운영 정보 — 방문 팁에 이 값만 사용, 값 있는 항목만 넣고 없는 항목은 줄째 빼기]\n${rows.join("\n")}`);
  }
  if (info && info.length) {
    const rows = info.slice(0, 8).map((x) => `- ${[x.name, x.text].filter(Boolean).join(": ")}`);
    lines.push(`[실제 시설·볼거리 — 볼거리·즐길거리는 아래 이름만 사용]\n${rows.join("\n")}`);
  }
  return lines.join("\n\n");
}

// ── 웹 검색 근거 수집 (정보성 강화의 핵심) ──────────────────────────
// TourAPI overview는 3~5문장뿐이라 "정보성 블로그"가 나올 수 없다.
// 생성 전에 공식 출처를 검색해 검증 가능한 사실만 뽑아 근거로 추가한다.
// ⚠️ 실패(모델이 web_search 미지원·HTTP 오류·파싱 실패)해도 절대 던지지 않는다.
//    빈 결과를 돌려주면 파이프라인은 기존과 똑같이 overview만으로 동작한다.
const RESEARCH_DOMAINS = "go.kr(정부·지자체), or.kr(공공기관), visitkorea.or.kr, 해당 시설 공식 홈페이지";

export async function researchFacts(place, { apiKey, model, timeoutMs = 90000 } = {}) {
  const empty = { text: "", sources: [], reason: "" };
  if (!apiKey) return { ...empty, reason: "OPENAI_API_KEY 없음" };
  const type = tourTypeLabel(place.type);
  const prompt = `"${place.title}"(${place.area}, ${type}, 주소: ${place.addr})에 대해 웹에서 검증 가능한 사실만 수집하라.

[수집 대상 — 방문자에게 실제로 필요한 정보]
- ★ 이곳이 "어떤 곳인지" 설명하는 개요: 무엇을 위해 만든 곳인지(조성 목적·배경), 어떤 지형·성격의 공간인지
- 주요 시설·볼거리는 이름만 나열하지 말고 **그게 무엇인지 한 줄 설명까지** 함께(예: "링 워크 = 습지를 한 바퀴 도는 탐방로")
- 규모·구성(면적, 길이, 구역 구성)
- 이용시간, 휴무일, 이용요금(무료 여부 포함)
- 주차장 위치·면수·요금
- 대중교통(지하철역·출구, 버스 노선번호), 도보 소요시간
- 계절별 볼거리, 아이·가족 관련 시설, 지정·인증 사항

[검색 방법 — 최소한으로]
- 웹 검색은 "${place.title} ${place.area}"로 **딱 한 번만** 실행하라. 추가 검색·재검색 금지.
- 검색 결과 첫 페이지의 상위 2~3개 문서만 보고, 거기 명확히 적힌 것만 뽑아라.
- 페이지를 더 열어보거나 깊이 파고들지 마라. 사실이 적으면 적은 대로 끝내라.

[규칙]
- 출처는 ${RESEARCH_DOMAINS} 위주. 개인 블로그·카페·커뮤니티는 쓰지 마라.
- 확인되지 않은 것은 넣지 마라. 추측·요약 과장 금지. **사실이 적으면 적은 대로 반환**한다.
- 각 사실은 한 줄로 짧게, 숫자는 출처에 나온 그대로.
- **12~18건만 모아라.** 많이 모으지 말고 방문자에게 가장 중요한 것부터 골라라(정체·대표 시설·규모·요금·시간·교통). 시설마다 '무엇인지' 한 줄 설명을 붙여라.
- 같은 장소가 아닌 동명이인·유사명 장소의 정보를 섞지 마라(주소로 반드시 확인).
- 요금·시간처럼 자주 바뀌는 값은 출처에 명시된 것만.

JSON만 출력:
{"facts":[{"fact":"한 줄 사실","source":"출처 URL"}],"notFound":true 또는 false}`;

  // 검색 도구 이름은 계정·모델에 따라 web_search / web_search_preview 두 가지가 쓰인다.
  // 하나가 400이면 다른 이름으로 자동 재시도(어느 쪽이 먹는지 몰라도 되게).
  const toolTypes = ["web_search", "web_search_preview"];
  let res = null, lastErr = "";
  try {
    for (const toolType of toolTypes) {
      const r = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: model || "gpt-5.6-luna",
          tools: [{ type: toolType }],
          input: prompt,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (r.ok) { res = r; break; }
      const t = await r.text();
      lastErr = `${toolType} → HTTP ${r.status}: ${t.slice(0, 160).replace(/\s+/g, " ")}`;
      // 400(도구 미지원)만 다음 이름으로 재시도. 401/429 등은 재시도해도 같음.
      if (r.status !== 400) break;
    }
    if (!res) return { ...empty, reason: lastErr || "요청 실패" };
    const j = await res.json();
    addUsage(j?.usage, { search: true });
    // output_text(단축 필드)가 없으면 output 배열에서 텍스트 조각을 모은다
    let raw = typeof j.output_text === "string" ? j.output_text : "";
    if (!raw && Array.isArray(j.output)) {
      raw = j.output
        .flatMap((o) => (Array.isArray(o?.content) ? o.content : []))
        .map((c) => c?.text || "")
        .filter(Boolean)
        .join("\n");
    }
    const m = String(raw).match(/\{[\s\S]*\}/);
    if (!m) return { ...empty, reason: "JSON 없음" };
    const parsed = JSON.parse(m[0]);
    const facts = Array.isArray(parsed.facts) ? parsed.facts : [];
    const clean = facts
      .map((f) => ({ fact: String(f?.fact || "").replace(/\s+/g, " ").trim(), source: String(f?.source || "").trim() }))
      .filter((f) => f.fact.length > 3)
      .slice(0, 18);
    if (!clean.length) return { ...empty, reason: "수집된 사실 없음" };
    const sources = [...new Set(clean.map((f) => f.source).filter((u) => /^https?:\/\//.test(u)))].slice(0, 6);
    const text = clean.map((f) => `- ${f.fact}${f.source ? ` (출처: ${f.source})` : ""}`).join("\n");
    return { text, sources, reason: "" };
  } catch (e) {
    return { ...empty, reason: String(e instanceof Error ? e.message : e) };
  }
}

// ── 프롬프트 생성 ──
// ── 작성 지침(전 장소 공통) ─────────────────────────────────────
//  ⚠️ 프롬프트 캐싱으로 이걸 앞에 두는 시도는 하지 말 것 — 2026-08-24 실측으로 무의미함이 확인됐다.
//     gpt-5.6-luna의 캐싱은 "접두 일치"가 아니라 "프롬프트 완전 일치"에만 걸린다.
//     (같은 지침 접두 + 다른 장소 = cached_tokens 0 / 완전히 같은 프롬프트 = 3,959 적중)
//     게다가 캐시 기록은 $0.25/1M로 일반 입력 $0.20/1M보다 비싸다. 장소마다 프롬프트가 다르니 이득이 없다.
//  순서는 원래대로 "자료 먼저 → 지침 나중". 그 편이 실측 품질이 좋았다(2,093자 PASS vs 1,535자 FAIL).
function writingGuide(place, type) {
  return `[🚫 금지 표현 — 하나도 쓰지 말 것 (근거 없는 미사여구·추측)]
- "유명한", "인기 있는", "맛있기로 소문난", "현지인 맛집", "다채로운 경험/볼거리", "즐거움을 선사", "특별한 시간을 선사"
- "~할 수 있습니다", "열릴 경우", "운영될 경우", "~것입니다", "제공할 수 있는", "만날 수 있습니다" 같은 추측·불확실 표현
- 근거에 없으면 그 항목 자체를 쓰지 말 것(빈 말로 채우지 말 것). 확실한 사실만.
- ★ "제공된 자료에는 ~ 없어요", "근거에 기재되어 있지 않아요", "이번 안내에서는 ~ 중심으로" 같은 **자료 사정을 설명하는 문장은 절대 금지**입니다.
  독자는 자료 사정에 관심이 없습니다. 쓸 내용이 없으면 그 소제목을 통째로 빼세요. 짧은 글이 낫습니다.
- ★ **전달체 금지**: "~라고 소개돼 있어요", "~시설이 소개된 곳이에요", "기재돼 있어요", "확인할 수 있는 지점이에요".
  근거를 옮기지 말고 **그 장소가 어떤 곳인지 직접 설명**하세요.
  ✗ "난지생태습지원과 링 워크가 소개돼 있어요"
  ✓ "난지생태습지원은 한강 하류 생태계를 되살리려고 만든 인공 습지예요. 습지를 한 바퀴 도는 탐방로 '링 워크'를 따라 걸으면 물가 식생과 한강을 함께 볼 수 있어요."

[⚠️ 사실 정확성 — 가장 중요]
- 사실 근거에 **없는** 인물 이름·건립 연도·역사적 사건·건립 배경을 **절대 지어내지 마세요.** (틀린 정보는 최악입니다.)
- 확실하지 않은 것은 구체적으로 단정하지 말고 일반적으로 서술하세요. (예: 연도를 모르면 "오랜 역사를 지닌"으로만.)
- 주소·위치·시설명·요금 등은 사실 근거에 있는 그대로만 쓰세요.
- 문장은 새로 쓰되(그대로 베끼지 말 것), 담긴 사실은 근거를 벗어나지 마세요.

[분량 — 거짓 없이 "풀어서" 채우기]
- 근거가 풍부하면 2,000~2,800자(공백 제외). 근거가 빈약하면 400~600자도 좋습니다.
  [주변 정보]가 주어졌다면 근거가 풍부한 경우입니다 — 2,000자 아래로 끝내지 마세요.
- ★ 근거가 12~18건으로 적습니다. **한 건도 버리지 말고**, 각 사실을 최소 3문장으로 풀어 써서 분량을 채우세요.
  적은 재료로 길게 쓰는 것이 핵심입니다. 사실을 나열해 끝내지 말고, 아래 [정보성 서술법]대로 늘리세요.
  사실 하나 = 한 문장이 아니라, '무엇인지 → 어떻게 생겼는지/얼마나 되는지 → 방문자가 무엇을 하게 되는지' 순으로 늘려 쓰세요.
- ★ 분량 채우려고 없는 내용 지어내기 절대 금지. **짧은 게 틀린 것보다 낫습니다.**
- 분량은 "내용 없는 인사말·채우기 문장"이 아니라, **근거에 있는 사실 하나하나를 여러 문장으로 풀어서** 채웁니다.
  근거의 한 단어도 그냥 나열하지 말고, 방문자가 실제로 무엇을 보고 겪게 되는지로 바꿔 쓰세요.
  예: "자연관찰로 있음" → "자연관찰로를 따라 걸으면 계절마다 다른 식물과 물새를 가까이서 볼 수 있어요. 길이 평탄해 아이와 천천히 걸으며 자연 학습 나들이를 하기에도 좋아요."
  예: "습지생태공원" → 어떤 지형인지 · 무엇이 복원돼 있는지 · 그래서 방문자가 무엇을 보게 되는지 3문장으로.
- 소제목별 최소 분량: 어떤 곳인가요 2문단(각 2~4문장), 볼거리·즐길거리 2~3문단(근거의 시설·지형·명소를 하나씩 풀어서), 아이·가족 1~2문단(해당 시), 방문 팁 목록 3~5줄.
- ★ "## 어떤 곳인가요"는 주소 나열이 아니라 **정체 설명**입니다. 이 세 가지에 답하세요:
  ① 무엇을 위해 만들어진 어떤 성격의 공간인가 ② 어떤 지형·구성으로 되어 있나 ③ 방문자는 여기서 주로 무엇을 하나.
  주소는 방문 팁이나 가는 길에서 다루고, 이 섹션에서 반복하지 마세요.

[구조·서식]
- 맨 위 첫 줄: 그 장소 특징을 담은 매력적인 한 문장을 **굵게**(뻔한 인사 금지, 장소마다 다르게).
- 소제목 순서(근거가 있는 것만 쓰되 최소 4개, 근거가 많으면 6개까지):
  ## 어떤 곳인가요 → ## 볼거리·즐길거리 → (## 아이·가족과 함께라면) → (## 언제 가면 좋을까요) → (## 가는 길·주차) → (## 근처에서 함께 둘러보기) → ## 방문 팁
  · "## 근처에서 함께 둘러보기"는 [주변 정보]가 주어졌을 때만 쓰세요. 목록을 그대로 옮겨 적지 말고,
    "이 장소를 보고 나서 어디로 이어 가면 좋은지"를 동선으로 설명하세요(가까운 순으로 묶고, 맛집은 식사 타이밍과 함께).
    예: "관람을 마치고 남쪽으로 500m쯤 내려가면 나누미떡볶이가 있어요. 대표메뉴는 쌀떡볶이예요.
        조금 더 걸어 창덕궁 인정문까지 이어 보면 궁궐 두 곳을 하루에 묶을 수 있어요."
  · "## 가는 길·주차"는 [운영 정보]에 주차·문의처가 있거나 근거에 교통 언급이 있을 때만 쓰고, 없으면 소제목째 빼세요.
  · "## 언제 가면 좋을까요"는 근거에 계절·운영기간·시기별 시설(물놀이장·단풍·축제 등) 언급이 있을 때만 쓰세요.
- ★ 볼거리가 여러 개면 한 문단에 몰아넣지 말고 **시설·구역마다 문단을 나눠** 각각 2~3문장으로 설명하세요.
[정보성 서술법 — 사실 하나를 3문장으로 늘리는 방법]
사실 한 건마다 아래 3단계를 순서대로 쓰면 자연스럽게 분량이 채워집니다.
  ① 그것이 무엇인지 (정의·성격)  ② 얼마나·어떻게 되어 있는지 (규모·구성·운영)  ③ 방문자에게 어떤 의미인지 (그래서 뭘 할 수 있나)
예시 — 근거: "난지물놀이장 수심 80cm, 길이 140m"
  ✗ "난지물놀이장은 수심 80cm, 길이 140m예요." (한 문장에 끝냄 — 나쁨)
  ✓ "난지물놀이장은 한강을 바라보며 물놀이를 하는 강변 풀장이에요. 길이 140m에 수심은 80cm로 맞춰져 있어요. 어른 무릎에서 허리 사이 깊이라 초등 저학년도 발이 닿아, 아이와 함께 온 가족이 이용하기 무난해요."
- ★ ③단계(방문자에게 어떤 의미인지)를 빠뜨리지 마세요. 이게 정보 나열과 정보성 블로그를 가르는 차이입니다.
- 단, ③은 근거에서 논리적으로 따라오는 범위까지만 씁니다. 없는 사실을 만들어 붙이지 마세요.
- ★ 한 소제목 아래 문단이 하나뿐이면 안 됩니다. 문단은 2~4문장으로 끊고 사이에 빈 줄. 긴 덩어리 금지.
- ## 방문 팁은 목록(-), 라벨 굵게: 위 [운영 정보]에 **값이 있는 항목만** 넣으세요(예: **이용시간**, **휴무일**, **주차**, **이용요금**). 값이 없는 항목은 줄째 빼고, "정보 없음"을 여러 줄 반복하지 마세요. 운영 정보가 하나도 없으면 방문 팁 목록에 **추천 시기** 한 줄 정도만.
- **굵게**는 핵심 키워드만(명소명·지역명·입장료·계절), 문단당 2~3개.

[SEO — 구글 검색 최적화]
- 첫 문단 안에 "지역+유형+장소명"을 자연스럽게 넣으세요(예: "${place.area}에 자리한 ${type}, ${place.title}").
- 소제목에도 장소명이나 지역명을 한 번씩 자연스럽게 섞으세요(예: "## ${place.title}, 어떤 곳인가요"). 모든 소제목에 넣지는 마세요(2개 정도).
- "${place.area} 나들이", "${place.area} 가볼만한 곳" 같은 검색어는 문맥에 맞을 때만 1~2회. 억지 반복 금지.
- 검색 결과에 그대로 뜨는 첫 문장은 그 장소만의 구체적 특징으로 시작하세요(어디에나 쓸 수 있는 문장 금지).
- 각 소제목은 독자가 실제로 검색하는 질문에 답하는 내용이어야 합니다(무엇이 있나 / 무엇을 하나 / 언제 가면 좋나).

[톤 — 정보 전달이 최우선]
- 감상·형용사보다 **구체적 정보**를 앞세우세요. 방문자가 실제로 알아야 할 것(무엇이 있는지, 얼마인지, 언제 여는지, 어떻게 가는지)을 먼저 씁니다.
- 근거에 숫자·시설명·노선번호가 있으면 뭉개지 말고 그대로 적으세요("주차 가능"보다 "주차장 99면, 06:00~24:00").
- "아름다운 풍경이 펼쳐집니다" 같은 내용 없는 묘사로 줄을 채우지 마세요. 한 문장에 최소 하나의 사실.
- 말투는 쉬운 안내체("~해요","~예요")로 통일합니다(사이트 기존 글과 동일).
- 이모티콘·"ㅋㅋ/ㅎㅎ"·채팅체·과장 광고·공문서 톤 금지.

아래는 톤·형식 예시입니다. 형식만 따르고 내용은 이 장소의 사실 근거로만 새로 쓰세요.
${EXAMPLES}
`;
}

export function buildPrompt(place, overview = "", extras = {}) {
  const type = tourTypeLabel(place.type);
  const facts = buildFactsBlock(extras);
  // 직전 시도 반려 사유를 되먹여 같은 실수를 반복하지 않게 한다(재시도가 시도1의 복제가 되던 문제 해소).
  const retry = extras.retryHint
    ? `\n[❗ 직전 시도가 반려됐어요 — 아래를 반드시 교정하세요]\n${extras.retryHint}\n`
    : "";
  // 웹 검색으로 모은 검증 사실 — overview와 동등한 근거로 취급(정보성 강화의 핵심 재료)
  const research = extras.research
    ? `\n[검증된 추가 사실 — 공식 출처에서 수집. overview와 동등한 근거이니 적극 활용하세요]
${extras.research}
★ 위 항목의 숫자·시설명·노선번호는 그대로 쓰되, "(출처: ...)" 표기는 본문에 옮기지 마세요.\n`
    : "";
  // 로컬 데이터(맛집·근처 명소·코스·행사) — API 0회로 얻은 확정 사실.
  //  재료가 없어 같은 말을 돌려쓰던 문제의 직접 해법이자, 독자가 다음 페이지로 넘어갈 이유다.
  const local = extras.local
    ? `\n[주변 정보 — 우리 사이트가 보유한 실제 데이터입니다. 확정 사실로 취급하고 "## 근처에서 함께 둘러보기"에 활용하세요]
${extras.local}
★ 업소명·장소명·거리·행사명은 **위에 적힌 것만** 쓰세요. 목록에 없는 곳을 지어내지 마세요.
★ 거리는 직선거리입니다. "도보 O분", "차로 O분" 같은 소요시간은 계산해 붙이지 마세요.
★ "직선거리"라는 말을 문장마다 반복하지 마세요. 처음 한 번만 밝히고 이후에는 "500m 거리에", "1.2km 떨어진" 처럼 자연스럽게 쓰세요.\n`
    : "";
  const ref = overview
    ? `[사실 근거 — 아래 내용에 있는 사실만 사용하세요]
"""${overview}"""`
    : `[사실 근거 없음]
이 장소는 상세 소개 자료가 없습니다. 제목·지역·유형·주소만 확실한 사실입니다. 인물·연도·역사·건립배경 등은 절대 지어내지 말고, 위치와 유형 중심으로 짧고 일반적으로만 쓰세요.`;

  return `당신은 한국의 나들이 정보를 정확하게 소개하는 에디터입니다.
아래 장소 소개 글을, 주어진 "사실 근거"를 바탕으로 읽기 좋게 재구성합니다.

[장소] ${place.title}
[지역] ${place.area}
[유형] ${type}
[주소] ${place.addr}

${ref}
${research}${facts ? `\n${facts}\n` : ""}${local}${retry}
${writingGuide(place, type)}

이제 "${place.title}" 소개 글을 마크다운으로만 출력하세요(설명 없이 글만). 사실 근거에 없는 내용은 쓰지 마세요.`;
}

// GPT-5 계열·o1/o3/o4 추론 모델은 chat completions에서 temperature 커스텀 값을 거부(400).
// → 이런 모델엔 temperature를 아예 안 보내 기본값(1)을 쓰게 한다. (gpt-4o 등은 그대로 지정 가능)
export function supportsTemperature(model) {
  return !/^(gpt-5|o1|o3|o4)/i.test(String(model || ""));
}

// ── OpenAI 생성 호출 (초안 작성 — 매일 자동글은 이걸로만 생성) ──
export async function callOpenAI(prompt, { apiKey, model = "gpt-4o-mini" } = {}) {
  if (!apiKey) throw new Error("OPENAI_API_KEY 없음");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      ...(supportsTemperature(model) ? { temperature: 0.4 } : {}),
      messages: [
        { role: "system", content: "너는 한국의 나들이 정보를 정확하게 소개하는 에디터다. 주어진 사실 근거에 없는 내용(연도·인물·사건·수치)은 절대 지어내지 않는다. 요청한 마크다운 형식으로 글만 출력한다." },
        { role: "user", content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI HTTP ${res.status}: ${t.slice(0, 300)}`);
  }
  const j = await res.json();
  addUsage(j?.usage);
  const text = (j?.choices?.[0]?.message?.content || "").trim();
  return { text, sources: [] };
}

// ── Gemini 2.5 Flash-Lite 호출 (레거시 — 현재 파이프라인 미사용, 참고용 보존) ──
export async function callGemini(prompt, { apiKey, model = "gemini-2.5-flash-lite", grounding = false } = {}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }]}],
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048, topP: 0.9 },
    ...(grounding ? { tools: [{ google_search: {} }] } : {}),
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini HTTP ${res.status}: ${t.slice(0, 300)}`);
  }
  const j = await res.json();
  const cand = j?.candidates?.[0];
  const text = (cand?.content?.parts || []).map((p) => p.text || "").join("").trim();
  // grounding 출처 추출
  const chunks = cand?.groundingMetadata?.groundingChunks || [];
  const sources = chunks.map((c) => c?.web?.uri).filter(Boolean).slice(0, 5);
  return { text, sources };
}

/* ══════════════════════════════════════════════════════════════════════════
   여행코스 블로그 생성 (OpenAI 전용, 제미나이 미사용)
   - 정부 공식 코스(검증된 사실)를 "여행 블로거" 톤으로 리라이팅.
   - 사실(연도·인물·수치)은 경유지 자료에서만 → patternCheck로 환각 차단.
   - 감정·감각·이동 흐름은 허용(블로그 맛). 클리셰 미사여구는 계속 금지.
   ══════════════════════════════════════════════════════════════════════════ */

export const COURSE_THEME_LABEL = {
  바다피서: "바다·피서", 문화유적: "문화유적", 자연힐링: "자연·힐링",
  가족체험: "가족·체험", 맛집: "맛집·먹거리",
};

// 코스 램프: 하루 발행 수. 초기 카탈로그 구축기엔 10/일, 이후 남은 만큼 자연 감속.
export function rampCourses() {
  return 10;
}

/** 경유지+소개를 "확정 사실 근거"로 합침(환각 검사 기준) */
export function courseSourceFacts(course) {
  const parts = [];
  if (course.overview) parts.push(course.overview);
  for (const s of course.stops || []) parts.push(`${s.name}. ${s.overview || ""}`);
  return parts.join("\n");
}

// ── 원거리 배편 섬(다리 없음 / 편도 1시간+ 배) 좌표표 ──
//  이 섬들을 "육지 일정"과 같은 코스에 섞으면 하루·짧은 일정으로 도저히 불가능 → 발행 차단.
//  단, 코스 전체가 그 섬 안에서만 이뤄지면(섬 단독 여행)은 통과 → 섬 코스는 살린다.
//  ※ "독도"는 넣지 않음(원주 '독도체험관' 오탐 방지). 다리 섬(강화·거제·남해·안면·영흥·대부·선유·진도·완도)은 육지 취급.
export const REMOTE_ISLANDS = {
  연평도: [125.70, 37.66], 소연평도: [125.74, 37.61], 대연평도: [125.70, 37.66],
  백령도: [124.71, 37.96], 대청도: [124.70, 37.83], 소청도: [124.75, 37.75],
  덕적도: [126.13, 37.23], 굴업도: [125.99, 37.19], 문갑도: [126.10, 37.20], 백아도: [125.98, 37.14],
  자월도: [126.28, 37.26], 대이작도: [126.21, 37.24], 소이작도: [126.24, 37.25], 이작도: [126.21, 37.24], 승봉도: [126.28, 37.25], 울도: [125.99, 37.06],
  가거도: [125.11, 34.06], 흑산도: [125.43, 34.68], 홍도: [125.19, 34.68], 만재도: [125.27, 34.42], 우이도: [125.79, 34.62],
  거문도: [127.31, 34.03], 백도: [127.32, 34.05], 손죽도: [127.31, 34.30],
  외연도: [126.08, 36.24], 녹도: [126.13, 36.34], 어청도: [125.98, 36.11], 격렬비열도: [125.58, 36.61],
  추자도: [126.30, 33.95], 울릉도: [130.87, 37.50],
  욕지도: [128.26, 34.62], 청산도: [126.86, 34.17], 사량도: [128.22, 34.85], 한산도: [128.48, 34.78],
};
function _kmGeo(ax, ay, bx, by) {
  const R = Math.PI / 180, dLat = (by - ay) * R, dLon = (bx - ax) * R;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(ay * R) * Math.cos(by * R) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}
const _islandsIn = (name) => Object.entries(REMOTE_ISLANDS).filter(([isl]) => String(name || "").includes(isl));

/**
 * 코스 지리 실현성 검사(결정적·LLM 불필요). "원거리 배편 섬 + 육지 명소" 혼합 코스를 차단.
 *  - format:"list"(베스트 목록)·섬 없는 코스는 통과.
 *  - 육지 명소 = 원거리섬 이름이 아니면서, resolve()로 좌표가 잡히고, 코스 내 모든 섬에서 30km+ 떨어진 스팟.
 *  - 섬 안에서만 도는 코스(육지 명소 0개)는 통과 → 유명 섬 단독 코스는 살림.
 * @param resolve (name)=>{mapx,mapy}|null  경유지명 → 좌표(places.json 매칭)
 */
export function courseGeoFeasible(course, resolve) {
  if (!course || course.format === "list") return { ok: true, reason: "" };
  const stops = course.stops || [];
  const islandCoords = [];
  for (const s of stops) for (const [, c] of _islandsIn(s.name)) islandCoords.push(c);
  if (!islandCoords.length) return { ok: true, reason: "" }; // 원거리 섬 없음 → 통과
  const mainland = [];
  for (const s of stops) {
    if (_islandsIn(s.name).length) continue;               // 섬 스팟은 제외
    const p = resolve ? resolve(s.name) : null;
    if (!p) continue;
    const x = parseFloat(p.mapx), y = parseFloat(p.mapy);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (islandCoords.every(([ix, iy]) => _kmGeo(x, y, ix, iy) > 30)) mainland.push(s.name);
  }
  if (mainland.length) {
    const isl = [...new Set(stops.flatMap((s) => _islandsIn(s.name).map(([i]) => i)))];
    return { ok: false, reason: `원거리 배편 섬(${isl.join(",")})을 육지 일정(${mainland.slice(0, 2).join(",")}${mainland.length > 2 ? "…" : ""})과 혼합 — 하루에 실현 불가` };
  }
  return { ok: true, reason: "" };
}

// ── 코스용 품질검사: 블로그 길이·구조 + 클리셰 금지. 추측표현은 완화(여행글 자연스러움). ──
export function courseQualityCheck(text, { source = "", existingTexts = [] } = {}) {
  const body = String(text || "").trim();
  const len = stripMd(body).length;

  const vh = vagueHits(body);
  if (vh.length) return { ok: false, reason: `근거없는 미사여구(${vh.slice(0, 3).join(",")})`, len };

  if (len < 700) return { ok: false, reason: `길이 ${len}자(너무 짧음)`, len };
  if (len > 3800) return { ok: false, reason: `길이 ${len}자(너무 김)`, len };

  const headings = (body.match(/^##\s/gm) || []).length;
  if (headings < 3) return { ok: false, reason: `소제목 ${headings}개(<3)`, len };

  if (/[ㅋㅎ]{2,}|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(body))
    return { ok: false, reason: "이모티콘/채팅체", len };
  if (/많은 관심 바랍|강력 추천합니다|후회 없는 선택/.test(body))
    return { ok: false, reason: "광고성/상투구", len };

  // 원본(경유지 자료)과 과유사(복붙) 방지 — 여러 스팟을 엮어 풀어 쓰므로 여유 있게 0.62.
  if (source && similarity(body, source) > 0.62)
    return { ok: false, reason: "원본 자료와 과유사", len };
  for (const ex of existingTexts) {
    if (similarity(body, ex) > 0.6) return { ok: false, reason: "기존 코스글과 중복", len };
  }
  return { ok: true, reason: "", len };
}

// ── 경유지 일치 검사 — 자료에 없는 장소를 소제목으로 지어내거나(환각), 자료의 관광지를 빼먹은 글을 반려 ──
//  예: 경유지가 "강화성당·소창체험관·대룡시장"인데 본문 소제목에 "연평도"가 등장하는 사고 방지.
const COURSE_SECTION_HEADS = /^(한눈에|코스 한눈에|여행 팁|자주 묻는|마무리|확정정보|기본 정보|Q\.|\d+\s*일차)/;
const normPlace = (v) => String(v || "").replace(/\*\*/g, "").replace(/\(.*?\)|\[.*?\]/g, "").replace(/[\s·,'"“”‘’\-—~!?]/g, "");
export function courseStopsCheck(course, text) {
  if (course.format === "list") return { ok: true, reason: "" };
  const atts = courseAttractionStops(course);
  if (!atts.length) return { ok: true, reason: "" };
  const body = String(text || "");
  const names = atts.map((s) => normPlace(s.name)).filter(Boolean);

  const heads = (body.match(/^#{2,3}\s+.+$/gm) || [])
    .map((h) => h.replace(/^#+\s*/, "").replace(/^\d+\.\s*/, "").trim())
    .filter((h) => !COURSE_SECTION_HEADS.test(h));
  const hit = (n, m) => n && m && (n.includes(m) || m.includes(n));
  const orphan = heads.find((h) => { const n = normPlace(h); return n && !names.some((m) => hit(n, m)); });
  if (orphan) return { ok: false, reason: `자료에 없는 장소 소제목("${orphan}")` };

  const flat = normPlace(body);
  const missing = atts.find((s) => { const m = normPlace(s.name); return m && !flat.includes(m); });
  if (missing) return { ok: false, reason: `경유지 누락("${missing.name}")` };
  return { ok: true, reason: "" };
}

// ── 코스 구성 교차검증(Gemini) — 본문은 OpenAI, "코스 짜임새"는 Gemini가 점검 ──
//  같은 종류 중복(해수욕장→해수욕장), 비현실적 동선/일정, 기간 대비 과다 여부만 판정. 글은 안 봄.
export async function checkCourseComposition(course, { apiKey, model = "gemini-2.5-flash-lite" } = {}) {
  if (!apiKey) return { ok: true, reason: "SKIP(no key)" };
  // 실제로 글·페이지에 나가는 관광지(상한 적용분)만 검증 — 잘려나갈 스팟 때문에 "과다" NG가 나던 문제 방지.
  const list = selectCourseStops(course).map((s, i) => `${i + 1}. ${s.name}`).join("\n");
  const prompt = `여행 코스 "구성"이 현실적인지만 판정해라(글이 아니라 장소 조합·순서).
[지역] ${course.area}  [기간] ${course.duration}
[방문 순서]
${list}

[판정 기준 — NG면 무엇이 문제인지 reason]
- ★ 같은 종류 중복(예: 해수욕장 두 곳, 비슷한 시장 두 곳)이면 NG — 이게 핵심.
- 장소 수는 이미 상한(당일 ${COURSE_ATT_CAP["당일"]}곳 · 1박2일 ${COURSE_ATT_CAP["1박2일"]}곳 · 2박3일 ${COURSE_ATT_CAP["2박3일"]}곳 = 하루 최대 ${COURSE_MAX_PER_DAY}곳)을 적용한 목록이니 **개수로는 NG 주지 마세요.**
- 동선이 완전히 뒤엉켜 하루에 도저히 불가능하면 NG.
- 위 문제(특히 종류 중복) 없으면 OK.

JSON만: {"result":"OK 또는 NG","reason":"이유"}`;
  try {
    const { text } = await callGemini(prompt, { apiKey, model });
    const m = String(text || "").match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m ? m[0] : text);
    return { ok: parsed.result !== "NG", reason: String(parsed.reason || "") };
  } catch (e) {
    return { ok: true, reason: "ERROR(무시): " + (e instanceof Error ? e.message : e) }; // 검증 오류 시 통과(글 생성은 진행)
  }
}

// ── 리스트형 프롬프트 (예: "강원 해수욕장 베스트 10") — 코스(동선)가 아니라 순위 소개형 ──
export function buildListPrompt(course) {
  const items = (course.stops || [])
    .map((s, i) => {
      const facts = [];
      if (s.addr) facts.push(`주소=${s.addr}`);
      return `${i + 1}. ${s.name}\n   - 자료: ${s.overview || "(상세 없음 — 이름·위치만 사실)"}${facts.length ? `\n   - ${facts.join(" / ")}` : ""}`;
    })
    .join("\n");
  const n = (course.stops || []).length;
  return `당신은 국내 여행지를 자세히 소개하는 여행 전문 에디터입니다.
"${course.area}"에서 가볼 만한 **해수욕장을 추천하는 베스트 리스트 글**을 씁니다.
※ 이건 "전부 순서대로 도는 코스"가 아니라, **마음에 드는 곳을 골라 가는 추천 목록**입니다. "1번 다음 2번으로 이동" 같은 동선 표현 쓰지 마세요.

[지역] ${course.area}
[해수욕장 목록 — 각 '자료'·'주소'의 사실만 사용]
${items}

[✍️ 글 톤]
- 정보 전달형 안내체("~입니다/~로 유명합니다/~에 좋습니다"). 1인칭 경험담("가봤어요") 금지.
- 각 해수욕장이 **어떤 곳인지·무엇으로 유명한지·어떤 사람에게 좋은지** 자료 기반으로 소개.

[🚫 맛집·먹거리 언급 절대 금지]
- 이 글은 해수욕장만 다룹니다. **맛집·먹거리·식당·"근처 맛집 확인" 같은 문장은 한 줄도 쓰지 마세요.**

[구조]
- 1번째 줄: "# ${course.area} 해수욕장 베스트 ${n} — {대표 2~3곳}" (검색어: "${course.area} 해수욕장", "${course.area} 바다")
- 2번째 줄: 이 지역 바다의 매력을 요약한 한 문장 **굵게**.
- 도입 2~3문장: ${course.area} 해수욕장 여행의 매력·가기 좋은 시기.
- 해수욕장마다 "## 1. ○○해수욕장" 소제목 + 4~6문장: 모래·수심·바다 분위기, 물놀이·일출/일몰·산책 등 즐길 거리, 누구에게 좋은지.
  - 각 항목 **끝에 반드시 "- **주소**: (자료의 주소)" 한 줄**을 넣으세요(주소 자료 있을 때).
- 마지막 "## 여행 팁": 성수기·주차·안전(이안류 등)·물놀이 준비물 등 실용 정보.

[읽기 편하게] 문단 2~3문장·빈 줄, 핵심 **굵게**, 어미 다양화. 지루하지 않게.
[사실] 해수욕장의 **일반적으로 알려진 특징**(고운 모래, 얕은 수심, 일출 명소, 서핑 스팟 등)은 서술 OK. **구체 수치(길이·개장연도)·인물·상호는 자료에 없으면 금지.** 이름·주소는 자료 그대로.
[금지] "잊지 못할 추억을 선사" 류 클리셰, 이모티콘, 광고 문구, **맛집 언급**.

마크다운만 출력(설명 없이). 1번째 줄은 반드시 "# ${course.area} 해수욕장 베스트 ${n} — …".`;
}

// ── 코스 블로그 프롬프트 ──
// 정보 전달형(여행사가 자세히 안내). 경험담(1인칭 과거) 금지. 각 스팟에 주소·요금·시간 있으면 포함.
// 식당 스팟은 동선(관광 소제목)에서 빼고 "식사 장소"로만 안내 — 상세는 페이지 '근처 맛집'에서.
// 글에 소제목으로 쓸 관광지 = lib/courses.ts의 courseAttractions와 **같은 모듈**(lib/courseSelect.js).
export const courseAttractionStops = selectCourseStops;

export function buildCoursePrompt(course, { summer = false } = {}) {
  const themeLabels = (course.themes || []).map((t) => COURSE_THEME_LABEL[t] || t).join("·");
  const mainTheme = COURSE_THEME_LABEL[(course.themes || [])[0]] || "여행"; // 제목에 넣을 대표 테마
  const isFood = isCourseFoodStop;
  const attractions = courseAttractionStops(course);
  const foods = (course.stops || []).filter(isFood);
  const nStops = attractions.length;
  const days = COURSE_DAY_COUNT[course.duration] || 1;
  // 일차 배분은 "코드가" 확정해 프롬프트에 그대로 못박는다(하루 최대 3곳).
  //  예전엔 "하루 3~4곳"이라고만 일러줘 모델이 마음대로 몰아넣었다 → 페이지 동선과 어긋남.
  const dayPlan = splitCourseDays(attractions, course.duration);
  const dayPlanText = dayPlan
    .map((d, i) => `  · ${i + 1}일차(${d.length}곳): ${d.map((s) => s.name).join(" → ")}`)
    .join("\n");
  const structureSpec = days > 1
    ? `- 반드시 **일차별로 나눠** 쓰세요: "## 1일차", "## 2일차"${days === 3 ? ', "## 3일차"' : ""} 소제목으로.
- ★ 일차별 장소 배치는 **아래 [일차 배분]을 그대로** 따르세요. 옮기거나 합치지 말 것(하루 최대 ${COURSE_MAX_PER_DAY}곳).
- 각 일차는 오전 관광 → 점심 → 오후 관광 → (선택) 저녁/야경 흐름으로.
- 각 방문 장소는 일차 아래 "### 장소명" 소제목으로 쓰고, 그 아래 설명 + (확정정보).`
    : `- 방문 장소마다 "## 1. 장소명" 소제목 + 설명 + (확정정보). 당일치기라 **${nStops}곳뿐**이니 한 곳씩 깊이 있게.
- ★ 하루 최대 ${COURSE_MAX_PER_DAY}곳입니다. 위 목록에 없는 장소를 더 넣지 마세요.`;
  // 스팟이 적을수록 한 곳을 더 깊게 → 글이 부실해지지 않게 분량 배분(상한 축소로 대부분 3~6곳)
  const perStopGuide = nStops <= 3
    ? "경유지가 적으니 각 장소를 7~9문장으로 깊이 있게(어떤 곳인지·역사/유래·대표 볼거리·즐기는 법·소요시간·주변 팁) 아주 자세히 소개하세요."
    : nStops <= 5
      ? "각 장소를 6~8문장으로 충실히(어떤 곳인지·볼거리·즐기는 법·소요시간·팁) 설명하세요."
      : "각 장소를 5~6문장으로 충실히 설명하세요.";
  const stopsBlock = attractions
    .map((s, i) => {
      const facts = [];
      if (s.addr) facts.push(`주소=${s.addr}`);
      if (s.fee) facts.push(`이용요금=${s.fee}`);
      if (s.usetime) facts.push(`운영시간=${s.usetime}`);
      const factStr = facts.length ? `\n   - 확정정보: ${facts.join(" / ")}` : "";
      return `${i + 1}. ${s.name}\n   - 자료: ${s.overview || "(상세 없음 — 이름만 사실. 위치·유형 중심으로만)"}${factStr}`;
    })
    .join("\n");
  // 식당은 동선 소제목으로 넣지 말고, 식사 흐름에서만 언급(상세는 페이지 하단 '근처 맛집')
  const foodsNote = foods.length
    ? `\n[식사 장소 — 별도 소제목 만들지 말 것. 점심/저녁 흐름에서 이름만 짧게 언급하고 "자세한 정보는 아래 '근처 맛집' 참고"로]\n${foods.map((s) => `- ${s.name}`).join("\n")}`
    : "";

  return `당신은 국내 여행지를 자세히 소개하는 여행 전문 에디터입니다.
아래 "코스 자료"만을 근거로, 독자가 실제로 이 코스를 따라 여행할 수 있게 **정보를 자세히 안내하는** 글을 씁니다.
여행사가 상품을 꼼꼼히 소개하듯, 각 장소가 어떤 곳인지·무엇을 볼 수 있는지·어떻게 가는지 친절하고 풍부하게 설명하세요.

[지역] ${course.area}
[기간] ${course.duration}
[테마] ${themeLabels}
${course.overview ? `[코스 소개 자료] ${course.overview}\n` : ""}
[관광 경유지 — 이 순서대로. 소제목(##/###)은 이 관광지들로만 만드세요. 총 ${nStops}곳이 전부입니다]
${stopsBlock}
${days > 1 ? `\n[일차 배분 — 이대로 배치. 하루 최대 ${COURSE_MAX_PER_DAY}곳]\n${dayPlanText}\n` : ""}${foodsNote}

[✍️ 글 톤 — 정보 전달형 (가장 중요)]
- ★ "다녀왔어요 / 맛봤어요 / 느껴봤어요 / 걸어봤어요" 같은 **1인칭 경험담 금지.** 나는 안 가봤습니다.
- 대신 **설명·안내체**로: "~입니다 / ~예요 / ~할 수 있어요 / ~로 유명합니다 / ~를 추천합니다."
- 독자에게 알려주는 관점: "이곳은 ○○로 유명한 곳으로, △△를 볼 수 있습니다. 근처에는 □□가 있어 함께 둘러보기 좋습니다."
- 여행사·여행 매거진이 소개하듯 **자세하고 풍부하게.** 각 장소를 충분히 설명하세요.

[📋 각 경유지에 꼭 담을 것]
- 그곳이 어떤 곳인지 + 무엇으로 유명/특별한지(자료 사실)
- 볼거리·즐길거리를 구체적으로 (자료에 있는 시설·특징을 풀어서)
- '확정정보'가 있으면 문단 끝에 목록으로 정리:
  - **주소**: (확정정보에 있으면)
  - **이용요금**: (있으면. 없으면 이 줄 빼기)
  - **운영시간**: (있으면)
- 다음 장소로의 이동을 한 문장으로 자연스럽게 연결.
- 각 장소는 보통 **1~2시간 머무는 것**을 기준으로, 하루에 무리 없는 현실적인 일정으로 안내하세요.
${summer ? "- 지금은 여름 휴가철이라, 더위를 피할 포인트(그늘·물가·바다·계곡·실내)가 있으면 짚어줍니다.\n" : ""}
[🍴 식사·먹거리 — 자연스러운 흐름으로]
- 오전 관광 뒤 점심, 오후 관광처럼 **식사 타이밍을 동선에 녹이세요.** "오전에 ○○를 둘러본 뒤, 근처에서 점심을 먹고 다음 장소로 이동하기 좋습니다." 식으로.
- '[식사 장소]'로 표시된 경유지가 있으면 그 이름으로 식사 흐름을 안내하세요.
- 이 지역의 **대표 먹거리(명물 음식)를 일반 상식 선에서** 추천하세요. 예: "${course.area}에 오셨다면 지역 명물 ○○를 맛보는 것도 좋습니다." (특정 식당 이름은 지어내지 말 것 — 실제 맛집은 글 아래 '근처 맛집'에서 안내됨.)
- 식사 후 다음 장소로 이동하는 문장으로 자연스럽게 이어가세요.

[🌙 알찬 하루 — 선택]
- 하루를 알차게 보내도록 오전·점심·오후 흐름을 촘촘히 안내하세요.
- 경유지 중 야경·야시장·저녁 산책이 어울리는 곳이 있으면 "저녁에는 ~에서 야경을 보며 하루를 마무리하기 좋습니다"처럼 **밤 일정을 선택적으로** 제안하세요. 어울리는 곳이 없으면 억지로 넣지 말 것.

[⚠️ 사실 정확성]
- 자료·확정정보에 **없는** 연도·인물·수치·사건을 **절대 지어내지 마세요.**
- 자료에 없으면 일반적으로만("오래된", "이름난"). 경유지 이름·주소·요금은 자료 그대로.

[🚫 금지 표현]
- "잊지 못할 추억을 선사", "특별한 시간을 선사", "힐링을 선사", "다채로운 볼거리", "오감 만족", "강력 추천"

[구조]
- **1번째 줄**: 반드시 "# " 로 시작하는 **SEO 제목**. 아래 형식(지역+기간+**테마**+대표장소):
  \`# ${course.area} ${course.duration} ${mainTheme} 여행코스 — {대표 장소 2~3곳}\`
  (예: "# 강원 1박2일 문화유적 여행코스 — 한탄강·백담사·두타연", "# 전남 당일 바다 여행코스 — 향일암·여수 밤바다")
  ※ 제목만 봐도 "어떤 테마의 여행인지" 이해되게 테마를 꼭 넣기. 검색어(지역+기간+여행코스) 포함. 시적·추상 제목 금지.
- 2번째 줄: 이 코스의 핵심을 요약한 한 문장 **굵게**.
- 도입 2~3문장: **이 코스를 왜 이렇게 묶었는지(의미)**를 먼저 설명하며 시작 — "${mainTheme}"을(를) 중심으로 어떤 곳들을 어떤 순서로 도는 여행인지, 누구에게 좋은지. (${course.area} 여행 / ${course.area} ${course.duration} 코스 키워드 자연스럽게)
- 도입 바로 뒤 "## 한눈에 보는 코스": 방문 순서를 **번호 목록**으로 한 줄씩(장소명 + 한 줄 특징).${days > 1 ? " 일차 구분이 보이게(1일차/2일차" + (days === 3 ? "/3일차" : "") + ")." : ""} 검색결과 미리보기·가독성에 좋습니다.
${structureSpec}
- ${perStopGuide}
- "## 여행 팁": 이동수단·소요시간·주차·입장료 요약·계절 팁 등 **실용 정보**를 구체적으로.
- "## 자주 묻는 질문": 이 코스 관련 **Q&A 2~3개**를 "### Q. …" / 답변 형식으로. 질문은 실제 검색하는 것들(예: "${course.area} ${course.duration} 코스 어디가 좋나요?", "아이와 함께 가기 좋나요?", "입장료가 있나요?")로. ★답변은 반드시 위 자료·확정정보 범위 안에서만(모르면 "현장/공식 홈페이지 확인"으로). 지어내지 말 것.
- 마지막 "## 마무리": 코스를 한 문단으로 정리하고 누구에게 좋은지 덧붙이기(${course.area} 가볼만한곳·${course.area} ${course.duration} 여행코스 키워드 자연스럽게).
- 전체 **1800~2900자**로 풍부하고 정보 밀도 높게. 정보가 많을수록 좋습니다(단, 지어내지 말 것).
- 이모티콘·"ㅋㅋ/ㅎㅎ" 금지. 광고 문구 금지.

[📖 읽기 편하게 — 지루하지 않게]
- **한 문단은 2~3문장으로 짧게**, 문단 사이는 빈 줄로 띄우세요. 벽처럼 빽빽하게 쓰지 말 것.
- **핵심은 굵게 강조**: 장소의 대표 특징·꼭 볼 것·꿀팁·지역명을 문단마다 1~2개 **굵게**.
- 문장 길이를 다양하게(짧은 문장 섞기), 같은 어미("~습니다"만) 반복 피하기. 읽는 재미가 있게.

[🔍 SEO·키워드 최적화 — 구글·네이버]
- 소제목과 본문에 **경유지 이름을 정확히** 써서 "장소명" 키워드가 잡히게.
- "${course.area} 여행", "${course.area} ${course.duration} 코스", "${course.area} ${mainTheme}", "${course.area} 가볼만한곳", "${course.area} 여행코스 추천" 같은 검색어를 도입·본문·마무리에 **자연스럽게** 녹이기(억지 반복·키워드 나열 금지).
- 각 장소 문단 첫 문장에 그 장소가 "어디에 있는 무엇"인지 넣어 지역+장소 조합 키워드가 잡히게.
- (네이버) **구체적 정보**(주소·운영시간·입장료·소요시간·이동수단)를 실제 수치로 촘촘히 — 정보 밀도가 높을수록 유리.
- (구글) 소제목(##/###)으로 구조를 명확히 하고, "한눈에 보는 코스"·"자주 묻는 질문" 같은 **정리형 섹션**으로 발췌(스니펫)에 잘 잡히게.
- 같은 문장·표현을 반복하지 말고 자연스러운 한국어로. 실제 사람이 찾는 질문에 답하듯 쓰세요.

이제 위 형식대로 마크다운만 출력하세요(설명 없이 글만). 1번째 줄은 반드시 "# ${course.area} ${course.duration} ${mainTheme} 여행코스 — …" 제목입니다.`;
}
