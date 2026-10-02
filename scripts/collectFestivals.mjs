// 2-4. 축제(contentTypeId=15) 수집 — searchFestival2 로 지역별, 진행/예정만.
//  · searchFestival2 응답에 eventstartdate/eventenddate 포함 → 시작일·종료일 필수 확보
//  · 기존 문화행사(data/events.json)와 제목+지역 기준 중복 제거
//  → data/festivals.json 저장. 규모가 작아(≈900) 대개 1회로 완주.
//
// 실행:
//   node scripts/collectFestivals.mjs
//   FEST_FROM=20260701 node scripts/collectFestivals.mjs   # 시작일 기준일 지정

import {
  readCache, writeCache, createBudget, QuotaError, festivalPage,
  tourArea, https, cleanText, sleep, hasKey, safeApiError,
} from "./lib/tourClient.mjs";
import { mergeCollectedRecord, checkedSnapshot } from "./lib/collectorState.mjs";

if (!hasKey()) { console.error("❌ TOUR_API_KEY / DATA_GO_KR_KEY 없음"); process.exit(1); }

const OUT = "festivals.json";
const CHUSEOK_OUT = "chuseok.json";
const CHUSEOK_START = "20260901";
const CHUSEOK_END = "20260930";
const DAILY = Number(process.env.FEST_DAILY || 300);
const ymd = (d) => new Date(d.getTime() + 9 * 3600000).toISOString().slice(0, 10).replaceAll("-", "");
// 오늘 진행 중인 축제도 포함하려면 넉넉히 과거(약 2개월 전)부터 조회 후 종료일로 필터
const FROM = process.env.FEST_FROM || ymd(new Date(Date.now() - 60 * 86400000));
const norm = (s) => cleanText(s).replace(/[\s()［］\[\]<>·,.'"~!-]/g, "").toLowerCase();

async function main() {
  // 기존 문화행사 제목 집합(중복 제거용)
  const evRaw = readCache("events.json", []);
  const events = Array.isArray(evRaw) ? evRaw : evRaw.events || [];
  const existing = new Set(events.map((e) => `${norm(e.title)}|${e.area}`));
  console.log(`\n🎪 축제 수집 — 기준일 ${FROM} 이후 · 기존 문화행사 ${events.length}건과 중복 제거`);

  const today = ymd(new Date());
  const store = readCache(OUT, { generatedAt: null, count: 0, festivals: [] });
  const byId = new Map(store.festivals.map((f) => [f.id, f]));
  const budget = createBudget(DAILY);
  const checkedAt = new Date().toISOString();
  let added = 0, dupSkip = 0, endedSkip = 0, received = 0, failures = 0, complete = false;

  try {
      // Observed 2026-10-03: legacy areaCode filters return 0 while the same
      // national request returns hundreds. Read national pages and map the
      // response's legal/legacy region codes instead of silently losing them.
      let page = 1, total = Infinity;
      while ((page - 1) * 100 < total) {
        const { total: t, items } = await festivalPage({ eventStartDate: FROM, pageNo: page, rows: 100 }, budget);
        total = t;
        if (total > 0 && !items.length) throw new Error("API 응답 형식 오류");
        received += items.length;
        for (const it of items) {
          const id = String(it.contentid || "");
          const area = tourArea(it);
          if (!id || !area || !cleanText(it.title)) continue;
          const start = String(it.eventstartdate || "").trim();
          const end = String(it.eventenddate || "").trim();
          if (!/^\d{8}$/.test(start) || !/^\d{8}$/.test(end)) continue;
          const previous = byId.get(id);
          if (!previous && end < today) { endedSkip++; continue; }
          if (!previous && existing.has(`${norm(it.title)}|${area}`)) { dupSkip++; continue; }
          byId.set(id, mergeCollectedRecord(previous, {
            id,
            title: String(it.title || "").trim(),
            addr: String(it.addr1 || "").trim(),
            area,
            image: https(it.firstimage || ""),
            mapx: String(it.mapx || ""),
            mapy: String(it.mapy || ""),
            tel: String(it.tel || "").trim(),
            startDate: start,
            endDate: end,
            type: "15",
            source: "한국관광공사 국문 관광정보",
            sourceModifiedAt: String(it.modifiedtime || ""),
          }, checkedAt));
          if (!previous) added++;
        }
        if (items.length === 0) break;
        page++;
        await sleep(220);
      }
      complete = received >= total && total > 0;
  } catch (e) {
    failures++;
    console.warn(`축제 갱신 보류: ${safeApiError(e)} — 기존 ID와 확인된 진행분 보존`);
  }
  if (!received) throw new Error("전국 축제 확인 0건 — 기존 스냅샷 유지");

  const festivals = [...byId.values()].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const mb = writeCache(OUT, checkedSnapshot(store, festivals, "festivals", { checkedAt, calls: budget.used, failures, complete }));
  const withImg = festivals.filter((f) => f.image).length;
  console.log(`\n💾 저장: data/${OUT} (${festivals.length}건, ${mb}MB, API콜 ${budget.used})`);
  console.log(`   이번 신규 ${added} · 사진有 ${withImg} · 중복제외 ${dupSkip} · 종료제외 ${endedSkip}`);
  console.log(`   원본 응답 ${received} · 전체완료 ${complete} · 기존 URL 보존`);
  if (!complete) process.exitCode = 1;

  // 공식 축제 수집 결과 중 추석 관련 행사만 특별관에 동기화한다. AI 생성이나
  // 제목 조합은 사용하지 않고, 공식 데이터의 날짜와 행사명만 기준으로 삼는다.
  const previousChuseok = readCache(CHUSEOK_OUT, { events: [] });
  const manualEvents = (Array.isArray(previousChuseok) ? previousChuseok : previousChuseok.events || [])
    .filter((event) => String(event.id || "").startsWith("chuseok-"));
  const chuseokTitle = /추석|한가위|명절|달빛마당/i;
  const officialEvents = festivals
    .filter((festival) => festival.startDate <= CHUSEOK_END && festival.endDate >= CHUSEOK_START)
    .filter((festival) => chuseokTitle.test(festival.title))
    .map((festival) => {
      const address = festival.addr || "";
      const addressParts = address.split(/\s+/).filter(Boolean);
      return {
        id: `festival-${festival.id}`,
        title: festival.title,
        area: festival.area,
        sigungu: addressParts[1] || "",
        place: addressParts.slice(2).join(" ") || festival.title,
        address,
        startDate: festival.startDate,
        endDate: festival.endDate,
        description: "공식 축제 데이터로 확인된 행사입니다.",
        image: festival.image || "",
        officialUrl: "",
        isFree: false,
        isNight: /야간|달빛|밤/.test(festival.title),
        isKids: /아이|어린이|가족|체험/.test(festival.title),
        isTraditional: /추석|한가위|전통|민속/.test(festival.title),
        lat: festival.mapy || "",
        lng: festival.mapx || "",
      };
    });
  const chuseokByTitle = new Map();
  for (const event of manualEvents) chuseokByTitle.set(norm(event.title), event);
  for (const event of officialEvents) chuseokByTitle.set(norm(event.title), event);
  writeCache(CHUSEOK_OUT, {
    generatedAt: new Date().toISOString(),
    events: [...chuseokByTitle.values()].sort((a, b) => a.startDate.localeCompare(b.startDate)),
  });
  console.log(`   추석 특별관 동기화: ${chuseokByTitle.size}건 (공식 ${officialEvents.length}건 · 검증 보존 ${manualEvents.length}건)`);
}

main().catch((e) => { console.error("❌ 실패:", safeApiError(e)); process.exit(1); });
