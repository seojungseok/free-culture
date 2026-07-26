// 글 자동 생성 (GitHub Action이 매일 실행) — 초안 큐에 적재
// 램프업(5→10→20→40)만큼 미발행 장소를 골라 Gemini로 초안 생성 → 품질검사 통과분만 draft로 저장.
// 발행(status: published)은 별도 승인 단계에서. (초안 큐 → 확인 후 발행)
//
// 실행: node scripts/generateArticles.mjs
// 필요: GEMINI_API_KEY, DATA_GO_KR_KEY (또는 TOUR_API_KEY)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildPrompt, callGemini, qualityCheck, rampUpCount, pickQueue, tourTypeLabel,
} from "./lib/articleGen.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLACES = path.join(ROOT, "data", "places.json");
const STORE = path.join(ROOT, "data", "place-articles.json");
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

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

async function main() {
  const places = JSON.parse(fs.readFileSync(PLACES, "utf8")).spots;
  const store = fs.existsSync(STORE)
    ? JSON.parse(fs.readFileSync(STORE, "utf8"))
    : { startDate: "2026-07-27", generatedAt: null, articles: {} };
  store.articles ||= {};

  // FORCE_COUNT: 시작일 전 테스트용 수동 생성 (워크플로우 test_count 입력). 없으면 램프업.
  const forced = Number(process.env.FORCE_COUNT) || 0;
  const target = forced > 0 ? forced : rampUpCount(store.startDate);
  if (target <= 0) {
    console.log(`시작일(${store.startDate}) 이전 — 생성 안 함. (테스트하려면 test_count 입력)`);
    return;
  }
  if (!GEMINI) { console.error("❌ GEMINI_API_KEY 없음 (GitHub Secrets/.env.local 확인)"); process.exit(1); }

  const doneIds = new Set(Object.keys(store.articles)); // 이미 초안/발행된 장소 제외
  const queue = pickQueue(places, doneIds, target * 2); // 실패 대비 여유
  const existingTexts = Object.values(store.articles).map((a) => a.content);

  console.log(`\n🖋️  램프업 목표 ${target}건 · 후보 ${queue.length} · 기존 ${doneIds.size}`);
  let made = 0, skipped = 0;

  for (const place of queue) {
    if (made >= target) break;
    const overview = await fetchOverview(place.id);
    let ok = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        // 웹검색(grounding)은 환각 위험이 커서 기본 비활성 — 원본(overview) 사실만으로 재구성
        const { text, sources } = await callGemini(buildPrompt(place, overview), {
          apiKey: GEMINI, model: MODEL, grounding: false,
        });
        const check = qualityCheck(text, { overview, existingTexts });
        if (check.ok) { ok = { text, sources, len: check.len }; break; }
        console.log(`  · ${place.title} 시도${attempt} 미달: ${check.reason}`);
      } catch (e) {
        console.log(`  · ${place.title} 시도${attempt} 오류: ${e.message}`);
      }
      await sleep(1500);
    }

    if (!ok) { skipped++; console.log(`  ✗ 스킵: ${place.title}`); continue; }

    store.articles[place.id] = {
      status: "draft",
      generatedAt: new Date().toISOString(),
      publishedAt: null,
      area: place.area,
      type: place.type,
      typeLabel: tourTypeLabel(place.type),
      title: place.title,
      content: ok.text,
      sources: ok.sources,
      model: MODEL,
      length: ok.len,
    };
    existingTexts.push(ok.text);
    made++;
    console.log(`  ✓ 초안 ${made}/${target}: ${place.title} (${ok.len}자)`);
    await sleep(1200);
  }

  store.generatedAt = new Date().toISOString();
  fs.writeFileSync(STORE, JSON.stringify(store, null, 0));
  const drafts = Object.values(store.articles).filter((a) => a.status === "draft").length;
  const pub = Object.values(store.articles).filter((a) => a.status === "published").length;
  console.log(`\n💾 저장: 신규 ${made} · 스킵 ${skipped} | 총 초안 ${drafts} · 발행 ${pub}\n`);
}

main().catch((e) => { console.error("❌ 실패:", e.message); process.exit(1); });
