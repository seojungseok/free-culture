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
  AREA_TO_SIDO, AREA_CODES, https, cleanText, sleep, hasKey,
} from "./lib/tourClient.mjs";

if (!hasKey()) { console.error("❌ TOUR_API_KEY / DATA_GO_KR_KEY 없음"); process.exit(1); }

const OUT = "festivals.json";
const CHUSEOK_OUT = "chuseok.json";
const CHUSEOK_START = "20260901";
const CHUSEOK_END = "20260930";
const DAILY = Number(process.env.FEST_DAILY || 300);
const ymd = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
// 오늘 진행 중인 축제도 포함하려면 넉넉히 과거(약 2개월 전)부터 조회 후 종료일로 필터
const FROM = process.env.FEST_FROM || ymd(new Date(Date.now() - 60 * 86400000));
const norm = (s) => cleanText(s).replace(/[\s()［］\[\]<>·,.'"~!-]/g, "").toLowerCase();

async function main() {
  // 기존 문화행사 제목 집합(중복 제거용)
  const evRaw = readCache("events.json", []);
  const events = Array.isArray(evRaw) ? evRaw : evRaw.events || [];
  const existing = new Set(events.map((e) => norm(e.title)));
  console.log(`\n🎪 축제 수집 — 기준일 ${FROM} 이후 · 기존 문화행사 ${events.length}건과 중복 제거`);

  const today = ymd(new Date());
  const store = readCache(OUT, { generatedAt: null, count: 0, festivals: [] });
  const byId = new Map(store.festivals.map((f) => [f.id, f]));
  const budget = createBudget(DAILY);
  let added = 0, dupSkip = 0, endedSkip = 0;

  try {
    for (const area of AREA_CODES) {
      const sido = AREA_TO_SIDO[area];
      let page = 1, total = Infinity, areaAdded = 0;
      while ((page - 1) * 100 < total) {
        const { total: t, items } = await festivalPage({ eventStartDate: FROM, areaCode: area, pageNo: page, rows: 100 }, budget);
        total = t;
        for (const it of items) {
          const id = String(it.contentid || "");
          if (!id || byId.has(id)) continue;
          const start = String(it.eventstartdate || "").trim();
          const end = String(it.eventenddate || "").trim();
          if (!start || !end) continue;         // 시작일·종료일 필수
          if (end < today) { endedSkip++; continue; } // 이미 종료된 축제 제외
          if (existing.has(norm(it.title))) { dupSkip++; continue; } // 문화행사와 중복
          byId.set(id, {
            id,
            title: String(it.title || "").trim(),
            addr: String(it.addr1 || "").trim(),
            area: sido,
            image: https(it.firstimage || ""),
            mapx: String(it.mapx || ""),
            mapy: String(it.mapy || ""),
            tel: String(it.tel || "").trim(),
            startDate: start,
            endDate: end,
            type: "15",
          });
          areaAdded++; added++;
        }
        if (items.length === 0) break;
        page++;
        await sleep(220);
      }
      console.log(`  ${sido.padEnd(3)} 신규 ${String(areaAdded).padStart(3)} (누적 ${byId.size})`);
    }
  } catch (e) {
    if (e instanceof QuotaError) console.log(`\n⛔ ${e.message} — 진행분 저장 후 중단`);
    else throw e;
  }

  const festivals = [...byId.values()].sort((a, b) => a.startDate.localeCompare(b.startDate));
  store.festivals = festivals;
  store.count = festivals.length;
  store.generatedAt = new Date().toISOString();
  const mb = writeCache(OUT, store);
  const withImg = festivals.filter((f) => f.image).length;
  console.log(`\n💾 저장: data/${OUT} (${festivals.length}건, ${mb}MB, API콜 ${budget.used})`);
  console.log(`   이번 신규 ${added} · 사진有 ${withImg} · 중복제외 ${dupSkip} · 종료제외 ${endedSkip}`);

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

main().catch((e) => { console.error("❌ 실패:", e.message); process.exit(1); });
