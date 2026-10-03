// 축제 기본 목록에 TourAPI 상세 소개·프로그램·사진을 매일 조금씩 누적한다.
// 목록 API가 가진 일정·장소 정보는 유지하고, 상세 페이지에 필요한 정보만 덧붙인다.
import {
  readCache, writeCache, createBudget, QuotaError, detailCommon, detailIntroRaw,
  detailInfoRaw, detailImageListRaw, normalizeIntro, normalizeInfo, sleep, hasKey,
  cleanText, https, safeApiError,
} from "./lib/tourClient.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RECHECK_MS = 7 * 86400000;
function checkTime(value, nowMs) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp <= nowMs && new Date(timestamp).toISOString().slice(0, 19) === value.slice(0, 19) ? timestamp : null;
}
function lastCheck(festival, nowMs) {
  return checkTime(festival.detailCheckedAt, nowMs) ?? checkTime(festival.enrichedAt, nowMs);
}
function compactDate(value) {
  if (typeof value !== "string" || !/^\d{8}$/.test(value)) return "";
  const iso = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T00:00:00.000Z`;
  const timestamp = Date.parse(iso);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === iso ? value : "";
}
export function selectFestivalDetails(festivals, { count = 20, nowMs = Date.now() } = {}) {
  const today = new Date(nowMs + 9 * 3600000).toISOString().slice(0, 10).replaceAll("-", "");
  return [...festivals]
    .filter((festival) => !["busan-", "gyeongju-", "ulsan-", "jeonnam-"].some((prefix) => String(festival.id).startsWith(prefix)))
    .filter((festival) => !compactDate(festival.endDate) || compactDate(festival.endDate) >= today)
    .filter((festival) => { const checked = lastCheck(festival, nowMs); return checked === null || nowMs - checked >= RECHECK_MS; })
    .sort((a, b) => {
      const aTime = lastCheck(a, nowMs), bTime = lastCheck(b, nowMs);
      if ((aTime === null) !== (bTime === null)) return aTime === null ? -1 : 1;
      if (aTime !== null && bTime !== null && aTime !== bTime) return aTime - bTime;
      const aLive = compactDate(a.startDate) && a.startDate <= today && compactDate(a.endDate) >= today ? 0 : 1;
      const bLive = compactDate(b.startDate) && b.startDate <= today && compactDate(b.endDate) >= today ? 0 : 1;
      return aLive - bLive || String(a.startDate || "").localeCompare(String(b.startDate || ""));
    })
    .slice(0, count);
}

export async function collectFestivalDetails({ store, count = 20, maxRequests = Math.max(count * 5, 50),
  now = () => new Date(), pause = sleep, warn = console.warn,
  fetchCommon = detailCommon, fetchIntro = detailIntroRaw, fetchInfo = detailInfoRaw, fetchImages = detailImageListRaw }) {
  const targets = selectFestivalDetails(store.festivals || [], { count, nowMs: now().getTime() });
  const budget = createBudget(maxRequests);
  let done = 0, empty = 0, failed = 0, deferred = 0, stopReason = null;

  for (const festival of targets) {
    try {
      // Wait for all attempted requests so a provider deferral cannot mask another real failure.
      const responses = await Promise.allSettled([
        fetchCommon(festival.id, budget),
        fetchIntro(festival.id, "15", budget),
        fetchInfo(festival.id, "15", budget),
        fetchImages(festival.id, "15", budget),
      ]);
      const errors = responses.filter((response) => response.status === "rejected").map((response) => response.reason);
      if (errors.length) {
        const provider = errors.some((error) => error instanceof QuotaError && error.reason === "provider");
        if (provider) deferred++;
        if (errors.some((error) => !(error instanceof QuotaError) || error.reason !== "provider")) failed++;
        for (const error of errors) warn(`축제 상세 조회 보류: ${safeApiError(error)}`);
        const quota = errors.find((error) => error instanceof QuotaError && error.reason === "local")
          || errors.find((error) => error instanceof QuotaError);
        if (quota) { stopReason = quota.reason; break; }
        continue;
      }
      const [common, introRaw, infoRaw, imageRaw] = responses.map((response) => response.value);
      const intro = normalizeIntro("15", introRaw);
      const images = imageRaw.map((item) => https(cleanText(item.originimgurl || item.smallimageurl))).filter(Boolean);
      const info = normalizeInfo(infoRaw).slice(0, 12);
      const checkedAt = now().toISOString();
      // This confirms a successful response, not the existence or freshness of editorial facts.
      festival.detailCheckedAt = checkedAt;
      if (!common.overview && !common.homepage && !common.tel && !Object.keys(intro).length && !info.length && !images.length) {
        empty++; warn("축제 상세 정상 응답 0건 — 기존 내용 보존, 7일 후 재확인"); continue;
      }
      Object.assign(festival, {
        description: common.overview || festival.description || "",
        homepage: common.homepage || festival.homepage || "",
        tel: common.tel || festival.tel || "",
        place: intro.eventplace || festival.place || "",
        intro: { ...(festival.intro || {}), ...intro },
        info: info.length ? info : festival.info || [],
        images: [...new Set([festival.image, ...images, ...(festival.images || [])].filter(Boolean))].slice(0, 8),
        enrichedAt: checkedAt,
      });
      if (!festival.image && festival.images?.[0]) festival.image = festival.images[0];
      done++;
    } catch (error) {
      if (error instanceof QuotaError && error.reason === "provider") deferred++;
      else failed++;
      warn(`축제 상세 조회 실패: ${safeApiError(error)}`);
      if (error instanceof QuotaError) { stopReason = error.reason; break; }
    } finally {
      await pause(220);
    }
  }

  if (done) {
    store.count = (store.festivals || []).length;
    store.generatedAt = now().toISOString();
  }
  const incomplete = failed > 0 || deferred > 0 || budget.stopped;
  const exitCode = failed || (budget.stopped && stopReason !== "provider") ? 1 : deferred ? 75 : 0;
  return { requested: targets.length, completed: done, empty, checked: done + empty,
    failures: failed, deferred, stopReason, requests: budget.used, incomplete, exitCode };
}

async function main() {
  if (!hasKey()) throw new Error("공공 API 인증키 없음");
  const count = Number(process.env.FESTIVAL_ENRICH_DAILY || 20);
  const store = readCache("festivals.json", { generatedAt: null, count: 0, festivals: [] });
  const result = await collectFestivalDetails({ store, count, maxRequests: Number(process.env.FESTIVAL_ENRICH_BUDGET || Math.max(count * 5, 50)) });
  if (result.checked) writeCache("festivals.json", store);
  console.log(`축제 상세 보강: 완료 ${result.completed} · 정상 빈 응답 ${result.empty} · 실패 ${result.failures} · 연기 ${result.deferred} · API콜 ${result.requests} · 누적 ${store.count}건`);
  console.log(JSON.stringify(result));
  process.exitCode = result.exitCode;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(safeApiError(error)); process.exitCode = 1; });
}
