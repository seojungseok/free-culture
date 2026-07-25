// STEP 0 — Gemini 2.5 Flash-Lite 실호출 테스트 (한 장소)
// 실행: node scripts/testGemini.mjs [contentId]
// 필요: .env.local 에 GEMINI_API_KEY (+ DATA_GO_KR_KEY)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPrompt, callGemini, qualityCheck, tourTypeLabel } from "./lib/articleGen.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function envKey(name, fallback) {
  if (process.env[name]) return process.env[name].trim();
  const lines = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/);
  for (const n of [name, fallback].filter(Boolean)) {
    const l = lines.find((x) => x.startsWith(n + "="));
    if (l && l.slice(n.length + 1).trim()) return l.slice(n.length + 1).trim();
  }
  return "";
}

const GEMINI = envKey("GEMINI_API_KEY");
const TOURKEY = envKey("TOUR_API_KEY", "DATA_GO_KR_KEY");
if (!GEMINI) {
  console.error("❌ GEMINI_API_KEY 없음 — .env.local에 추가해 주세요 (로컬 테스트용).");
  process.exit(1);
}

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

const places = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "places.json"), "utf8")).spots;
const id = process.argv[2] || "822384"; // 기본: 북서울꿈의숲
const place = places.find((s) => s.id === id) || places[0];

console.log(`\n🧪 STEP 0: ${place.title} (${place.area} · ${tourTypeLabel(place.type)}, id ${place.id})`);
const overview = await fetchOverview(place.id);
console.log(`   원본 overview: ${overview ? overview.length + "자" : "없음 → grounding 사용"}`);

const prompt = buildPrompt(place, overview);
const t0 = Date.now();
const { text, sources } = await callGemini(prompt, { apiKey: GEMINI, grounding: !overview });
const secs = ((Date.now() - t0) / 1000).toFixed(1);

const check = qualityCheck(text, { overview });
console.log(`\n───────── 생성 결과 (${secs}s, ${check.len}자) ─────────\n`);
console.log(text);
console.log(`\n───────── 품질검사 ─────────`);
console.log(check.ok ? `✅ 통과 (${check.len}자)` : `❌ 실패: ${check.reason}`);
if (sources.length) console.log("출처:", sources.join(" · "));
