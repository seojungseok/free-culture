// 2-3. 음식점(contentTypeId=39) 수집 — areaBasedList2 지역별, 사진 있는 곳 우선.
//  전국 totalCount ≈ 13,744 → 사진 없는 곳 제외 + 상한(RESTO_MAX)으로 규모 조절.
//  → data/restaurants.json 에 점진 캐시(재실행 시 이어서). 일 1,000회 한도 자동 중단.
//
// 실행:
//   node scripts/collectRestaurants.mjs           # 지역별 순차, 상한까지
//   RESTO_MAX=2000 RESTO_DAILY=800 node scripts/collectRestaurants.mjs

import {
  readCache, writeCache, createBudget, QuotaError, areaBasedPage,
  AREA_TO_SIDO, AREA_CODES, https, sleep, hasKey,
} from "./lib/tourClient.mjs";

if (!hasKey()) { console.error("❌ TOUR_API_KEY / DATA_GO_KR_KEY 없음"); process.exit(1); }

const DAILY = Number(process.env.RESTO_DAILY || 800);   // 하루 API콜 상한
const MAX = Number(process.env.RESTO_MAX || 4000);      // 누적 저장 목표(사진有)
const OUT = "restaurants.json";
const CT = "39";

async function main() {
  const store = readCache(OUT, { generatedAt: null, count: 0, restaurants: [] });
  const byId = new Map(store.restaurants.map((r) => [r.id, r]));
  console.log(`\n🍽️  음식점 수집 — 기존 ${byId.size}곳 · 목표 ${MAX} · 콜 상한 ${DAILY}`);

  const budget = createBudget(DAILY);
  const totals = {};
  let added = 0;
  try {
    for (const area of AREA_CODES) {
      if (byId.size >= MAX) break;
      const sido = AREA_TO_SIDO[area];
      let page = 1, total = Infinity, areaAdded = 0;
      while ((page - 1) * 100 < total && byId.size < MAX) {
        const res = await areaBasedPage({ contentTypeId: CT, areaCode: area, pageNo: page, rows: 100 }, budget);
        const items = res.items;
        total = res.total; totals[sido] = res.total;
        for (const it of items) {
          const id = String(it.contentid || "");
          if (!id || byId.has(id)) continue;
          if (!it.firstimage) continue; // 사진 있는 곳 우선
          const r = {
            id,
            title: String(it.title || "").trim(),
            addr: String(it.addr1 || "").trim(),
            area: sido,
            image: https(it.firstimage),
            mapx: String(it.mapx || ""),
            mapy: String(it.mapy || ""),
            tel: String(it.tel || "").trim(),
            type: CT,
            cat1: String(it.cat1 || ""),
            cat2: String(it.cat2 || ""),
            cat3: String(it.cat3 || ""),
          };
          byId.set(id, r);
          areaAdded++; added++;
        }
        if (items.length === 0) break;
        page++;
        await sleep(220);
      }
      console.log(`  ${sido.padEnd(3)} 전체 ${String(totals[sido] ?? 0).padStart(5)} · 신규 ${String(areaAdded).padStart(4)} (누적 ${byId.size})`);
    }
  } catch (e) {
    if (e instanceof QuotaError) console.log(`\n⛔ ${e.message} — 진행분 저장 후 중단`);
    else throw e;
  }

  const restaurants = [...byId.values()];
  store.restaurants = restaurants;
  store.count = restaurants.length;
  store.generatedAt = new Date().toISOString();
  const mb = writeCache(OUT, store);
  const grand = Object.values(totals).reduce((a, b) => a + b, 0);
  console.log(`\n💾 저장: data/${OUT} (${restaurants.length}곳, ${mb}MB, API콜 ${budget.used})`);
  console.log(`   조회한 지역 전국합 ${grand} · 이번 신규 ${added}`);
}

main().catch((e) => { console.error("❌ 실패:", e.message); process.exit(1); });
