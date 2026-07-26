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

[⚠️ 사실 정확성 — 가장 중요]
- 사실 근거에 **없는** 인물 이름·건립 연도·역사적 사건·건립 배경을 **절대 지어내지 마세요.** (틀린 정보는 최악입니다.)
- 확실하지 않은 것은 구체적으로 단정하지 말고 일반적으로 서술하세요. (예: 연도를 모르면 "오랜 역사를 지닌"으로만.)
- 주소·위치·시설명·요금 등은 사실 근거에 있는 그대로만 쓰세요.
- 문장은 새로 쓰되(그대로 베끼지 말 것), 담긴 사실은 근거를 벗어나지 마세요.

[분량 — 거짓 없이 채우기]
- 목표 700~900자(공백 제외). 900자를 넘기지 마세요.
- 분량은 "내용 없는 인사말·채우기 문장"이 아니라, **근거에 있는 사실을 여러 문장으로 풀어서** 채웁니다.
  예: "자연관찰로 있음" → "자연관찰로를 따라 걸으면 다양한 식물과 새를 볼 수 있어, 아이와 자연 학습 나들이로도 좋아요."
- 근거가 빈약해 700자가 안 되면 **짧아도 괜찮습니다(500~700자).** 억지로 채우거나 지어내지 마세요.
- 소제목별: 어떤 곳인가요 3문장+, 볼거리·즐길거리는 근거의 시설·명소를 풀어서, 아이·가족 3문장+(해당 시), 방문 팁 목록 4개.

[구조·서식]
- 맨 위 첫 줄: 그 장소 특징을 담은 매력적인 한 문장을 **굵게**(뻔한 인사 금지, 장소마다 다르게).
- 소제목 4개(순서: ## 어떤 곳인가요, ## 볼거리·즐길거리, ## 아이·가족과 함께라면, ## 방문 팁).
- 문단 2~4문장, 사이 빈 줄. 한 덩어리 금지.
- ## 방문 팁은 목록(-), 라벨 굵게: **입장료**, **관람 시간**, **주차**, **추천 시기**. (근거에 값이 없으면 "정보 없음 — 방문 전 공식 홈페이지 확인 권장".)
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

// ── Gemini 2.5 Flash-Lite 호출 ──
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
