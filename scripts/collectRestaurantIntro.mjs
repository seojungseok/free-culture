// 음식점(contentTypeId=39) detailIntro2 수집 — 전화(문의)·영업시간·휴무·주차·대표메뉴.
//  나들이 detailIntro 로직(normalizeIntro) 재사용 — 39는 opentimefood/restdatefood/infocenterfood 등으로 매핑됨.
//  → data/restaurant-intro.json 캐시. 미수집과 30일 지난 기록을 기존 요청 예산 안에서 순환 확인.
//  수도권(서울·인천·경기) 우선. 일 1,000회 공유 한도 → RIN_DAILY(기본 300)만큼만, 며칠에 걸쳐 완주.
//
// 실행:
//   node scripts/collectRestaurantIntro.mjs              # 수도권 우선 상위 300곳(미수집)
//   RIN_DAILY=200 node scripts/collectRestaurantIntro.mjs
//   RIN_AREAS=서울,인천,경기 node scripts/collectRestaurantIntro.mjs

import {
  readCache, writeCache, createBudget, QuotaError,
  detailIntroRaw, normalizeIntro, sleep, hasKey, safeApiError,
} from "./lib/tourClient.mjs";
import { refreshQueue } from "./lib/refreshQueue.mjs";
import { loadSourceEnv } from "./lib/sourceEnv.mjs";
loadSourceEnv();

if (!hasKey()) { console.error("❌ TOUR_API_KEY / DATA_GO_KR_KEY 없음"); process.exit(1); }

const DAILY = Number(process.env.RIN_DAILY || 300);
const OUT = "restaurant-intro.json";
const CT = "39";
const PRIORITY = ["서울", "인천", "경기"]; // 수도권 먼저

// 미수집·30일 지난 영업정보를 오래된 순으로 재확인한다.
function orderTargets(restaurants, done, areaFilter, checks = {}) {
  const candidates = restaurants.filter(r => !areaFilter.length || areaFilter.includes(r.area));
  candidates.sort((a, b) => (PRIORITY.indexOf(a.area) + 1 || 4) - (PRIORITY.indexOf(b.area) + 1 || 4));
  const queue = refreshQueue(candidates, done, checks);
  return [...queue.filter(r => !done[r.id]), ...queue.filter(r => done[r.id])];
}

async function main() {
  const restaurants = readCache("restaurants.json", { restaurants: [] }).restaurants;
  const store = readCache(OUT, { generatedAt: null, intro: {} });
  store.intro ||= {};

  const areaFilter = (process.env.RIN_AREAS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const targets = orderTargets(restaurants, store.intro, areaFilter, store.successfulChecks);
  const requested = (process.argv[2] || "").split(",").map((id) => id.trim()).filter(Boolean);
  const batch = requested.length ? restaurants.filter((r) => requested.includes(r.id)).slice(0, DAILY) : targets.slice(0, DAILY);
  console.log(`\n🍽️🧭 음식점 방문정보(detailIntro2) 수집 — 미수집·재확인 ${targets.length} · 이번 실행 ${batch.length} (상한 ${DAILY})`);

  const budget = createBudget(DAILY);
  let ok = 0, empty = 0, fail = 0, retrieved = 0;
  for (const r of batch) {
    try {
      const raw = await detailIntroRaw(r.id, CT, budget);
      if (raw && (String(raw.contentid) !== r.id || String(raw.contenttypeid) !== CT)) throw new Error("API 응답 형식 오류");
      retrieved++;
      store.successfulChecks ||= {};
      store.successfulChecks[r.id] = new Date().toISOString();
      const norm = normalizeIntro(CT, raw || {});
      const previous = store.intro[r.id];
      const fields = Object.keys(norm);
      if (fields.length) {
        const changed = fields.some(key => previous?.[key] !== norm[key]);
        store.intro[r.id] = { ...previous, ...norm, type: CT, checkedAt: store.successfulChecks[r.id],
          ...(changed ? {contentUpdatedAt: store.successfulChecks[r.id]} : {}) };
        ok++;
      } else {
        store.intro[r.id] ||= {type: CT};
        empty++;
      }
    } catch (e) {
      if (e instanceof QuotaError) { console.log(safeApiError(e)); fail++; break; }
      fail++;
      if (fail <= 5) console.log(`  · ${r.id} 실패: ${safeApiError(e)}`);
    }
    await sleep(220);
  }

  if (batch.length && !retrieved) { console.error("영업정보 조회 실패 — 기존 자료 유지"); process.exitCode = 1; return; }
  if (!batch.length) return;
  store.generatedAt = new Date().toISOString();
  store.incompleteRefresh = fail > 0;
  store.refresh = {checkedAt:store.generatedAt, complete:!fail, calls:budget.used, failures:fail, checkedRecords:retrieved};
  if (fail) process.exitCode = 1;
  const mb = writeCache(OUT, store);
  const total = Object.keys(store.intro).length;
  const withData = Object.values(store.intro).filter(
    (v) => Object.keys(v).filter((k) => !["type", "checkedAt"].includes(k)).length > 0
  ).length;
  console.log(`\n💾 저장: data/${OUT} (${mb}MB)`);
  console.log(`   이번: 내용있음 ${ok} · 빈응답 ${empty} · 실패 ${fail} · API콜 ${budget.used}`);
  console.log(`   누적: ${total}곳 (필드 있음 ${withData} = ${((withData / total) * 100 || 0).toFixed(1)}%) · 남은 대상 ${Math.max(0, targets.length - batch.length)}\n`);
}

main().catch((e) => { console.error("❌ 실패:", safeApiError(e)); process.exit(1); });
