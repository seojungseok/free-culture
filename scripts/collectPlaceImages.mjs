// Incremental gallery cache. The request budget includes tourClient retries.
import { readCache, writeCache, detailImageListRaw, createBudget, hasKey, sleep, QuotaError, safeApiError, https } from "./lib/tourClient.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RECHECK_MS = 30 * 86400000;
const DAILY_DEFAULT = 10;
const DAILY_MAX = 30;
const requestLimit = (value) => Number.isFinite(Number(value))
  ? Math.max(1, Math.min(DAILY_MAX, Math.floor(Number(value)))) : DAILY_DEFAULT;

function actualCheckTime(value, nowMs) {
  const parts = typeof value === "string" && value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/);
  if (!parts) return null;
  const [year, month, day, hour, minute, second] = parts.slice(1).map(Number);
  const calendar = new Date(0);
  calendar.setUTCFullYear(year, month - 1, day);
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day
    || hour > 23 || minute > 59 || second > 59) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp <= nowMs ? timestamp : null;
}

function lastCheckTime(store, id, nowMs) {
  // Description checks and file-level dates say nothing about an image request.
  return actualCheckTime(store.details?.[id]?.imageCheckedAt, nowMs);
}

export function selectImageIds(items, store, { requested = [], max = DAILY_DEFAULT, nowMs = Date.now() } = {}) {
  const unique = [...new Map(items.filter((item) => item && item.id != null)
    .map((item) => [String(item.id).trim(), item])).entries()].filter(([id]) => id);
  const requestedIds = new Set(requested.map(String));
  const eligible = unique.filter(([id]) => !requestedIds.size || requestedIds.has(id))
    .filter(([id]) => { const checked = lastCheckTime(store, id, nowMs); return checked === null || nowMs - checked >= RECHECK_MS; });
  const oldestFirst = (a, b) => {
      const aTime = lastCheckTime(store, a[0], nowMs), bTime = lastCheckTime(store, b[0], nowMs);
      if ((aTime === null) !== (bTime === null)) return aTime === null ? -1 : 1;
      return aTime !== null && bTime !== null ? aTime - bTime : 0;
  };
  const places = eligible.filter(([, item]) => String(item.type) !== "39").sort(oldestFirst);
  const restaurants = eligible.filter(([, item]) => String(item.type) === "39").sort(oldestFirst);
  const ids = [], limit = requestLimit(max);
  for (let i = 0; ids.length < limit && (i < places.length || i < restaurants.length); i++) {
    if (places[i]) ids.push(places[i][0]);
    if (restaurants[i] && ids.length < limit) ids.push(restaurants[i][0]);
  }
  return ids;
}

function imageUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim());
    return /^https?:$/.test(url.protocol) ? https(url.href) : "";
  } catch { return ""; }
}

export function normalizeImages(rows) {
  if (!Array.isArray(rows)) throw new Error("API 응답 형식 오류");
  const images = [], seen = new Set();
  for (const row of rows) {
    const full = imageUrl(row?.originimgurl) || imageUrl(row?.smallimageurl);
    if (!full || seen.has(full)) continue;
    seen.add(full);
    images.push({ full, thumb: imageUrl(row?.smallimageurl) || full });
  }
  return images;
}

export async function collectImages({ items, store, requested = [], max = DAILY_DEFAULT,
  now = () => new Date(), fetchImages = detailImageListRaw, pause = sleep, warn = console.error }) {
  const limit = requestLimit(max);
  const ids = selectImageIds(items, store, { requested, max: limit, nowMs: now().getTime() });
  const itemById = new Map(items.filter((item) => item && item.id != null).map((item) => [String(item.id).trim(), item]));
  const budget = createBudget(limit);
  let retrieved = 0, empty = 0, added = 0, failures = 0, deferred = 0, attempted = 0, stopReason = null;
  for (const id of ids) {
    // Reaching the scheduled cap after a successful request is a normal partial batch.
    if (budget.used >= limit || budget.stopped) { stopReason = budget.quotaError?.reason || "local"; break; }
    attempted++;
    try {
      const images = normalizeImages(await fetchImages(id, itemById.get(id)?.type, budget));
      const checkedAt = now().toISOString();
      const previous = store.details?.[id] || {};
      const next = { ...previous, imageCheckedAt: checkedAt };
      if (!images.length) {
        empty++;
      } else {
        const existing = Array.isArray(previous.images) ? previous.images : [];
        const seen = new Set(existing.map((image) => imageUrl(image?.full)).filter(Boolean));
        const additions = images.filter((image) => {
          if (seen.has(image.full)) return false;
          seen.add(image.full); return true;
        });
        next.images = [...existing, ...additions];
        // A gallery retains older photos: never relabel their original confirmation date.
        if (!existing.length && !previous.imagesCheckedAt) next.imagesCheckedAt = checkedAt;
        added += additions.length;
        retrieved++;
      }
      store.details ||= {};
      store.details[id] = next;
    } catch (error) {
      if (error instanceof QuotaError && error.reason === "provider") deferred++;
      else failures++;
      warn(`장소 이미지 ${id}: ${safeApiError(error)}`);
      if (error instanceof QuotaError) { stopReason = error.reason; break; }
    } finally {
      await pause(250);
    }
  }
  const exitCode = failures ? 1 : deferred ? 75 : 0;
  return { requested: ids.length, attempted, retrieved, empty, added, checked: retrieved + empty,
    requests: budget.used, unprocessed: ids.length - attempted, failures, deferred, stopReason,
    incomplete: failures > 0 || deferred > 0, exitCode };
}

async function main() {
  if (!hasKey()) throw new Error("공공 API 인증키 없음");
  const max = requestLimit(process.env.PLACE_IMAGE_DAILY || DAILY_DEFAULT);
  const requested = (process.argv[2] || "").split(",").map((id) => id.trim()).filter(Boolean);
  const items = [...(readCache("places.json", { spots: [] }).spots || []),
    ...(readCache("restaurants.json", { restaurants: [] }).restaurants || [])];
  const store = readCache("place-details.json", { details: {} });
  const result = await collectImages({ items, store, requested, max });
  if (result.checked) writeCache("place-details.json", store);
  console.log(JSON.stringify(result));
  process.exitCode = result.exitCode;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(safeApiError(error)); process.exitCode = error instanceof QuotaError && error.reason === "provider" ? 75 : 1; });
}
