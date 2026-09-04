// 전국 관광지 중 반려동물 동반 상세정보가 확인되는 장소를 일일 한도 안에서 누적 수집.
import { readCache, writeCache, createBudget, QuotaError, petAreaBasedPage, sleep, hasKey, cleanText, AREA_CODES } from "./lib/tourClient.mjs";

if (!hasKey()) { console.error("TourAPI 키가 없습니다."); process.exit(1); }
const DAILY = Number(process.env.PET_DAILY || 800);
const store = readCache("pet-travel.json", { generatedAt: null, places: {} });
store.places ||= {};
const budget = createBudget(DAILY);
let ok = 0, fail = 0;
for (const areaCode of AREA_CODES) {
  try {
    const first = await petAreaBasedPage({ areaCode, pageNo: 1, rows: 1000 }, budget);
    const pages = Math.max(1, Math.ceil(first.total / 1000));
    for (let pageNo = 1; pageNo <= pages; pageNo++) {
      const page = pageNo === 1 ? first : await petAreaBasedPage({ areaCode, pageNo, rows: 1000 }, budget);
      for (const [i, item] of page.items.entries()) {
        const id = String(item.contentid || "");
        const title = cleanText(item.title);
        if (!id || !title) continue;
        const old = store.places[id] || {};
        store.places[id] = { ...old, id, title, address: cleanText(item.addr1 || item.addr2), area: AREA_TO_SIDO[areaCode] || cleanText(item.areaname), image: cleanText(item.firstimage || item.firstimage2), mapx: cleanText(item.mapx), mapy: cleanText(item.mapy), type: cleanText(item.contenttypeid), tel: cleanText(item.tel), homepage: cleanText(item.homepage), summary: cleanText(item.addr2), index: i, updatedAt: new Date().toISOString() };
        ok++;
      }
    }
  } catch (e) {
    if (e instanceof QuotaError) { console.log(`한도 도달: ${e.message}`); break; }
    fail++;
  }
  await sleep(220);
}
store.generatedAt = new Date().toISOString();
writeCache("pet-travel.json", store);
console.log(`반려동물 전국 기본 수집: 처리 ${ok} · 실패 ${fail} · API콜 ${budget.used} · 누적 ${Object.keys(store.places).length}`);
