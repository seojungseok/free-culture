// 한국관광공사 TourAPI - "가볼만한 곳" 전체 수집 → data/places.json 캐시
// areaBasedList2 로 지역(areaCode) × 유형(contentTypeId) 조합을 전체 페이징 수집.
// 관광지는 상시 정보라 매 요청마다 호출하지 않고, 주 1회/수동으로만 갱신.
//
// 실행: node scripts/collectTour.mjs
// 키: TOUR_API_KEY (없으면 DATA_GO_KR_KEY 폴백)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "places.json");
const BASE = "https://apis.data.go.kr/B551011/KorService2";

function loadKey() {
  if (process.env.TOUR_API_KEY) return process.env.TOUR_API_KEY.trim();
  const envPath = path.join(ROOT, ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const name of ["TOUR_API_KEY", "DATA_GO_KR_KEY"]) {
      const line = lines.find((l) => l.startsWith(`${name}=`));
      const v = line ? line.slice(name.length + 1).trim() : "";
      if (v) return v;
    }
  }
  return process.env.DATA_GO_KR_KEY?.trim() || "";
}
const KEY = loadKey();
if (!KEY) {
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

const commonBase = `serviceKey=${encodeURIComponent(KEY)}&MobileOS=ETC&MobileApp=mwohaji&_type=json&numOfRows=100`;

async function fetchJson(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const code = j?.response?.header?.resultCode;
      if (code !== "0000") throw new Error(`resultCode=${code} ${j?.response?.header?.resultMsg}`);
      return j;
    } catch (e) {
      if (i === 2) throw e;
      await new Promise((r) => setTimeout(r, 700 * (i + 1)));
    }
  }
}
const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const https = (u) => String(u || "").replace(/^http:\/\//i, "https://");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`\n🗺️  TourAPI 가볼만한 곳 전체 수집 (지역 ${AREA_CODES.length} × 유형 ${CONTENT_TYPES.length})\n`);
  const byId = new Map();
  let calls = 0;

  for (const area of AREA_CODES) {
    const sido = AREA_TO_SIDO[area];
    let areaAdded = 0;
    for (const type of CONTENT_TYPES) {
      let page = 1;
      let total = Infinity;
      while ((page - 1) * 100 < total) {
        const url = `${BASE}/areaBasedList2?${commonBase}&pageNo=${page}&areaCode=${area}&contentTypeId=${type}`;
        try {
          const j = await fetchJson(url);
          calls++;
          const body = j?.response?.body;
          total = Number(body?.totalCount || 0);
          const items = arr(body?.items?.item);
          for (const it of items) {
            const id = String(it.contentid || "");
            if (!id || byId.has(id)) continue;
            if (!it.firstimage) continue; // 이미지 없는 항목 제외 (카드 품질)
            byId.set(id, {
              id,
              title: String(it.title || "").trim(),
              addr: String(it.addr1 || "").trim(),
              area: sido,
              image: https(it.firstimage),
              mapx: String(it.mapx || ""),
              mapy: String(it.mapy || ""),
              tel: String(it.tel || "").trim(),
              type,
              cat1: String(it.cat1 || ""),
              cat2: String(it.cat2 || ""),
              cat3: String(it.cat3 || ""),
              isKid: isKidSpot(it),
            });
            areaAdded++;
          }
          if (items.length === 0) break;
          page++;
          await sleep(250);
        } catch (e) {
          console.log(`  ${sido} type${type} p${page} 실패: ${e.message}`);
          break;
        }
      }
    }
    console.log(`  ${sido.padEnd(3)} 누적 신규 ${areaAdded.toString().padStart(4)}건 (전체 ${byId.size})`);
  }

  const spots = [...byId.values()];
  const byArea = {};
  const byType = {};
  let kidN = 0;
  for (const s of spots) {
    byArea[s.area] = (byArea[s.area] || 0) + 1;
    byType[s.type] = (byType[s.type] || 0) + 1;
    if (s.isKid) kidN++;
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify({ generatedAt: new Date().toISOString(), count: spots.length, spots }, null, 0)
  );

  const sizeMB = (fs.statSync(OUT).size / 1048576).toFixed(2);
  console.log(`\n💾 저장: data/places.json (${spots.length}곳, ${sizeMB}MB, TourAPI ${calls}콜)`);
  console.log(`   유형: 관광지 ${byType["12"] || 0} · 문화시설 ${byType["14"] || 0} · 레포츠 ${byType["28"] || 0} | 아이친화 ${kidN}`);
  console.log(`   지역: ${Object.entries(byArea).sort((a, b) => b[1] - a[1]).map(([a, n]) => `${a} ${n}`).join(" · ")}\n`);
}

main().catch((e) => {
  console.error("\n❌ 수집 실패:", e.message);
  process.exit(1);
});
