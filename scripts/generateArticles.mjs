// 글 자동 생성·발행 (GitHub Action이 매일 실행)
// 3중 안전망: Gemini 생성 → 정규식 패턴검사 → OpenAI 교차검증 → PASS만 자동 발행(published).
// 계속 실패하면 "역사·인물 뺀 안전버전"으로 발행, 그것도 실패면 스킵(로그).
//
// 실행: node scripts/generateArticles.mjs
// 필요: GEMINI_API_KEY, OPENAI_API_KEY, DATA_GO_KR_KEY(또는 TOUR_API_KEY)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildPrompt, buildMinimalPrompt, callGemini, qualityCheck, patternCheck,
  verifyAndImprove, rampUpCount, pickQueue, tourTypeLabel,
} from "./lib/articleGen.mjs";

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
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

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
const GEMINI = envKey("GEMINI_API_KEY");
const OPENAI = envKey("OPENAI_API_KEY");
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

// Gemini 생성 → 패턴검사 → OpenAI 검증+개선. { art, reasons } 반환(art=null이면 사유 담김).
async function produceArticle(place, overview, existingTexts, extras = {}) {
  const reasons = [];
  const log = (m) => { console.log(`  · ${place.title} ${m}`); reasons.push(m); };
  const gen = async (prompt, grounding = false) => {
    const { text } = await callGemini(prompt, { apiKey: GEMINI, model: MODEL, grounding });
    return text;
  };
  // [B] 원본 빈약 + 2단계 데이터도 부실 → 웹검색(grounding) 켜서 교차 보강 시도
  const thin = (overview || "").length < MIN_OVERVIEW;
  const hasFacts = Boolean(extras.intro && Object.keys(extras.intro).some((k) => k !== "type" && extras.intro[k])) ||
    Boolean(extras.info && extras.info.length);
  const useGrounding = thin && !hasFacts;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const draft = await gen(buildPrompt(place, overview, extras), useGrounding);
      if (!draft) { log(`시도${attempt} Gemini 빈 응답`); await sleep(1500); continue; }
      const q = qualityCheck(draft, { overview, existingTexts });
      if (!q.ok) { log(`시도${attempt} 품질 반려: ${q.reason}`); await sleep(1000); continue; }
      const p = patternCheck(draft, overview);
      if (!p.ok) { log(`시도${attempt} 패턴 반려: ${p.reason}`); await sleep(1000); continue; }

      const v = await verifyAndImprove(overview, draft, { apiKey: OPENAI, model: OPENAI_MODEL });
      if (v.result === "FAIL") { log(`시도${attempt} 검증 FAIL: ${v.reason}`); await sleep(1000); continue; }
      if (v.result === "ERROR") { log(`시도${attempt} 검증오류: ${v.reason}`); await sleep(1500); continue; }

      let finalText = v.result === "PASS" && v.improved ? v.improved : draft;
      const q2 = qualityCheck(finalText, { overview });
      const p2 = patternCheck(finalText, overview);
      if (!q2.ok || !p2.ok) finalText = draft;
      const fin = qualityCheck(finalText, {});
      return { art: { text: finalText, len: fin.len, mode: v.improved && finalText === v.improved ? "improved" : "normal", verify: v.result }, reasons };
    } catch (e) {
      log(`시도${attempt} 오류: ${e.message}`);
      await sleep(1500);
    }
  }

  // 폴백: 원본 최소 가공
  try {
    const text = await gen(buildMinimalPrompt(place, overview));
    if (!text) { log("최소가공 Gemini 빈 응답"); return { art: null, reasons }; }
    const q = qualityCheck(text, { overview, existingTexts });
    const p = patternCheck(text, overview);
    if (q.ok && p.ok) return { art: { text, len: q.len, mode: "minimal", verify: "MINIMAL" }, reasons };
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

  if (!GEMINI) { console.error("❌ GEMINI_API_KEY 없음"); process.exit(1); }
  if (!OPENAI) console.warn("⚠️ OPENAI_API_KEY 없음 — 검증·개선(안전망3) 건너뜀. 패턴검사만 적용됨.");

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
    for (const p of pickQueue(places, doneIds, target * 3)) items.push({ place: p, mode: "new" });
    console.log(`\n🖋️  목표 ${target}건 (재작성 ${rw} 우선) · 후보 ${items.length} · 기존 ${doneIds.size} · 검증 ${OPENAI ? OPENAI_MODEL : "없음"}`);
  }
  let made = 0, newPub = 0, rewritten = 0, removed = 0, skipped = 0;
  const report = []; // 진단: 각 후보 결과를 저장소에 남겨 로그 없이도 원인 파악

  for (const { place, mode } of items) {
    if (made >= target) break;
    const { overview, err } = await fetchOverview(place.id);
    const extras = { intro: INTRO_CACHE[place.id], info: INFO_CACHE[place.id] };
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

    const { art, reasons } = await produceArticle(place, overview, exTexts, extras);
    if (!art) {
      if (mode === "rewrite") {
        delete store.articles[place.id]; // 재생성 실패 → 정보 카드형
        removed++; made++;
        report.push({ id: place.id, title: place.title, outcome: "removed→infocard", reason: reasons.slice(-3).join(" | ") });
        console.log(`  🗑  재생성 실패→정보카드(삭제): ${place.title}`);
      } else {
        skipped++;
        report.push({ id: place.id, title: place.title, outcome: "skip", overview: overview.length, reason: reasons.slice(-3).join(" | ") });
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
      sources: [],
      model: MODEL,
      verify: art.verify, // PASS / SKIP / MINIMAL
      minimalMode: art.mode === "minimal",
      length: art.len,
    };
    made++;
    if (mode === "rewrite") rewritten++; else { newPub++; existingTexts.push(art.text); }
    report.push({ id: place.id, title: place.title, outcome: mode === "rewrite" ? "rewritten" : "published", detail: `${art.mode}/${art.verify}/${art.len}자` });
    console.log(`  ${mode === "rewrite" ? "♻ 재작성" : "✓ 발행"} ${made}/${target}: ${place.title} (${art.len}자, ${art.mode}, 검증 ${art.verify})`);
    await sleep(1000);
  }

  const keyFp = TOURKEY ? `${TOURKEY.slice(0, 6)}...${TOURKEY.slice(-4)} (${TOURKEY.length}자)` : "❌비어있음(secret 못 읽음)";
  store.generatedAt = new Date().toISOString();
  store._lastRun = { at: new Date().toISOString(), newPub, rewritten, removed, skipped, keyFp, results: report }; // 진단용
  fs.writeFileSync(STORE, JSON.stringify(store, null, 0));
  const pub = Object.values(store.articles).filter((a) => a.status === "published").length;
  console.log(`\n💾 저장: 신규 ${newPub} · 재작성 ${rewritten} · 정보카드전환 ${removed} · 스킵 ${skipped} | 총 발행 ${pub}\n`);
}

main().catch((e) => { console.error("❌ 실패:", e.message); process.exit(1); });
