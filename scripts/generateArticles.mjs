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

async function fetchOverview(id) {
  try {
    const url = `https://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${encodeURIComponent(TOURKEY)}&MobileOS=ETC&MobileApp=mwohaji&_type=json&contentId=${id}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
    const j = await r.json();
    const it = j?.response?.body?.items?.item;
    const o = (Array.isArray(it) ? it[0] : it)?.overview || "";
    return String(o).replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
  } catch { return ""; }
}

// Gemini 생성 → 패턴검사 → OpenAI 검증+개선. PASS면 개선본 발행. 실패 시 null.
async function produceArticle(place, overview, existingTexts) {
  const gen = async (prompt) => {
    const { text } = await callGemini(prompt, { apiKey: GEMINI, model: MODEL, grounding: false });
    return text;
  };

  // 1차: 풍부한 일반 글 2회
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const draft = await gen(buildPrompt(place, overview));
      const q = qualityCheck(draft, { overview, existingTexts });
      if (!q.ok) { console.log(`  · ${place.title} 시도${attempt} 품질 반려: ${q.reason}`); await sleep(1000); continue; }
      const p = patternCheck(draft, overview);
      if (!p.ok) { console.log(`  · ${place.title} 시도${attempt} 패턴 반려: ${p.reason}`); await sleep(1000); continue; }

      const v = await verifyAndImprove(overview, draft, { apiKey: OPENAI, model: OPENAI_MODEL });
      if (v.result === "FAIL") { console.log(`  · ${place.title} 시도${attempt} 검증 FAIL: ${v.reason}`); await sleep(1000); continue; }
      if (v.result === "ERROR") { console.log(`  · ${place.title} 시도${attempt} 검증오류: ${v.reason}`); await sleep(1500); continue; }

      // PASS(개선본 사용) 또는 SKIP(키 없음 → 원본 Gemini글). 개선본이 이상하면 원본으로 폴백.
      let finalText = v.result === "PASS" && v.improved ? v.improved : draft;
      const q2 = qualityCheck(finalText, { overview });
      const p2 = patternCheck(finalText, overview);
      if (!q2.ok || !p2.ok) finalText = draft; // 개선본 문제 시 검증 통과한 원본 사용
      const fin = qualityCheck(finalText, {});
      return { text: finalText, len: fin.len, mode: v.improved && finalText === v.improved ? "improved" : "normal", verify: v.result };
    } catch (e) {
      console.log(`  · ${place.title} 시도${attempt} 오류: ${e.message}`);
      await sleep(1500);
    }
  }

  // 폴백: "원본 최소 가공" — 구조·말투만, 새 사실 0. (OpenAI 생략, 품질+패턴만)
  try {
    const text = await gen(buildMinimalPrompt(place, overview));
    const q = qualityCheck(text, { overview, existingTexts });
    const p = patternCheck(text, overview);
    if (q.ok && p.ok) return { text, len: q.len, mode: "minimal", verify: "MINIMAL" };
    console.log(`  · ${place.title} 최소가공 반려: ${q.ok ? p.reason : q.reason}`);
  } catch (e) {
    console.log(`  · ${place.title} 최소가공 오류: ${e.message}`);
  }
  return null;
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

  let queue, target;
  if (testIds.length) {
    queue = testIds.map((id) => places.find((p) => p.id === id)).filter(Boolean);
    target = queue.length;
    console.log(`\n🧪 지정 테스트(${queue.length}곳): ${queue.map((p) => p.title).join(", ")}`);
  } else {
    const forced = Number(process.env.FORCE_COUNT) || 0;
    target = forced > 0 ? forced : rampUpCount(store.startDate);
    if (target <= 0) {
      console.log(`시작일(${store.startDate}) 이전 — 생성 안 함. (test_count 또는 test_ids 입력)`);
      return;
    }
    queue = pickQueue(places, doneIds, target * 3);
    console.log(`\n🖋️  목표 ${target}건 · 후보 ${queue.length} · 기존 ${doneIds.size} · 검증모델 ${OPENAI ? OPENAI_MODEL : "없음"}`);
  }
  let made = 0, skipped = 0;

  for (const place of queue) {
    if (made >= target) break;
    const overview = await fetchOverview(place.id);

    // 원본이 너무 빈약하면 글 생성 안 함(얇은 콘텐츠 방지). 정보 페이지는 유지.
    if (overview.length < MIN_OVERVIEW) {
      skipped++;
      console.log(`  ⏭  원본 빈약(${overview.length}자) 스킵: ${place.title}`);
      continue;
    }

    const art = await produceArticle(place, overview, existingTexts);
    if (!art) { skipped++; console.log(`  ✗ 스킵(안전망 미통과): ${place.title}`); continue; }

    store.articles[place.id] = {
      status: "published", // 3중 안전망 통과 → 자동 발행
      generatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      area: place.area,
      type: place.type,
      typeLabel: tourTypeLabel(place.type),
      title: place.title,
      content: art.text,
      sources: [],
      model: MODEL,
      verify: art.verify, // PASS / SKIP / MINIMAL
      minimalMode: art.mode === "minimal", // 원본 최소가공 폴백 여부
      length: art.len,
    };
    existingTexts.push(art.text);
    made++;
    console.log(`  ✓ 발행 ${made}/${target}: ${place.title} (${art.len}자, ${art.mode}, 검증 ${art.verify})`);
    await sleep(1000);
  }

  store.generatedAt = new Date().toISOString();
  fs.writeFileSync(STORE, JSON.stringify(store, null, 0));
  const pub = Object.values(store.articles).filter((a) => a.status === "published").length;
  console.log(`\n💾 저장: 신규 발행 ${made} · 스킵 ${skipped} | 총 발행 ${pub}\n`);
}

main().catch((e) => { console.error("❌ 실패:", e.message); process.exit(1); });
