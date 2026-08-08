// 글 자동화 코어 — 프롬프트/Gemini호출/품질검사/우선순위 큐/램프업
// 사이트와 분리된 Node 전용 모듈. 사이트는 data/place-articles.json을 읽기만 함.

// ── 지역 우선순위 (서울/경기/부산 우선, 여러 지역 섞기용) ──
export const REGION_PRIORITY = {
  서울: 10, 경기: 9, 부산: 8,
  인천: 6, 대구: 6, 대전: 6, 광주: 6, 울산: 6, 제주: 6, 강원: 6,
  충남: 4, 충북: 4, 경남: 4, 경북: 4, 전남: 4, 전북: 4,
  세종: 2,
};

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
  if (day <= 30) return 10;
  if (day <= 90) return 20;
  return 30;
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
export function qualityCheck(text, { overview = "", existingTexts = [], minimalMode = false } = {}) {
  const body = String(text || "").trim();
  const len = stripMd(body).length;

  // 3단계: 근거 없는 미사여구·추측성 문장 반려
  const vh = vagueHits(body);
  if (vh.length) return { ok: false, reason: `근거없는 미사여구(${vh.slice(0, 3).join(",")})`, len };
  const spec = speculativeHits(body);
  const sr = speculativeRatio(body);
  if (spec.length >= 2 || sr > 0.25)
    return { ok: false, reason: `추측성 문장 ${spec.length}개(${(sr * 100).toFixed(0)}%)`, len };

  // 원본 풍부 700~900, 빈약/안전버전 300~500 허용(짧은 게 틀린 것보다 나음). 하한 300.
  // 최소가공(minimalMode)은 근거 없는 문장이 잘려 짧아질 수 있어 하한을 280으로 완화.
  const minLen = minimalMode ? 280 : 300;
  if (len < minLen) return { ok: false, reason: `길이 ${len}자(너무 짧음)`, len };
  if (len > 1100) return { ok: false, reason: `길이 ${len}자(너무 김)`, len };

  const headings = (body.match(/^##\s/gm) || []).length;
  if (headings < 3) return { ok: false, reason: `소제목 ${headings}개(<3)`, len };
  if (!/방문\s*팁/.test(body)) return { ok: false, reason: "방문 팁 없음", len };
  if (!/^\s*[-*]\s+\S/m.test(body)) return { ok: false, reason: "목록 없음", len };

  if (/[ㅋㅎ]{2,}|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(body))
    return { ok: false, reason: "이모티콘/채팅체", len };
  if (/즐거운 시간 되세요|많은 관심 바랍|강력 추천/.test(body))
    return { ok: false, reason: "광고성/상투구", len };

  // 최소가공 폴백은 원본을 충실히 재구성하는 "안전 바닥"이라 원본 유사도 검사에서 제외한다.
  // (글이 없으면 상세페이지는 어차피 원본 overview를 그대로 노출 → 재구성본이 UX·SEO상 열위가 아님)
  if (!minimalMode && overview && similarity(body, overview) > 0.5)
    return { ok: false, reason: "원본 overview와 과유사", len };
  for (const ex of existingTexts) {
    if (similarity(body, ex) > 0.6) return { ok: false, reason: "기존 발행글과 중복", len };
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
- ★ 분량은 700~900자를 지향한다. 원본 근거가 충분하면 문장을 줄이지 말고, 오히려 근거 안에서 풀어 써 채운다.
- 개선: 어색한 문장 자연스럽게 / SEO 키워드(지역명+장소유형) 문맥에 맞게 보강 / 소제목(##)·문단 구조 정리 / 뻔한 미사여구("특별한 시간을 선사" 등)를 원본 근거의 구체적 표현으로.
- 형식 유지: 첫 줄 굵은 한 문장 + ## 어떤 곳인가요 / ## 볼거리·즐길거리 / (## 아이·가족과 함께라면) / ## 방문 팁(목록). 친근한 ~해요체.

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

// ── 프롬프트 생성 ──
export function buildPrompt(place, overview = "", extras = {}) {
  const type = tourTypeLabel(place.type);
  const facts = buildFactsBlock(extras);
  // 직전 시도 반려 사유를 되먹여 같은 실수를 반복하지 않게 한다(재시도가 시도1의 복제가 되던 문제 해소).
  const retry = extras.retryHint
    ? `\n[❗ 직전 시도가 반려됐어요 — 아래를 반드시 교정하세요]\n${extras.retryHint}\n`
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
${facts ? `\n${facts}\n` : ""}${retry}
[🚫 금지 표현 — 하나도 쓰지 말 것 (근거 없는 미사여구·추측)]
- "유명한", "인기 있는", "맛있기로 소문난", "현지인 맛집", "다채로운 경험/볼거리", "즐거움을 선사", "특별한 시간을 선사"
- "~할 수 있습니다", "열릴 경우", "운영될 경우", "~것입니다", "제공할 수 있는", "만날 수 있습니다" 같은 추측·불확실 표현
- 근거에 없으면 그 항목 자체를 쓰지 말 것(빈 말로 채우지 말 것). 확실한 사실만.

[⚠️ 사실 정확성 — 가장 중요]
- 사실 근거에 **없는** 인물 이름·건립 연도·역사적 사건·건립 배경을 **절대 지어내지 마세요.** (틀린 정보는 최악입니다.)
- 확실하지 않은 것은 구체적으로 단정하지 말고 일반적으로 서술하세요. (예: 연도를 모르면 "오랜 역사를 지닌"으로만.)
- 주소·위치·시설명·요금 등은 사실 근거에 있는 그대로만 쓰세요.
- 문장은 새로 쓰되(그대로 베끼지 말 것), 담긴 사실은 근거를 벗어나지 마세요.

[분량 — 거짓 없이 채우기]
- 원본이 풍부하면 700~900자(공백 제외, 900자 넘기지 말 것). 원본이 빈약하면 300~500자도 좋습니다.
- ★ 분량 채우려고 없는 내용 지어내기 절대 금지. **짧은 게 틀린 것보다 낫습니다.**
- 분량은 "내용 없는 인사말·채우기 문장"이 아니라, **근거에 있는 사실을 여러 문장으로 풀어서** 채웁니다.
  예: "자연관찰로 있음" → "자연관찰로를 따라 걸으면 다양한 식물과 새를 볼 수 있어, 아이와 자연 학습 나들이로도 좋아요."
- 소제목별: 어떤 곳인가요 3문장+, 볼거리·즐길거리는 근거의 시설·명소를 풀어서, 아이·가족 3문장+(해당 시), 방문 팁 목록 4개.

[구조·서식]
- 맨 위 첫 줄: 그 장소 특징을 담은 매력적인 한 문장을 **굵게**(뻔한 인사 금지, 장소마다 다르게).
- 소제목 4개(순서: ## 어떤 곳인가요, ## 볼거리·즐길거리, ## 아이·가족과 함께라면, ## 방문 팁).
- 문단 2~4문장, 사이 빈 줄. 한 덩어리 금지.
- ## 방문 팁은 목록(-), 라벨 굵게: 위 [운영 정보]에 **값이 있는 항목만** 넣으세요(예: **이용시간**, **휴무일**, **주차**, **이용요금**). 값이 없는 항목은 줄째 빼고, "정보 없음"을 여러 줄 반복하지 마세요. 운영 정보가 하나도 없으면 방문 팁 목록에 **추천 시기** 한 줄 정도만.
- **굵게**는 핵심 키워드만(명소명·지역명·입장료·계절), 문단당 2~3개.

[SEO]
- 첫 문단에 "지역+유형+장소명"을 자연스럽게(예: "${place.area}에 자리한 ${type}, ${place.title}").
- "${place.area} 나들이" 같은 검색어를 문맥에 맞게만. 억지 삽입 금지.

[톤]
- 쉬운 말, 한 문장에 한 정보. 친근한 안내체("~해요","~추천해요").
- 이모티콘·"ㅋㅋ/ㅎㅎ"·채팅체·과장 광고·공문서 톤 금지.

아래는 톤·형식 예시입니다. 형식만 따르고 내용은 이 장소의 사실 근거로만 새로 쓰세요.
${EXAMPLES}

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

// ── 코스 블로그 프롬프트 ──
// 정보 전달형(여행사가 자세히 안내). 경험담(1인칭 과거) 금지. 각 스팟에 주소·요금·시간 있으면 포함.
export function buildCoursePrompt(course, { summer = false } = {}) {
  const themeLabels = (course.themes || []).map((t) => COURSE_THEME_LABEL[t] || t).join("·");
  const nStops = (course.stops || []).length;
  // 스팟이 적을수록 한 곳을 더 깊게 → 글이 부실해지지 않게 분량 배분
  const perStopGuide = nStops <= 4
    ? "경유지가 적으니 각 장소를 6~8문장으로 깊이 있게(역사·특징·볼거리·즐기는 법·주변 팁) 자세히 소개하세요."
    : nStops <= 6
      ? "각 장소를 4~6문장으로 충실히 설명하세요."
      : "각 장소를 3~4문장으로 핵심 위주로 설명하세요.";
  const stopsBlock = (course.stops || [])
    .map((s, i) => {
      const facts = [];
      if (s.addr) facts.push(`주소=${s.addr}`);
      if (s.fee) facts.push(`이용요금=${s.fee}`);
      if (s.usetime) facts.push(`운영시간=${s.usetime}`);
      const factStr = facts.length ? `\n   - 확정정보: ${facts.join(" / ")}` : "";
      const tag = s.food ? " [식사 장소]" : "";
      return `${i + 1}. ${s.name}${tag}\n   - 자료: ${s.overview || "(상세 없음 — 이름만 사실. 위치·유형 중심으로만)"}${factStr}`;
    })
    .join("\n");

  return `당신은 국내 여행지를 자세히 소개하는 여행 전문 에디터입니다.
아래 "코스 자료"만을 근거로, 독자가 실제로 이 코스를 따라 여행할 수 있게 **정보를 자세히 안내하는** 글을 씁니다.
여행사가 상품을 꼼꼼히 소개하듯, 각 장소가 어떤 곳인지·무엇을 볼 수 있는지·어떻게 가는지 친절하고 풍부하게 설명하세요.

[지역] ${course.area}
[기간] ${course.duration}
[테마] ${themeLabels}
${course.overview ? `[코스 소개 자료] ${course.overview}\n` : ""}
[경유지 — 이 순서대로, 각 스팟의 '자료'와 '확정정보'에 있는 사실만 사용]
${stopsBlock}

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
- **1번째 줄**: 반드시 "# " 로 시작하는 **SEO 제목**. 아래 형식을 지키세요:
  \`# ${course.area} ${course.duration} 여행코스 — {대표 장소 1~2곳 또는 핵심 특징}\`
  (예: "# 강원 1박2일 여행코스 — 천곡동굴·추암 해변 바다 여행", "# ${course.area} 당일 여행코스 — {대표장소}")
  ※ 사람들이 실제로 검색하는 말(지역명 + 기간 + 여행코스)을 꼭 포함. 시적·추상적 제목 금지.
- 2번째 줄: 이 코스의 핵심을 요약한 한 문장 **굵게**.
- 도입 2~3문장: 이 코스가 어떤 여행인지, 누구에게 좋은지 (${course.area} 여행 / ${course.area} ${course.duration} 코스 키워드 자연스럽게).
- 경유지마다 "## 1. ○○" 소제목 + 설명 + (확정정보 목록). ${perStopGuide}
- 마지막 "## 여행 팁": 이동수단·소요시간·계절 팁 등 실용 정보.
- 전체 **1400~2600자**로 풍부하게. 정보가 많을수록 좋습니다(단, 지어내지 말 것).
- 이모티콘·"ㅋㅋ/ㅎㅎ" 금지. 광고 문구 금지.

이제 위 형식대로 마크다운만 출력하세요(설명 없이 글만). 1번째 줄은 반드시 "# ${course.area} ${course.duration} 여행코스 — …" 제목입니다.`;
}
