// 지역 관광기관 축제 API를 공통 축제 캐시로 병합한다.
// 방문자 요청 시 API를 호출하지 않고 주간 동기화에서만 실행한다.
import { readCache, writeCache, loadKey, cleanText, https, safeApiError } from "./lib/tourClient.mjs";
import { mergeCollectedRecord } from "./lib/collectorState.mjs";
import { regionalRequest, regionalRefreshStatus } from './lib/regionalRequest.mjs';
import fs from 'node:fs';

const KEY = loadKey("public");
const TODAY = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10).replaceAll("-", "");
const OUT = "festivals.json";
let requests = 0;
const value = (obj, ...keys) => {
  for (const key of keys) if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key];
  return "";
};
const clean = (v) => cleanText(v);
const ymd = (v) => {
  const s = String(v ?? "").replace(/\D/g, "");
  return s.length >= 8 ? s.slice(0, 8) : "";
};
const fromEpoch = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 100000000000
    ? new Date(n).toISOString().slice(0, 10).replaceAll("-", "") : "";
};
const dateRange = (v) => {
  const dates = clean(v).match(/\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}/g) || [];
  return { start: dates[0] ? ymd(dates[0]) : "", end: dates[1] ? ymd(dates[1]) : ymd(dates[0]) };
};
const list = (value) => Array.isArray(value) ? value : value ? [value] : [];
const decodedKey = () => { try { return decodeURIComponent(KEY); } catch { return KEY; } };
const query = (params) => new URLSearchParams({ ...params, serviceKey: decodedKey() }).toString();
async function getJson(url, params) {
  return regionalRequest(url + '?' + query(params), {onAttempt:()=>requests++});
}
async function getXml(url, params) {
  return getJson(url, params);
}
function event({ id, title, addr, area, image, mapx = "", mapy = "", tel = "", startDate, endDate, source, description = "", place = "", homepage = "" }) {
  const start = ymd(startDate);
  const end = ymd(endDate) || start;
  if (!title || !start || !end || end < TODAY) return null;
  return { id: String(id), title, addr, area, image: https(image), mapx: String(mapx || ""), mapy: String(mapy || ""), tel, startDate: start, endDate: end, source, description: clean(description), place: clean(place), homepage: https(homepage) };
}

async function busan() {
  const j = await getJson("https://apis.data.go.kr/6260000/FestivalService/getFestivalKr", { pageNo: 1, numOfRows: 1000, resultType: "json" });
  const body = j?.getFestivalKr?.body || j?.response?.body || j?.getFestivalKr || {};
  // 부산 API는 body/items가 아닌 getFestivalKr.item으로 바로 내려온다.
  const rows = body?.items?.item || body?.items || body?.item || body?.data || j?.getFestivalKr?.item;
  return list(rows).map((it) => {
    const range = dateRange(value(it, "USAGE_DAY_WEEK_AND_TIME", "USAGE_DAY"));
    return event({ id: "busan-" + value(it, "UC_SEQ"), title: clean(value(it, "MAIN_TITLE", "TITLE")),
      addr: clean(value(it, "ADDR1")) || `부산광역시 ${clean(value(it, "GUGUN_NM"))}`.trim(), area: "부산",
      image: value(it, "MAIN_IMG_NORMAL", "MAIN_IMG_THUMB"), mapx: value(it, "LNG"), mapy: value(it, "LAT"),
      tel: clean(value(it, "CNTCT_TEL")), startDate: range.start, endDate: range.end,
      description: value(it, "ITEMCNTNTS", "DESCRIPTION", "CONTENTS"), place: value(it, "MAIN_PLACE", "PLACE", "GUGUN_NM"), homepage: value(it, "HOMEPAGE_URL", "HOMEPAGE"), source: "부산광역시 부산축제정보" });
  }).filter(Boolean);
}
async function gyeongju() {
  const j = await getJson("https://apis.data.go.kr/5050000/festivalStatusService/getFestivalStatus", { pageNo: 1, numOfRows: 1000, type: "json" });
  const body = j?.response?.body || j?.getFestivalStatus?.body || {};
  const rows = body?.items?.item || body?.items || body?.item;
  return list(rows).map((it) => event({
    id: "gyeongju-" + value(it, "FSTVL_NM") + "-" + value(it, "BGNG_YMD"), title: clean(value(it, "FSTVL_NM")),
    addr: clean(value(it, "ADRES")), area: "경북", image: "", tel: clean(value(it, "TELNO")),
    startDate: fromEpoch(value(it, "BGNG_YMD")) || ymd(value(it, "BGNG_YMD")), endDate: fromEpoch(value(it, "END_YMD")) || ymd(value(it, "END_YMD")), place: value(it, "FSTVL_PLACE", "PLACE"), source: "경주시 축제 현황",
  })).filter(Boolean);
}
async function ulsan() {
  const j = await getXml("https://apis.data.go.kr/6310000/ulsanfestival/getUlsanfestivalList", { pageNo: 1, numOfRows: 1000 });
  const body = j?.rfcOpenApi?.body || j?.response?.body || j?.body || {};
  const rows = body?.data?.list || body?.data?.item || body?.item;
  return list(rows).map((it) => event({
    id: "ulsan-" + value(it, "unqId"), title: clean(value(it, "title")), addr: clean(value(it, "roadNmAddr")),
    area: "울산", image: value(it, "mainImg", "imgUrl"), mapx: value(it, "lot"), mapy: value(it, "lat"), tel: clean(value(it, "rprsTelno")),
    startDate: value(it, "fstvlBgngYmd"), endDate: value(it, "fstvlEndYmd"), description: value(it, "cn", "fstvlCn", "contents", "description"), place: value(it, "plc", "fstvlPlace", "place"), homepage: value(it, "hmpgAddr"), source: "울산광역시 문화축제",
  })).filter(Boolean);
}
async function jeonnam() {
  const j = await getXml("https://apis.data.go.kr/6460000/rest/jnFestivalInfo/getFestivalInfoList", { pageNo: 1, numOfRows: 1000 });
  const body = j?.response?.body || {};
  const rows = body?.items?.item || body?.items || body?.item;
  return list(rows).map((it) => event({
    id: "jeonnam-" + value(it, "fastivalId", "festivalId"), title: clean(value(it, "festivalNm")),
    addr: clean(value(it, "festivalPlace")), area: "전남", image: value(it, "festivalMainImgUrl"),
    tel: clean(value(it, "festivalTel")), startDate: value(it, "festivalStartDay"), endDate: value(it, "festivalEndDay"), description: value(it, "festivalContent", "festivalContents"), place: value(it, "festivalPlace"), homepage: value(it, "festivalHomepage"),
    source: "남도여행길잡이 축제정보",
  })).filter(Boolean);
}
async function main() {
  if (!KEY) throw new Error("DATA_GO_KR_KEY / TOUR_API_KEY 없음");
  const checkedAt = new Date().toISOString();
  const jobs = [["부산", busan], ["경주", gyeongju], ["울산", ulsan], ["전남", jeonnam]];
  const results = await Promise.all(jobs.map(async ([name, fn]) => {
    try { const items = await fn(); console.log(name + ": 진행·예정 " + items.length + "건"); return { name, items, success: true }; }
    catch (error) { console.warn(name + " 수집 실패: " + (error.code || safeApiError(error))); return { name, items: [], success: false, transient: error.transient === true, errorCode: error.code || 'unknown' }; }
  }));
  const store = readCache(OUT, { generatedAt: null, count: 0, festivals: [] });
  const status = regionalRefreshStatus(results, store.sourceRefresh || {});
  const map = new Map((store.festivals || []).map((item) => [item.id, item]));
  for (const result of results) for (const item of result.items) map.set(item.id, mergeCollectedRecord(map.get(item.id), item, checkedAt));
  const festivals = [...map.values()]
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  store.festivals = festivals; store.count = festivals.length;
  if (results.some(r=>r.success)) store.generatedAt = new Date().toISOString();
  store.sourceRefresh ||= {};
  for (const result of results) store.sourceRefresh[result.name] = {
    ...(store.sourceRefresh[result.name] || {}), lastAttemptAt: checkedAt,
    ...(result.success ? { checkedAt, currentRecords: result.items.length, errorCode: null } : {errorCode:result.errorCode}), success: result.success,
    status: result.success ? 'success' : result.transient && ['deferred','degraded'].includes(status) ? status : 'failure',
  };
  const failures = results.filter((result) => !result.success).length;
  store.incompleteRefresh = failures > 0;
  writeCache(OUT, store);
  console.log("저장: data/" + OUT + " (" + festivals.length + "건, API " + requests + "회, " + status + ")");
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `collector_status=${status}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '\n### 지역 축제 갱신\n' + results.map(r=>`- ${r.name}: ${r.success?'확인 완료':r.errorCode+' · 기존 자료 유지'}\n`).join(''));
  if (status==='deferred') console.warn('::warning::지역 API 일시 장애가 재시도 후에도 지속되어 갱신을 연기했습니다. 72시간 이내의 마지막 확인 자료를 유지하며 다음 예약 실행에서 재시도합니다.');
  if (status==='degraded') {
    const message='지역 축제 부분 장애: '+results.filter(r=>!r.success).map(r=>r.name).join(', ')+' 제공기관이 응답하지 않습니다. 해당 지역 최신성은 미확인이며 기존 확인시각을 유지합니다. 정상 지역만 갱신했고 다음 예약 작업에서 재시도합니다.';
    console.warn('::warning::'+message);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '\n**주의: '+message+'**\n');
  }
  console.log("대전은 현재 제공받은 경로가 라이브 응답을 반환하지 않아 임의 행사 생성을 하지 않았습니다.");
  if (status==='failure') process.exitCode = 1;
}
main().catch((error) => { console.error(`지역 축제 갱신 실패: ${safeApiError(error)}`); process.exit(1); });
