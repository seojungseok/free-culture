// 한국관광공사 TourAPI - "가볼만한 곳" 전체 수집 → data/places.json 캐시
// areaBasedList2 로 지역(areaCode) × 유형(contentTypeId) 조합을 전체 페이징 수집.
// 관광지는 상시 정보라 매 요청마다 호출하지 않고, 주 1회/수동으로만 갱신.
//
// 실행: node scripts/collectTour.mjs
// 키: TOUR_API_KEY (없으면 DATA_GO_KR_KEY 폴백)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readCache, writeCache, areaBasedPage, createBudget, tourArea, safeApiError, hasKey } from "./lib/tourClient.mjs";
import { mergeCollectedRecord, checkedSnapshot } from "./lib/collectorState.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "places.json");
if (!hasKey()) {
  console.error("❌ TOUR_API_KEY / DATA_GO_KR_KEY 없음");
  process.exit(1);
}

// areacode → 시도명 (앱의 area 값과 일치시킴)
const AREA_TO_SIDO = {
  1: "서울", 2: "인천", 3: "대전", 4: "대구", 5: "광주", 6: "부산", 7: "울산",
  8: "세종", 31: "경기", 32: "강원", 33: "충북", 34: "충남", 35: "경북",
  36: "경남", 37: "전북", 38: "전남", 39: "제주",
};
const AREA_CODES = Object.keys(AREA_TO_SIDO).map(Number);

// 나들이 성격 유형만: 12 관광지, 14 문화시설, 28 레포츠 (숙박/음식/쇼핑/행사 제외)
const CONTENT_TYPES = ["12", "14", "28"];

// 아이 친화 판별 (전체 수집 후 태깅 → /kids 필터용)
const KID_RE = /체험|박물관|과학관|미술관|동물원|식물원|수목원|아쿠아리움|테마파크|놀이공원|어린이|키즈|캠핑|천문|자연휴양림|생태|공룡|기념관/;
const isKidSpot = (it) => {
  const t = String(it.title || "");
  const type = String(it.contenttypeid || "");
  if (type === "14") return true; // 문화시설(박물관·과학관·미술관 등)은 대체로 아이 동반 OK
  return KID_RE.test(t);
};

const https = (u) => String(u || "").replace(/^http:\/\//i, "https://");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`\n🗺️  TourAPI 가볼만한 곳 전체 수집 (지역 ${AREA_CODES.length} × 유형 ${CONTENT_TYPES.length})\n`);
  const previous = readCache("places.json", { spots: [] });
  const byId = new Map((previous.spots || []).map((spot) => [spot.id, spot]));
  const budget = createBudget(Number(process.env.TOUR_LIST_BUDGET || 120));
  const checkedAt = new Date().toISOString();
  const checkedIds = new Set();
  const rows = 1000;
  let failures = 0;

  for (const area of AREA_CODES) {
    const sido = AREA_TO_SIDO[area];
    let areaAdded = 0;
    for (const type of CONTENT_TYPES) {
      let page = 1;
      let total = Infinity;
      while ((page - 1) * rows < total) {
        try {
          const response = await areaBasedPage({ contentTypeId: type, areaCode: area, pageNo: page, rows }, budget);
          total = response.total;
          const items = response.items;
          if (total > 0 && !items.length) throw new Error("API 응답 형식 오류");
          for (const it of items) {
            const id = String(it.contentid || "");
            if (!id || !String(it.title || "").trim()) continue;
            if (!it.firstimage && !byId.has(id)) continue;
            byId.set(id, mergeCollectedRecord(byId.get(id), {
              id,
              title: String(it.title || "").trim(),
              addr: String(it.addr1 || "").trim(),
              area: tourArea(it, sido),
              image: https(it.firstimage),
              mapx: String(it.mapx || ""),
              mapy: String(it.mapy || ""),
              tel: String(it.tel || "").trim(),
              type,
              cat1: String(it.cat1 || ""),
              cat2: String(it.cat2 || ""),
              cat3: String(it.cat3 || ""),
              isKid: isKidSpot(it),
              sourceModifiedAt: String(it.modifiedtime || ""),
            }, checkedAt));
            checkedIds.add(id);
            areaAdded++;
          }
          if (items.length === 0) break;
          page++;
          await sleep(250);
        } catch (e) {
          failures++;
          console.warn(`  ${sido} type${type} p${page} 갱신 보류: ${safeApiError(e)}`);
          break;
        }
      }
      if (budget.stopped) break;
    }
    console.log(`  ${sido.padEnd(3)} 실제 확인 ${areaAdded.toString().padStart(4)}건 (저장 ${byId.size})`);
    if (budget.stopped) break;
  }

  if (!checkedIds.size) throw new Error("장소 확인 0건 — 기존 스냅샷 유지");
  const spots = [...byId.values()];
  const byArea = {};
  const byType = {};
  let kidN = 0;
  for (const s of spots) {
    byArea[s.area] = (byArea[s.area] || 0) + 1;
    byType[s.type] = (byType[s.type] || 0) + 1;
    if (s.isKid) kidN++;
  }

  const complete = failures === 0 && !budget.stopped;
  writeCache("places.json", checkedSnapshot(previous, spots, "spots", { checkedAt, calls: budget.used, failures, complete }));

  const sizeMB = (fs.statSync(OUT).size / 1048576).toFixed(2);
  console.log(`\n💾 저장: data/places.json (${spots.length}곳, ${sizeMB}MB, TourAPI ${budget.used}콜 · 확인 ${checkedIds.size}곳 · 전체완료 ${complete})`);
  console.log(`   유형: 관광지 ${byType["12"] || 0} · 문화시설 ${byType["14"] || 0} · 레포츠 ${byType["28"] || 0} | 아이친화 ${kidN}`);
  console.log(`   지역: ${Object.entries(byArea).sort((a, b) => b[1] - a[1]).map(([a, n]) => `${a} ${n}`).join(" · ")}\n`);
  if (!complete) process.exitCode = 1;
}

main().catch((e) => {
  console.error("\n❌ 수집 실패:", safeApiError(e));
  process.exit(1);
});
