// 2-1. detailIntro2 수집 — 방문 팁(이용시간·휴무일·주차·요금·문의처·유모차·신용카드 등)
//  → data/place-intro.json 에 유형 공통 스키마로 점진 캐시.
//  전 유형(12·14·28) 대상. 일 1,000회 한도 → INTRO_DAILY(기본 800)만큼만, 며칠에 걸쳐 완주.
//
// 실행:
//   node scripts/collectIntro.mjs            # 우선순위 상위 800곳(미수집)
//   node scripts/collectIntro.mjs 2763856    # 특정 id만(쉼표 구분)
//   INTRO_DAILY=300 node scripts/collectIntro.mjs

import {
  readCache, writeCache, createBudget, QuotaError,
  detailIntroRaw, normalizeIntro, classifyAdmission, sleep, hasKey,
} from "./lib/tourClient.mjs";

if (!hasKey()) { console.error("❌ TOUR_API_KEY / DATA_GO_KR_KEY 없음"); process.exit(1); }

const DAILY = Number(process.env.INTRO_DAILY || 800);
const OUT = "place-intro.json";

// 우선순위: 아이친화 → 나머지 (이미 사이트에 많이 노출되는 순)
function orderTargets(spots, done) {
  const kid = [], rest = [];
  for (const s of spots) {
    if (s.id in done) continue;
    (s.isKid ? kid : rest).push(s);
  }
  return [...kid, ...rest];
}

async function main() {
  const places = readCache("places.json", { spots: [] }).spots;
  const store = readCache(OUT, { generatedAt: null, intro: {} });
  store.intro ||= {};

  const arg = (process.argv[2] || "").trim();
  let batch;
  if (arg && !/^\d+$/.test(arg.replace(/,/g, ""))) {
    batch = [];
  } else if (arg) {
    // 특정 id 목록(쉼표) — 단, 순수 숫자 한 개면 '그 id'로 취급
    const ids = arg.split(",").map((s) => s.trim()).filter(Boolean);
    const byId = new Map(places.map((p) => [p.id, p]));
    batch = ids.map((id) => byId.get(id)).filter(Boolean);
  } else {
    batch = orderTargets(places, store.intro).slice(0, DAILY);
  }

  const targetsTotal = orderTargets(places, store.intro).length;
  console.log(`\n🧭 방문 팁(detailIntro2) 수집 — 미수집 ${targetsTotal} · 이번 실행 ${batch.length} (상한 ${DAILY})`);

  const budget = createBudget(DAILY);
  let ok = 0, empty = 0, fail = 0;
  for (const p of batch) {
    try {
      const raw = await detailIntroRaw(p.id, p.type, budget);
      const norm = normalizeIntro(p.type, raw || {});
      norm.type = p.type;
      if (norm.fee) norm.admission = classifyAdmission(norm.fee);
      const keys = Object.keys(norm).filter((k) => k !== "type");
      store.intro[p.id] = norm;
      if (keys.length) ok++; else empty++;
    } catch (e) {
      if (e instanceof QuotaError) { console.log(`\n⛔ ${e.message} — 진행분 저장 후 중단`); break; }
      fail++;
      if (fail <= 5) console.log(`  · ${p.title} 실패: ${e.message}`);
    }
    await sleep(220);
  }

  store.generatedAt = new Date().toISOString();
  const mb = writeCache(OUT, store);
  const total = Object.keys(store.intro).length;
  const withData = Object.values(store.intro).filter(
    (v) => Object.keys(v).filter((k) => k !== "type").length > 0
  ).length;
  console.log(`\n💾 저장: data/${OUT} (${mb}MB)`);
  console.log(`   이번: 내용있음 ${ok} · 빈응답 ${empty} · 실패 ${fail} · API콜 ${budget.used}`);
  console.log(`   누적: ${total}곳 (필드 있음 ${withData} = ${((withData / total) * 100 || 0).toFixed(1)}%) · 남은 대상 ${Math.max(0, targetsTotal - budget.used)}\n`);
}

main().catch((e) => { console.error("❌ 실패:", e.message); process.exit(1); });
