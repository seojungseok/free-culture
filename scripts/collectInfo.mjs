// 2-2. detailInfo2 수집 — 볼거리(부대시설·세부 항목·전시실별 안내 등)
//  → data/place-info.json 에 [{name,text}] 배열로 점진 캐시.
//  전 유형(12·14·28) 대상. 일 1,000회 한도 → INFO_DAILY(기본 800)만큼만.
//
// 실행:
//   node scripts/collectInfo.mjs           # 우선순위 상위 800곳(미수집)
//   node scripts/collectInfo.mjs 2763856   # 특정 id만(쉼표 구분)

import {
  readCache, writeCache, createBudget, QuotaError,
  detailInfoRaw, normalizeInfo, sleep, hasKey,
} from "./lib/tourClient.mjs";

if (!hasKey()) { console.error("❌ TOUR_API_KEY / DATA_GO_KR_KEY 없음"); process.exit(1); }

const DAILY = Number(process.env.INFO_DAILY || 800);
const OUT = "place-info.json";

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
  const store = readCache(OUT, { generatedAt: null, info: {} });
  store.info ||= {};

  const arg = (process.argv[2] || "").trim();
  let batch;
  if (arg) {
    const ids = arg.split(",").map((s) => s.trim()).filter(Boolean);
    const byId = new Map(places.map((p) => [p.id, p]));
    batch = ids.map((id) => byId.get(id)).filter(Boolean);
  } else {
    batch = orderTargets(places, store.info).slice(0, DAILY);
  }

  const targetsTotal = orderTargets(places, store.info).length;
  console.log(`\n🖼️  볼거리(detailInfo2) 수집 — 미수집 ${targetsTotal} · 이번 실행 ${batch.length} (상한 ${DAILY})`);

  const budget = createBudget(DAILY);
  let ok = 0, empty = 0, fail = 0;
  for (const p of batch) {
    try {
      const items = await detailInfoRaw(p.id, p.type, budget);
      const norm = normalizeInfo(items);
      store.info[p.id] = norm; // 빈 배열도 저장(재조회 방지)
      if (norm.length) ok++; else empty++;
    } catch (e) {
      if (e instanceof QuotaError) { console.log(`\n⛔ ${e.message} — 진행분 저장 후 중단`); break; }
      fail++;
      if (fail <= 5) console.log(`  · ${p.title} 실패: ${e.message}`);
    }
    await sleep(220);
  }

  store.generatedAt = new Date().toISOString();
  const mb = writeCache(OUT, store);
  const total = Object.keys(store.info).length;
  const withData = Object.values(store.info).filter((v) => Array.isArray(v) && v.length > 0).length;
  console.log(`\n💾 저장: data/${OUT} (${mb}MB)`);
  console.log(`   이번: 항목있음 ${ok} · 빈응답 ${empty} · 실패 ${fail} · API콜 ${budget.used}`);
  console.log(`   누적: ${total}곳 (항목 있음 ${withData} = ${((withData / total) * 100 || 0).toFixed(1)}%) · 남은 대상 ${Math.max(0, targetsTotal - budget.used)}\n`);
}

main().catch((e) => { console.error("❌ 실패:", e.message); process.exit(1); });
