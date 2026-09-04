// 축제 기본 목록에 TourAPI 상세 소개·프로그램·사진을 매일 조금씩 누적한다.
// 목록 API가 가진 일정·장소 정보는 유지하고, 상세 페이지에 필요한 정보만 덧붙인다.
import {
  readCache, writeCache, createBudget, QuotaError, detailCommon, detailIntroRaw,
  detailInfoRaw, detailImageListRaw, normalizeIntro, normalizeInfo, sleep, hasKey,
  cleanText, https,
} from "./lib/tourClient.mjs";

if (!hasKey()) { console.error("TourAPI 키가 없습니다."); process.exit(1); }

const count = Number(process.env.FESTIVAL_ENRICH_DAILY || 20);
const store = readCache("festivals.json", { generatedAt: null, count: 0, festivals: [] });
const today = new Date().toISOString().slice(0, 10).replaceAll("-", "");
const targets = [...(store.festivals || [])]
  .filter((festival) => !String(festival.id).startsWith("busan-") && !String(festival.id).startsWith("gyeongju-") && !String(festival.id).startsWith("ulsan-") && !String(festival.id).startsWith("jeonnam-"))
  .filter((festival) => !festival.enrichedAt)
  .sort((a, b) => {
    const aLive = a.startDate <= today && a.endDate >= today ? 0 : 1;
    const bLive = b.startDate <= today && b.endDate >= today ? 0 : 1;
    return aLive - bLive || a.startDate.localeCompare(b.startDate);
  })
  .slice(0, count);
const budget = createBudget(Math.max(count * 5, 50));
let done = 0;
let failed = 0;

for (const festival of targets) {
  try {
    const [common, introRaw, infoRaw, imageRaw] = await Promise.all([
      detailCommon(festival.id, budget),
      detailIntroRaw(festival.id, "15", budget),
      detailInfoRaw(festival.id, "15", budget),
      detailImageListRaw(festival.id, "15", budget),
    ]);
    const intro = normalizeIntro("15", introRaw);
    const images = imageRaw.map((item) => https(cleanText(item.originimgurl || item.smallimageurl))).filter(Boolean);
    Object.assign(festival, {
      description: common.overview || festival.description || "",
      homepage: common.homepage || festival.homepage || "",
      tel: common.tel || festival.tel || "",
      place: intro.eventplace || festival.place || "",
      intro,
      info: normalizeInfo(infoRaw).slice(0, 12),
      images: [...new Set([festival.image, ...images].filter(Boolean))].slice(0, 8),
      enrichedAt: new Date().toISOString(),
    });
    if (!festival.image && festival.images?.[0]) festival.image = festival.images[0];
    done++;
  } catch (error) {
    if (error instanceof QuotaError) break;
    failed++;
    console.warn(`상세 조회 실패 (${festival.title}): ${error instanceof Error ? error.message : String(error)}`);
  }
  await sleep(220);
}

store.count = (store.festivals || []).length;
store.generatedAt = new Date().toISOString();
writeCache("festivals.json", store);
console.log(`축제 상세 보강: 완료 ${done} · 실패 ${failed} · API콜 ${budget.used} · 누적 ${store.count}건`);
