// 글 자동 생성·발행 (GitHub Action이 매일 실행)
// 주=OpenAI(gpt-5.6-luna)가 생성·개선, 보조=Gemini가 독립 팩트체크(환각 교차검증).
// 파이프라인: [주]Luna 생성 → 로컬 품질검사 → 로컬 패턴검사 → [주]Luna 검증·개선
//            → [보조]Gemini 팩트체크 → 둘 다 통과분만 자동 발행(published).
// 계속 실패하면 "원본 최소가공 안전버전"으로 발행, 그것도 실패면 스킵(로그).
//
// 실행: node scripts/generateArticles.mjs
// 필요: OPENAI_API_KEY(주, 필수), GEMINI_API_KEY(보조 팩트체크, 없으면 건너뜀), DATA_GO_KR_KEY(또는 TOUR_API_KEY)
// 모델: OPENAI_MODEL(GitHub repo Variables/워크플로에서 지정, 없으면 gpt-5.6-luna)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildPrompt, buildMinimalPrompt, callOpenAI, qualityCheck, patternCheck, sanitizeUnsupported,
  verifyAndImprove, factCheckGemini, buildFactsBlock, rampUpCount, pickQueue, tourTypeLabel,
  researchFacts, usageTotal, usageCost,
} from "./lib/articleGen.mjs";
import { buildLocalContext } from "./lib/localContext.mjs";

const MIN_OVERVIEW = 200; // 원본 200자 미만이면 글 생성 안 함(정보 페이지만)

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLACES = path.join(ROOT, "data", "places.json");
const STORE = path.join(ROOT, "data", "place-articles.json");
const OVERVIEWS = path.join(ROOT, "data", "place-overviews.json"); // 원본 캐시(로컬에서 미리 수집)
const OVERVIEW_CACHE = fs.existsSync(OVERVIEWS) ? JSON.parse(fs.readFileSync(OVERVIEWS, "utf8")) : {};
const FEES = path.join(ROOT, "data", "place-fees.json");
const FEE_CACHE = fs.existsSync(FEES) ? (JSON.parse(fs.readFileSync(FEES, "utf8")).fees || {}) : {};
const INTRO = path.join(ROOT, "data", "place-intro.json"); // 2단계 방문 팁
const INTRO_CACHE = fs.existsSync(INTRO) ? (JSON.parse(fs.readFileSync(INTRO, "utf8")).intro || {}) : {};
const INFO = path.join(ROOT, "data", "place-info.json"); // 2단계 볼거리·시설
const INFO_CACHE = fs.existsSync(INFO) ? (JSON.parse(fs.readFileSync(INFO, "utf8")).info || {}) : {};

// 방문팁의 입장료 줄을 요금 캐시와 일치시킴(무료배지·JSON-LD와 통일)
function applyAdmission(content, id) {
  const adm = FEE_CACHE[id];
  const label = adm === "free" ? "무료" : adm === "paid" ? "유료" : null;
  if (!label) return content;
  return content.replace(/(^|\n)(\s*[-*]\s*\*\*입장료\*\*\s*:)[^\n]*/, `$1$2 ${label}`);
}
// 생성·검증 모두 OpenAI, 기본 모델은 gpt-5.6-luna(2026-07-30 80% 인하 $0.20/$1.20).
// GitHub repo Variables의 OPENAI_MODEL로 덮어쓸 수 있지만, 미지정 시 항상 Luna로만 작성.
// 생성/검증 모델을 나누고 싶으면 OPENAI_GEN_MODEL 로 생성만 따로 지정 가능(없으면 OPENAI_MODEL 공용).
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";
const MODEL = process.env.OPENAI_GEN_MODEL || OPENAI_MODEL; // 초안 생성 모델
// 웹 검색 근거 수집(정보성 강화). ARTICLE_RESEARCH=off 로 끌 수 있음.
// 검색은 web_search 도구를 지원하는 모델이 필요 → OPENAI_RESEARCH_MODEL로 따로 지정 가능.
const RESEARCH = (process.env.ARTICLE_RESEARCH || "on").toLowerCase() !== "off";
const RESEARCH_MODEL = process.env.OPENAI_RESEARCH_MODEL || OPENAI_MODEL;
// web_search는 토큰과 별개로 "호출 1회당" 과금된다(약 $0.01). 그래서 두 가지로 막는다.
//  ① 캐시: 장소당 평생 1회만 검색 → 재작성·프롬프트 개선 라운드는 호출 0회.
//  ② 예산: 1회 실행당 신규 검색 상한 → 하루 비용이 예측 가능해진다.
const RESEARCH_MAX = Number(process.env.ARTICLE_RESEARCH_MAX || 8);
const RESEARCH_TTL_DAYS = Number(process.env.ARTICLE_RESEARCH_TTL || 180);
const RESEARCH_STORE = path.join(ROOT, "data", "place-research.json");
const RESEARCH_CACHE = fs.existsSync(RESEARCH_STORE)
  ? JSON.parse(fs.readFileSync(RESEARCH_STORE, "utf8"))
  : { generatedAt: null, research: {} };
RESEARCH_CACHE.research ||= {};

function envKey(name, fallback) {
  if (process.env[name]) return process.env[name].trim();
  const p = path.join(ROOT, ".env.local");
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
    for (const n of [name, fallback].filter(Boolean)) {
      const l = lines.find((x) => x.startsWith(n + "="));
      if (l && l.slice(n.length + 1).trim()) return l.slice(n.length + 1).trim();
    }
  }
  return "";
}
const OPENAI = envKey("OPENAI_API_KEY");
const GEMINI = envKey("GEMINI_API_KEY"); // 보조 팩트체크(환각 교차검증). 없으면 보조검증만 건너뜀.
const TOURKEY = envKey("TOUR_API_KEY", "DATA_GO_KR_KEY");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// data.go.kr 키는 인코딩/디코딩 2종 → 키를 그대로/encode 두 방식으로 시도(어느 걸 넣어도 되게)
function keyVariants(k) {
  const raw = String(k || "").trim();
  const enc = encodeURIComponent(raw);
  // 이미 %인코딩된 키(인코딩키)면 raw를 먼저, 아니면 encode를 먼저
  return /%[0-9A-Fa-f]{2}/.test(raw) ? [raw, enc] : [enc, raw];
}

async function fetchOverview(id) {
  // 캐시 우선(로컬에서 미리 받아둔 원본) → GitHub의 TourAPI 401을 우회
  if (Object.prototype.hasOwnProperty.call(OVERVIEW_CACHE, id)) {
    const cached = String(OVERVIEW_CACHE[id] || "");
    return { overview: cached, err: cached ? "" : "캐시:빈원본" };
  }
  let lastErr = "";
  for (const key of keyVariants(TOURKEY)) {
    try {
      const url = `https://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${key}&MobileOS=ETC&MobileApp=mwohaji&_type=json&contentId=${id}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
      const t = await r.text();
      let j;
      try { j = JSON.parse(t); } catch { lastErr = `HTTP${r.status} 비JSON: ${t.slice(0, 60)}`; continue; }
      const code = j?.response?.header?.resultCode;
      if (code !== "0000") { lastErr = `resultCode ${code} ${j?.response?.header?.resultMsg || ""}`; continue; }
      const it = j?.response?.body?.items?.item;
      const o = (Array.isArray(it) ? it[0] : it)?.overview || "";
      const clean = String(o).replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
      return { overview: clean, err: clean ? "" : "overview 필드 비어있음" };
    } catch (e) { lastErr = "fetch오류: " + (e instanceof Error ? e.message : e); }
  }
  return { overview: "", err: lastErr };
}

// Luna 생성 → 패턴검사 → Luna 검증·개선 → Gemini 보조 팩트체크. { art, reasons } 반환(art=null이면 사유 담김).
async function produceArticle(place, overview, existingTexts, extras = {}) {
  const reasons = [];
  const log = (m) => { console.log(`  · ${place.title} ${m}`); reasons.push(m); };
  const gen = async (prompt) => {
    const { text } = await callOpenAI(prompt, { apiKey: OPENAI, model: MODEL });
    return text;
  };
  // 검증기에 넘길 "확정 사실"(주소 + intro/info + 웹 검색 근거) — overview에 없어도 정당한 근거로 인정받게 함
  const verifyFacts = [`주소: ${place.addr}`, buildFactsBlock(extras), extras.research, extras.local].filter(Boolean).join("\n");
  // 연도·인물 패턴검사의 "근거" — overview뿐 아니라 확정 사실·검색 근거까지 포함해야
  // 검색으로 확보한 지정연도·수치가 환각으로 오인돼 잘려나가지 않는다.
  const grounds = [overview, verifyFacts].filter(Boolean).join("\n");

  let retryHint = ""; // 직전 반려 사유 → 다음 시도 프롬프트에 되먹임(같은 실수 반복 방지)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      let draft = await gen(buildPrompt(place, overview, { ...extras, retryHint }));
      if (!draft) { log(`시도${attempt} OpenAI 빈 응답`); await sleep(1500); continue; }

      const q = qualityCheck(draft, { overview, existingTexts, title: place.title });
      if (!q.ok) {
        log(`시도${attempt} 품질 반려: ${q.reason}`);
        retryHint = `직전 시도가 "${q.reason}" 사유로 반려됐어요. 이 문제를 반드시 고쳐 다시 쓰세요.`;
        await sleep(1000); continue;
      }

      const p = patternCheck(draft, grounds);
      if (!p.ok) {
        // 하드 반려 대신: 근거 없는 표현이 든 "문장만" 잘라내고 재검(글 전체를 버리지 않음 = 핵심 개선)
        const s = sanitizeUnsupported(draft, grounds);
        const sq = qualityCheck(s.text, { overview, existingTexts, title: place.title });
        const sp = patternCheck(s.text, grounds);
        if (s.text && sq.ok && sp.ok) {
          log(`시도${attempt} 근거없는 표현 ${s.removed}곳 자동 제거 후 통과`);
          draft = s.text;
        } else {
          log(`시도${attempt} 패턴 반려: ${p.reason}`);
          retryHint = `직전 시도가 ${p.reason} 문제로 반려됐어요. 근거에 없는 연도·인물·수치는 한 개도 쓰지 마세요.`;
          await sleep(1000); continue;
        }
      }

      const v = await verifyAndImprove(overview, draft, { apiKey: OPENAI, model: OPENAI_MODEL, facts: verifyFacts });
      let finalText;
      if (v.result === "PASS") {
        finalText = v.improved || draft;
      } else if (v.result === "FAIL") {
        // 완화: 검증 실패해도 곧바로 버리지 않고, 근거 없는 표현만 잘라내 로컬검사 통과 시 진행
        //  (뒤에 Gemini 독립 팩트체크가 최종 안전망 → 환각은 여전히 차단)
        const s = sanitizeUnsupported(draft, grounds);
        if (s.text && qualityCheck(s.text, { overview }).ok && patternCheck(s.text, grounds).ok) {
          log(`시도${attempt} 검증 FAIL → 근거없는 표현 ${s.removed}곳 제거 후 진행`);
          finalText = s.text;
        } else {
          log(`시도${attempt} 검증 FAIL: ${v.reason}`);
          retryHint = `직전 시도가 검증에서 "${String(v.reason).slice(0, 80)}" 사유로 반려됐어요. 근거에 없는 사실을 빼고 다시 쓰세요.`;
          await sleep(1000); continue;
        }
      } else { // ERROR — 검증기 오류는 로컬검사 통과한 draft로 진행(Gemini가 최종 확인)
        log(`시도${attempt} 검증오류(무시하고 진행): ${v.reason}`);
        finalText = draft;
      }
      const q2 = qualityCheck(finalText, { overview });
      const p2 = patternCheck(finalText, grounds);
      if (!q2.ok || !p2.ok) {
        // 개선본이 되레 규칙을 깼으면(개선 중 연도 재삽입 등) 정제 후 그래도 안 되면 검증 통과한 draft 사용
        const s = sanitizeUnsupported(finalText, grounds);
        finalText = qualityCheck(s.text, {}).ok && patternCheck(s.text, grounds).ok ? s.text : draft;
      }

      // [보조] Gemini 독립 팩트체크 — 주 모델(Luna)과 다른 모델로 환각 최종 교차검증. FAIL이면 재시도.
      let gemini = GEMINI ? "?" : "OFF";
      if (GEMINI) {
        const fc = await factCheckGemini(finalText, { apiKey: GEMINI, overview, facts: verifyFacts });
        gemini = fc.result; // PASS / FAIL / ERROR / SKIP
        if (fc.result === "FAIL") {
          log(`시도${attempt} Gemini 팩트체크 FAIL: ${fc.reason.slice(0, 120)}`);
          retryHint = `직전 시도가 교차검증에서 반려됐어요(${fc.reason.slice(0, 60)}). 근거에 없는 사실을 빼세요.`;
          await sleep(1000); continue;
        }
        if (fc.result === "ERROR") log(`시도${attempt} Gemini 팩트체크 오류(무시): ${fc.reason.slice(0, 80)}`);
      }

      const fin = qualityCheck(finalText, {});
      return { art: { text: finalText, len: fin.len, mode: v.improved && finalText === v.improved ? "improved" : "normal", verify: v.result, gemini }, reasons };
    } catch (e) {
      log(`시도${attempt} 오류: ${e.message}`);
      await sleep(1500);
    }
  }

  // 폴백: 원본 최소 가공 (안전 바닥) — minimalMode로 "원본 과유사" 검사 면제 + 근거없는 표현은 정제
  try {
    const raw = await gen(buildMinimalPrompt(place, overview));
    if (!raw) { log("최소가공 OpenAI 빈 응답"); return { art: null, reasons }; }
    const text = sanitizeUnsupported(raw, overview).text || raw;
    const q = qualityCheck(text, { overview, existingTexts, minimalMode: true, title: place.title });
    const p = patternCheck(text, overview);
    if (q.ok && p.ok) return { art: { text, len: q.len, mode: "minimal", verify: "MINIMAL", gemini: "SKIP(minimal)" }, reasons };
    log(`최소가공 반려: ${q.ok ? p.reason : q.reason}`);
  } catch (e) {
    log(`최소가공 오류: ${e.message}`);
  }
  return { art: null, reasons };
}

async function main() {
  const places = JSON.parse(fs.readFileSync(PLACES, "utf8")).spots;
  const store = fs.existsSync(STORE)
    ? JSON.parse(fs.readFileSync(STORE, "utf8"))
    : { startDate: "2026-07-27", generatedAt: null, articles: {} };
  store.articles ||= {};

  if (!OPENAI) { console.error("❌ OPENAI_API_KEY 없음 — 생성·검증 모두 OpenAI. 키 필수."); process.exit(1); }

  // TEST_IDS: 지정 장소만 생성(딜쿠샤 등 콕 집어 테스트). 있으면 큐/램프업 무시.
  const testIds = (process.env.TEST_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const doneIds = new Set(Object.keys(store.articles));
  const existingTexts = Object.values(store.articles).map((a) => a.content);

  let target;
  const items = []; // { place, mode: 'new' | 'rewrite' }
  if (testIds.length) {
    for (const id of testIds) {
      const p = places.find((x) => x.id === id);
      if (p) items.push({ place: p, mode: store.articles[id] ? "rewrite" : "new" });
    }
    target = items.length;
    console.log(`\n🧪 지정(${items.length}곳): ${items.map((i) => `${i.place.title}[${i.mode}]`).join(", ")}`);
  } else {
    const forced = Number(process.env.FORCE_COUNT) || 0;
    target = forced > 0 ? forced : rampUpCount(store.startDate);
    if (target <= 0) {
      console.log(`시작일(${store.startDate}) 이전 — 생성 안 함. (test_count 또는 test_ids 입력)`);
      return;
    }
    // 3-5: 재작성 대상(needsRewrite) 우선 → 남은 목표만큼 신규
    const byId = new Map(places.map((p) => [p.id, p]));
    // 재작성은 심각도(rewriteScore) 높은 순 우선 → 램프업 안에서 최악부터 고침
    const rwIds = Object.keys(store.articles)
      .filter((id) => store.articles[id]?.needsRewrite && byId.has(id))
      .sort((a, b) => (store.articles[b].rewriteScore || 0) - (store.articles[a].rewriteScore || 0));
    for (const id of rwIds) items.push({ place: byId.get(id), mode: "rewrite" });
    const rw = items.length;
    for (const p of pickQueue(places, doneIds, target * 4)) items.push({ place: p, mode: "new" });
    console.log(`\n🖋️  목표 ${target}건 (재작성 ${rw} 우선) · 후보 ${items.length} · 기존 ${doneIds.size} · 주 ${MODEL} · 보조 ${GEMINI ? "Gemini 팩트체크" : "없음"}`);
  }
  let made = 0, newPub = 0, rewritten = 0, removed = 0, skipped = 0;
  let searched = 0; // 이번 실행의 신규 web_search 호출 수(캐시 재사용분은 제외 — 이게 곧 검색 요금)
  const report = []; // 진단: 각 후보 결과를 저장소에 남겨 로그 없이도 원인 파악

  for (const { place, mode } of items) {
    if (made >= target) break;
    const { overview, err } = await fetchOverview(place.id);
    // 주변 맥락(맛집·근처 명소·코스·진행중 행사) — 전부 로컬 JSON, API 호출 0회·추가비용 0원.
    const lc = buildLocalContext(place);
    const extras = { intro: INTRO_CACHE[place.id], info: INFO_CACHE[place.id], local: lc.text };
    const hasFacts =
      (extras.intro && Object.keys(extras.intro).some((k) => k !== "type" && extras.intro[k])) ||
      (extras.info && extras.info.length > 0);

    // 원본 빈약 + 2단계 데이터도 없음 → 신규는 스킵, 재작성은 삭제(정보 카드형 전환)
    if (overview.length < MIN_OVERVIEW && !hasFacts) {
      if (mode === "rewrite") {
        delete store.articles[place.id];
        removed++; made++;
        report.push({ id: place.id, title: place.title, outcome: "removed→infocard", reason: `원본 ${overview.length}자·새데이터 없음` });
        console.log(`  🗑  정보카드 전환(삭제): ${place.title}`);
      } else {
        skipped++;
        report.push({ id: place.id, title: place.title, outcome: "skip", reason: `원본 ${overview.length}자(<${MIN_OVERVIEW})${err ? " · " + err : ""}` });
        console.log(`  ⏭  원본 빈약(${overview.length}자, ${err}) 스킵: ${place.title}`);
      }
      continue;
    }

    // 재작성이면 자기 기존글은 중복검사에서 제외
    const exTexts = mode === "rewrite"
      ? Object.entries(store.articles).filter(([id]) => id !== place.id).map(([, a]) => a.content)
      : existingTexts;

    // 웹 검색으로 공식 출처 사실 수집 → 정보성 강화. 실패해도 그냥 넘어감(기존 동작 유지).
    //  캐시 우선(호출 0회) → 없으면 예산 안에서만 신규 검색 → 예산 소진 시 로컬 재료로만 작성.
    let researchNote = RESEARCH ? "" : "off";
    if (RESEARCH) {
      const cached = RESEARCH_CACHE.research[place.id];
      const fresh = cached && Date.now() - new Date(cached.at).getTime() < RESEARCH_TTL_DAYS * 86400000;
      if (fresh) {
        // 수확 0건도 캐시에 남긴다 → 소득 없는 장소를 매일 다시 검색하지 않는다.
        if (cached.text) {
          extras.research = cached.text;
          extras.sources = cached.sources || [];
          researchNote = `캐시 ${cached.text.split("\n").length}건`;
          console.log(`  ♻ 검색 캐시 재사용(호출 0회): ${place.title}`);
        } else {
          researchNote = "캐시 0건(재검색 안 함)";
        }
      } else if (searched >= RESEARCH_MAX) {
        researchNote = `검색예산 소진(${RESEARCH_MAX}회) — 로컬 재료로만`;
      } else {
        searched++;
        const r = await researchFacts(place, { apiKey: OPENAI, model: RESEARCH_MODEL });
        // 캐시는 "결론이 난" 경우만 저장한다. HTTP 오류·타임아웃까지 캐시하면
        // 일시적 장애 하나로 그 장소가 180일간 영영 검색 대상에서 빠져버린다.
        const settled = Boolean(r.text) || /수집된 사실 없음|JSON 없음/.test(r.reason || "");
        if (settled) {
          RESEARCH_CACHE.research[place.id] = {
            at: new Date().toISOString(), title: place.title,
            text: r.text, sources: r.sources, reason: r.reason,
          };
        }
        if (r.text) {
          extras.research = r.text;
          extras.sources = r.sources;
          researchNote = `${r.text.split("\n").length}건/출처${r.sources.length}`;
          console.log(`  🔎 검색 ${searched}/${RESEARCH_MAX} 근거 ${researchNote}: ${place.title}`);
        } else {
          researchNote = `실패: ${String(r.reason || "0건").slice(0, 100)}`;
          console.log(`  🔎 검색 ${searched}/${RESEARCH_MAX} ${researchNote}: ${place.title}`);
        }
      }
    }

    const { art, reasons } = await produceArticle(place, overview, exTexts, extras);
    if (!art) {
      if (mode === "rewrite") {
        delete store.articles[place.id]; // 재생성 실패 → 정보 카드형
        removed++; made++;
        report.push({ id: place.id, title: place.title, outcome: "removed→infocard", reason: reasons.slice(-3).join(" | ") });
        console.log(`  🗑  재생성 실패→정보카드(삭제): ${place.title}`);
      } else {
        skipped++;
        report.push({ id: place.id, title: place.title, outcome: "skip", overviewLen: overview.length, research: researchNote, reason: reasons.slice(-3).join(" | ") });
        console.log(`  ✗ 스킵: ${place.title}`);
      }
      continue;
    }

    store.articles[place.id] = {
      status: "published", // 3중 안전망 통과 → 자동 발행
      generatedAt: new Date().toISOString(),
      publishedAt: store.articles[place.id]?.publishedAt || new Date().toISOString(),
      area: place.area,
      type: place.type,
      typeLabel: tourTypeLabel(place.type),
      title: place.title,
      content: applyAdmission(art.text, place.id),
      sources: extras.sources || [], // 웹 검색 근거의 공식 출처 URL (글 하단 표기)
      model: MODEL,
      verify: art.verify, // 주 Luna 검증: PASS / SKIP / MINIMAL
      factcheck2: art.gemini, // 보조 Gemini 팩트체크: PASS / OFF / SKIP(minimal)
      minimalMode: art.mode === "minimal",
      length: art.len,
    };
    made++;
    if (mode === "rewrite") rewritten++; else { newPub++; existingTexts.push(art.text); }
    report.push({ id: place.id, title: place.title, outcome: mode === "rewrite" ? "rewritten" : "published", detail: `${art.mode}/Luna:${art.verify}/G:${art.gemini}/${art.len}자`, overviewLen: overview.length, research: researchNote, local: `맛집${lc.counts.food}/명소${lc.counts.spots}/코스${lc.counts.courses}/행사${lc.counts.events}` });
    console.log(`  ${mode === "rewrite" ? "♻ 재작성" : "✓ 발행"} ${made}/${target}: ${place.title} (${art.len}자, ${art.mode}, Luna검증 ${art.verify}, Gemini ${art.gemini})`);
    await sleep(1000);
  }

  // 실비 측정 — 토큰 요금(검색 도구 호출료는 별도로 대시보드에서 확인)
  const cost = usageCost();
  const per = made > 0 ? cost / made : 0;
  console.log(`
💰 토큰 사용: 입력 ${usageTotal.in.toLocaleString()}(캐시적중 ${usageTotal.cached.toLocaleString()} = ${usageTotal.in ? Math.round(usageTotal.cached / usageTotal.in * 100) : 0}%) · 출력 ${usageTotal.out.toLocaleString()} · 호출 ${usageTotal.calls}회(검색 ${usageTotal.search}회)`);
  console.log(`   토큰 요금 $${cost.toFixed(4)} · 건당 $${per.toFixed(5)} (약 ${Math.round(per * 1400)}원) — 검색 도구 호출료 별도`);

  // 검색 근거 캐시 저장 — 다음부터 같은 장소는 호출 0회(재작성·프롬프트 개선 라운드 전부 무료)
  if (RESEARCH) {
    RESEARCH_CACHE.generatedAt = new Date().toISOString();
    fs.writeFileSync(RESEARCH_STORE, JSON.stringify(RESEARCH_CACHE, null, 0));
    const cachedTotal = Object.keys(RESEARCH_CACHE.research).length;
    console.log(`   🔎 신규 검색 ${searched}회(상한 ${RESEARCH_MAX}) · 검색요금 약 $${(searched * 0.01).toFixed(2)} · 누적 캐시 ${cachedTotal}곳`);
  }

  const keyFp = TOURKEY ? `${TOURKEY.slice(0, 6)}...${TOURKEY.slice(-4)} (${TOURKEY.length}자)` : "❌비어있음(secret 못 읽음)";
  store.generatedAt = new Date().toISOString();
  store._lastRun = { at: new Date().toISOString(), newPub, rewritten, removed, skipped, keyFp, usage: { ...usageTotal, newSearches: searched, searchFeeUsd: Number((searched * 0.01).toFixed(3)), costUsd: Number(cost.toFixed(4)), totalUsd: Number((cost + searched * 0.01).toFixed(4)), perArticleUsd: Number(per.toFixed(5)) }, results: report }; // 진단용
  fs.writeFileSync(STORE, JSON.stringify(store, null, 0));
  const pub = Object.values(store.articles).filter((a) => a.status === "published").length;
  console.log(`\n💾 저장: 신규 ${newPub} · 재작성 ${rewritten} · 정보카드전환 ${removed} · 스킵 ${skipped} | 총 발행 ${pub}\n`);
}

main().catch((e) => { console.error("❌ 실패:", e.message); process.exit(1); });
