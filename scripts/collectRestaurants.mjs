// Legacy areaCode filters omit restaurants that only carry current legal region codes.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCache, writeCache, createBudget, areaBasedPage, tourArea, https, sleep, hasKey, safeApiError } from './lib/tourClient.mjs';
import { mergeCollectedRecord, checkedSnapshot } from './lib/collectorState.mjs';
import { loadSourceEnv } from './lib/sourceEnv.mjs';

// Keep the site's existing category URLs for equivalent current TourAPI classifications.
const categories = {
  FD010100: 'A05020100', FD010200: 'A05020100', FD020100: 'A05020400', FD020200: 'A05020300',
  FD020300: 'A05020200', FD050100: 'A05020900', FD050200: 'A05020900',
};
export async function collectRestaurants(store, { max, daily, areas = [], fetchPage = areaBasedPage, pause = sleep, now = new Date() }) {
  const checkedAt = now.toISOString(), budget = createBudget(daily);
  const byId = new Map(store.restaurants.map(row => [row.id, row]));
  const seen = new Set(), additions = new Map();
  let total = 0, failure = '';
  try {
    for (let pageNo = 1; ; pageNo++) {
      const page = await fetchPage({contentTypeId:'39', rows:1000, pageNo}, budget);
      total = page.total;
      if (!Number.isSafeInteger(total) || total < 1 || !page.items.length) throw new Error('API 응답 형식 오류');
      const before = seen.size;
      for (const item of page.items) {
        const id = String(item.contentid || ''), area = tourArea(item);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        if (!area || (areas.length && !areas.includes(area)) || !item.title?.trim()) continue;
        const previous = byId.get(id);
        if (!previous && !item.firstimage) continue;
        const record = mergeCollectedRecord(previous, {
          id, area, title:item.title.trim(), addr:String(item.addr1 || '').trim(), image:https(item.firstimage),
          mapx:String(item.mapx || ''), mapy:String(item.mapy || ''), tel:String(item.tel || '').trim(),
          type:'39', cat1:item.cat1 || '', cat2:item.cat2 || '',
          cat3:item.cat3 || categories[item.lclsSystm3] || previous?.cat3 || '',
          sourceModifiedAt:String(item.modifiedtime || ''),
        }, checkedAt);
        if (previous) byId.set(id, record);
        else {
          if (!additions.has(area)) additions.set(area, []);
          additions.get(area).push(record);
        }
      }
      if (seen.size >= total) break;
      if (before === seen.size || pageNo * 1000 >= total) throw new Error('API 응답 형식 오류');
      await pause(250);
    }
  } catch (error) { failure = safeApiError(error); }
  if (!seen.size) throw new Error(failure || 'API 응답 형식 오류');
  // A limited number of new URLs should still cover multiple regions.
  const groups = [...additions.values()];
  const largest = Math.max(0, ...groups.map(group => group.length));
  for (let index = 0; index < largest && byId.size < max; index++) {
    for (const group of groups) {
      if (byId.size >= max) break;
      if (group[index]) byId.set(group[index].id, group[index]);
    }
  }
  const snapshot = checkedSnapshot(store,[...byId.values()],'restaurants',{
    checkedAt,calls:budget.used,failures:failure ? 1 : 0,complete:!failure && !areas.length,
  });
  return {snapshot,total,received:seen.size,failure};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    loadSourceEnv();
    if (!hasKey()) throw new Error('공공 API 인증키 없음');
    const store = readCache('restaurants.json',{restaurants:[]});
    const result = await collectRestaurants(store,{
      max:Number(process.env.RESTO_MAX || 4000),daily:Number(process.env.RESTO_DAILY || 800),
      areas:(process.env.RESTO_AREAS || '').split(',').map(area => area.trim()).filter(Boolean),
    });
    writeCache('restaurants.json',result.snapshot);
    console.log(JSON.stringify({total:result.total,received:result.received,stored:result.snapshot.count,...result.snapshot.refresh}));
    if (result.failure) { console.error(result.failure); process.exitCode=1; }
  } catch (error) { console.error(safeApiError(error)); process.exitCode=1; }
}
