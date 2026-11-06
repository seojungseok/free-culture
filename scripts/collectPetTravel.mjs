// 전국 관광지 중 반려동물 동반 상세정보가 확인되는 장소를 일일 한도 안에서 누적 수집.
import { readCache, writeCache, createBudget, QuotaError, petAreaBasedPage, sleep, hasKey, cleanText, AREA_CODES, AREA_TO_SIDO, safeApiError } from "./lib/tourClient.mjs";

if (!hasKey('pet')) { console.error("반려동물 관광 API 키가 없습니다."); process.exit(1); }
const DAILY = Number(process.env.PET_DAILY || 800);
const store = readCache("pet-travel.json", { generatedAt: null, places: {} });
store.places ||= {};
const budget = createBudget(DAILY);
let ok = 0, fail = 0, successfulPages = 0, deferred = false;
for (const areaCode of AREA_CODES) {
  try {
    const first = await petAreaBasedPage({ areaCode, pageNo: 1, rows: 1000 }, budget);
    successfulPages++;
    const pages = Math.max(1, Math.ceil(first.total / 1000));
    for (let pageNo = 1; pageNo <= pages; pageNo++) {
      const page = pageNo === 1 ? first : await petAreaBasedPage({ areaCode, pageNo, rows: 1000 }, budget);
      if (pageNo > 1) successfulPages++;
      for (const [i, item] of page.items.entries()) {
        const id = String(item.contentid || "");
        const title = cleanText(item.title);
        if (!id || !title) continue;
        const old = store.places[id] || {};
        store.places[id] = { ...old, id, title, address: cleanText(item.addr1 || item.addr2), area: AREA_TO_SIDO[areaCode] || cleanText(item.areaname), image: cleanText(item.firstimage || item.firstimage2) || old.image || '', mapx: cleanText(item.mapx), mapy: cleanText(item.mapy), type: cleanText(item.contenttypeid), tel: cleanText(item.tel) || old.tel || '', homepage: cleanText(item.homepage) || old.homepage || '', summary: old.overview || old.summary || '', index: i, updatedAt: new Date().toISOString() };
        ok++;
      }
    }
  } catch (e) {
    if (e instanceof QuotaError) { deferred = true; console.log(safeApiError(e)); break; }
    fail++;
    console.warn(`${AREA_TO_SIDO[areaCode]} 반려동물 정보: ${safeApiError(e)}`);
  }
  await sleep(220);
}
if (successfulPages) {
  store.generatedAt = new Date().toISOString();
  store.incompleteRefresh = fail > 0 || deferred;
  store.refresh = {checkedAt: store.generatedAt, successfulPages, calls: budget.used, failures: fail, complete: !store.incompleteRefresh};
  writeCache("pet-travel.json", store);
} else {
  console.error('반려동물 목록 조회 실패 — 기존 자료와 마지막 확인시각 유지');
}
if (!successfulPages || fail) process.exitCode = 1;
console.log(`반려동물 전국 기본 수집: 처리 ${ok} · 실패 ${fail} · API콜 ${budget.used} · 누적 ${Object.keys(store.places).length}`);
