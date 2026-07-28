// 음식점(contentTypeId=39) detailIntro2 수집 — 전화(문의)·영업시간·휴무·주차·대표메뉴.
//  나들이 detailIntro 로직(normalizeIntro) 재사용 — 39는 opentimefood/restdatefood/infocenterfood 등으로 매핑됨.
//  → data/restaurant-intro.json 에 나들이와 동일 스키마로 점진 캐시(재실행 시 이어서).
//  수도권(서울·인천·경기) 우선. 일 1,000회 공유 한도 → RIN_DAILY(기본 300)만큼만, 며칠에 걸쳐 완주.
//
// 실행:
//   node scripts/collectRestaurantIntro.mjs              # 수도권 우선 상위 300곳(미수집)
//   RIN_DAILY=200 node scripts/collectRestaurantIntro.mjs
//   RIN_AREAS=서울,인천,경기 node scripts/collectRestaurantIntro.mjs

import {
  readCache, writeCache, createBudget, QuotaError,
  detailIntroRaw, normalizeIntro, sleep, hasKey,
} from "./lib/tourClient.mjs";

if (!hasKey()) { console.error("❌ TOUR_API_KEY / DATA_GO_KR_KEY 없음"); process.exit(1); }

const DAILY = Number(process.env.RIN_DAILY || 300);
const OUT = "restaurant-intro.json";
const CT = "39";
const PRIORITY = ["서울", "인천", "경기"]; // 수도권 먼저

// 수도권 → 나머지 순, 미수집만
function orderTargets(restaurants, done, areaFilter) {
  const pri = [], rest = [];
  for (const r of restaurants) {
    if (r.id in done) continue;
    if (areaFilter.length && !areaFilter.includes(r.area)) continue;
    (PRIORITY.includes(r.area) ? pri : rest).push(r);
  }
  // 수도권 안에서도 서울→인천→경기 순
  pri.sort((a, b) => PRIORITY.indexOf(a.area) - PRIORITY.indexOf(b.area));
  return [...pri, ...rest];
}

async function main() {
  const restaurants = readCache("restaurants.json", { restaurants: [] }).restaurants;
  const store = readCache(OUT, { generatedAt: null, intro: {} });
  store.intro ||= {};

  const areaFilter = (process.env.RIN_AREAS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const targets = orderTargets(restaurants, store.intro, areaFilter);
  const batch = targets.slice(0, DAILY);
  console.log(`\n🍽️🧭 음식점 방문정보(detailIntro2) 수집 — 미수집 ${targets.length} · 이번 실행 ${batch.length} (상한 ${DAILY})`);

  const budget = createBudget(DAILY);
  let ok = 0, empty = 0, fail = 0;
  for (const r of batch) {
    try {
      const raw = await detailIntroRaw(r.id, CT, budget);
      const norm = normalizeIntro(CT, raw || {});
      norm.type = CT;
      store.intro[r.id] = norm;
      if (Object.keys(norm).filter((k) => k !== "type").length) ok++; else empty++;
    } catch (e) {
      if (e instanceof QuotaError) { console.log(`\n⛔ ${e.message} — 진행분 저장 후 중단`); break; }
      fail++;
      if (fail <= 5) console.log(`  · ${r.title} 실패: ${e.message}`);
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
  console.log(`   누적: ${total}곳 (필드 있음 ${withData} = ${((withData / total) * 100 || 0).toFixed(1)}%) · 남은 대상 ${Math.max(0, targets.length - batch.length)}\n`);
}

main().catch((e) => { console.error("❌ 실패:", e.message); process.exit(1); });
