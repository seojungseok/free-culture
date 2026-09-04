// 전국 관광지 중 반려동물 동반 상세정보가 확인되는 장소를 일일 한도 안에서 누적 수집.
import { readCache, writeCache, createBudget, QuotaError, detailPetTourRaw, sleep, hasKey, cleanText } from "./lib/tourClient.mjs";

if (!hasKey()) { console.error("TourAPI 키가 없습니다."); process.exit(1); }
const DAILY = Number(process.env.PET_DAILY || 800);
const places = readCache("places.json", { spots: [] }).spots || [];
const store = readCache("pet-travel.json", { generatedAt: null, places: {} });
store.places ||= {};
const todo = places.filter((p) => !(p.id in store.places)).slice(0, DAILY);
const budget = createBudget(DAILY);
let ok = 0, empty = 0, fail = 0;
for (const p of todo) {
  try {
    const raw = await detailPetTourRaw(p.id, budget);
    const values = Object.fromEntries(Object.entries(raw || {}).map(([k, v]) => [k, cleanText(v)]).filter(([, v]) => v));
    const petText = Object.entries(values).filter(([k]) => /pet|animal|dog|cat|반려|동물|acmpy|rela/i.test(k)).map(([k, v]) => `${k}=${v}`).join(" · ");
    if (!petText) { empty++; continue; }
    store.places[p.id] = { ...p, petInfo: petText, petRaw: values, updatedAt: new Date().toISOString() };
    ok++;
  } catch (e) {
    if (e instanceof QuotaError) break;
    fail++;
  }
  await sleep(220);
}
store.generatedAt = new Date().toISOString();
writeCache("pet-travel.json", store);
console.log(`반려동물 전국 수집: 신규 ${ok} · 해당없음 ${empty} · 실패 ${fail} · API콜 ${budget.used} · 누적 ${Object.keys(store.places).length}`);
