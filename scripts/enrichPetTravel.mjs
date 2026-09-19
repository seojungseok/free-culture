// 전국 기본 목록 중 하루 10곳에 상세 API 정보를 누적 보강한다.
import { readCache, writeCache, createBudget, QuotaError, petDetailCommon, petDetailIntroRaw, detailPetTourRaw, petDetailInfoRaw, petImageListRaw, sleep, hasKey, cleanText } from "./lib/tourClient.mjs";
import {petQuality} from '../lib/petContent.mjs';

if (!hasKey()) { console.error("TourAPI 키가 없습니다."); process.exit(1); }
const count = Number(process.env.PET_ENRICH_DAILY || 10);
const store = readCache("pet-travel.json", { generatedAt: null, places: {} });
// Rotate attempted records to the back, and alternate areas rather than filling one region first.
const pending = Object.values(store.places || {}).filter(p => !petQuality(p).publishable).sort((a,b)=>(a.lastAttemptAt || '').localeCompare(b.lastAttemptAt || ''));
const groups = new Map();
for (const p of pending) {if(!groups.has(p.area)) groups.set(p.area,[]); groups.get(p.area).push(p);}
const targets=[];
while(targets.length<count && [...groups.values()].some(g=>g.length)) for(const g of groups.values()) {if(g.length && targets.length<count) targets.push(g.shift());}
const budget = createBudget(Math.max(count * 5, 50));
let done = 0, failed = 0;
for (const place of targets) {
  place.lastAttemptAt = new Date().toISOString();
  try {
    const common = await petDetailCommon(place.id, budget);
    const intro = await petDetailIntroRaw(place.id, place.type, budget);
    const pet = await detailPetTourRaw(place.id, budget);
    const info = await petDetailInfoRaw(place.id, place.type, budget);
    // Photo failure must not discard successfully collected text and pet restrictions.
    let images=[];
    try {images=await petImageListRaw(place.id, place.type, budget);} catch(e) {if(e instanceof QuotaError) budget.stopped=true;}
    const cleanObject = (value) => Object.fromEntries(Object.entries(value || {}).map(([k, v]) => [k, cleanText(v)]).filter(([, v]) => v));
    const petInfo = cleanObject(pet);
    const imageUrls = images.map((x) => cleanText(x.originimgurl || x.smallimageurl)).filter(Boolean);
    store.places[place.id] = {
      ...place,
      ...common,
      summary: common.overview || place.overview || place.summary || '',
      intro: cleanObject(intro),
      petInfo: Object.entries(petInfo).map(([k, v]) => `${k}: ${v}`).join(" · "),
      petRaw: petInfo,
      info: info.map((x) => ({ name: cleanText(x.infoname || x.subname), text: cleanText(x.infotext || x.subdetailoverview) })).filter((x) => x.name || x.text),
      image: place.image || imageUrls[0] || '',
      images: [...new Set([place.image, ...imageUrls, ...(place.images || [])].filter(Boolean).map(url=>url.replace(/^http:/,'https:')))].slice(0, 8),
      enrichedAt: new Date().toISOString(),
    };
    done++;
  } catch (e) {
    if (e instanceof QuotaError) break;
    failed++;
  }
  await sleep(220);
}
store.generatedAt = new Date().toISOString();
writeCache("pet-travel.json", store);
console.log(`반려동물 상세 보강: 완료 ${done} · 실패 ${failed} · API콜 ${budget.used} · 누적 ${Object.keys(store.places || {}).length}`);
console.log(`노출 기준 통과 ${Object.values(store.places).filter(p=>petQuality(p).publishable).length}곳`);
