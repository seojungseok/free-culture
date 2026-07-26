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

// ── 자동 품질검사 (통과분만 발행) ──
export function qualityCheck(text, { overview = "", existingTexts = [] } = {}) {
  const body = String(text || "").trim();
  const len = stripMd(body).length;

  // 700~900 목표. 정보 빈약한 소규모 장소는 500~700 허용(지어내기 방지). 하한 500.
  if (len < 500) return { ok: false, reason: `길이 ${len}자(너무 짧음)`, len };
  if (len > 1100) return { ok: false, reason: `길이 ${len}자(너무 김)`, len };

  const headings = (body.match(/^##\s/gm) || []).length;
  if (headings < 3) return { ok: false, reason: `소제목 ${headings}개(<3)`, len };
  if (!/방문\s*팁/.test(body)) return { ok: false, reason: "방문 팁 없음", len };
  if (!/^\s*[-*]\s+\S/m.test(body)) return { ok: false, reason: "목록 없음", len };

  if (/[ㅋㅎ]{2,}|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(body))
    return { ok: false, reason: "이모티콘/채팅체", len };
  if (/즐거운 시간 되세요|많은 관심 바랍|강력 추천/.test(body))
    return { ok: false, reason: "광고성/상투구", len };

  if (overview && similarity(body, overview) > 0.5)
    return { ok: false, reason: "원본 overview와 과유사", len };
  for (const ex of existingTexts) {
    if (similarity(body, ex) > 0.6) return { ok: false, reason: "기존 발행글과 중복", len };
  }
  return { ok: true, reason: "", len };
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

// ── 프롬프트 생성 ──
export function buildPrompt(place, overview = "") {
  const type = tourTypeLabel(place.type);
  const ref = overview
    ? `참고 자료(사실 출처, 그대로 베끼지 말 것):\n"""${overview}"""`
    : `참고 자료가 부족합니다. 웹 검색으로 확인된 사실만 사용하고, 불확실하면 "방문 전 공식 홈페이지 확인 권장"으로 처리하세요.`;

  return `당신은 실제로 그곳에 다녀온 뒤 친구에게 알려주는 한국어 나들이 에디터입니다.
아래 장소를 소개하는 글을 씁니다. 원본은 "재료"일 뿐이니 그대로 베끼지 말고, 부족하면 웹 검색으로 실제 명소·볼거리·요금·시간을 더 조사해 살을 붙여 완전히 새로 쓰세요.

[장소] ${place.title}
[지역] ${place.area}
[유형] ${type}
[주소] ${place.addr}

${ref}

[분량 — 가장 중요]
- 전체 700~900자(공백 제외). 700자 미만은 안 됩니다. 짧으면 실제 볼거리를 더 조사해 구체적으로 채우세요.
- 단, 정보가 정말 빈약한 아주 작은 장소는 500~700자 허용. 없는 내용을 지어내지는 마세요.
- 소제목별 최소 분량:
  · ## 어떤 곳인가요 — 3문장 이상 (위치·성격·역사나 유래)
  · ## 볼거리·즐길거리 — 4문장 이상, 실제 명소·시설 고유명사 3개 이상 명시
  · ## 아이·가족과 함께라면 — 3문장 이상
  · ## 방문 팁 — 목록 4개

[구조·서식]
- 맨 위 첫 줄: 그 장소만의 매력적인 한 문장을 **굵게**. 장소마다 다르게.
- 소제목 4개(위 순서, ## 사용).
- 문단은 2~4문장, 사이에 빈 줄. 한 덩어리 금지.
- ## 방문 팁은 목록(-), 라벨을 굵게: **입장료**, **관람 시간**, **주차**, **추천 시기**.
- **굵게**는 핵심 키워드만(명소명·지역명·입장료·계절), 한 문단에 2~3개까지.

[SEO — 검색 노출]
- 첫 문단 첫 문장에 "지역 + 장소유형 + 장소명"을 자연스럽게. 예: "${place.area}에 자리한 ${type}, ${place.title}은…".
- 사람들이 검색할 만한 표현을 문맥에 맞게 녹이기(예: "${place.area} 아이와 갈만한 곳", "${place.area} 나들이"). 억지로 끼워넣지 마세요.
- 실제 명소 고유명사를 넣어 구체적으로.

[톤]
- 쉬운 말로, 한 문장에 한 가지 정보. 전문용어는 풀어서.
- 친근한 안내체("~해요", "~추천해요"). 이모티콘·"ㅋㅋ/ㅎㅎ"·채팅체·과장 광고문구·공문서 톤 금지.
- 요금·시간 등 확실치 않으면 "방문 전 공식 홈페이지 확인 권장".

아래는 톤·형식·분량 감을 잡는 예시입니다. 형식만 따르고 내용은 이 장소에 맞게 새로 쓰세요.
${EXAMPLES}

이제 "${place.title}" 소개 글을 700~900자 마크다운으로만 출력하세요. 다른 설명 없이 글만.`;
}

// ── Gemini 2.5 Flash-Lite 호출 ──
export async function callGemini(prompt, { apiKey, model = "gemini-2.5-flash-lite", grounding = false } = {}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }]}],
    generationConfig: { temperature: 0.9, maxOutputTokens: 2048, topP: 0.95 },
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
