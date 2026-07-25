// 한국관광공사 TourAPI - "아이와 가볼만한 곳" 수집 → data/tour-kids.json 캐시
// 관광지는 상시 정보라 매 요청마다 호출하지 않고, 주 1회/수동으로만 갱신.
//
// 실행: node scripts/collectTour.mjs
// 키: TOUR_API_KEY (없으면 DATA_GO_KR_KEY 폴백)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "tour-kids.json");
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

// 아이 친화 키워드 (STEP 2)
const KEYWORDS = ["체험", "박물관", "과학관", "동물원", "수목원", "아쿠아리움", "테마파크", "어린이"];
// 관광지(12) + 문화시설(14) 위주
const ALLOWED_TYPES = new Set(["12", "14"]);

const common = `serviceKey=${KEY}&MobileOS=ETC&MobileApp=mwohaji&_type=json&pageNo=1&numOfRows=100`;

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
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
}
const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const https = (u) => String(u || "").replace(/^http:\/\//i, "https://");

async function main() {
  console.log(`\n🧸 TourAPI 아이 친화 관광지 수집 (키워드 ${KEYWORDS.length}개)\n`);
  const byId = new Map();
  let calls = 0;

  for (const kw of KEYWORDS) {
    const url = `${BASE}/searchKeyword2?${common}&keyword=${encodeURIComponent(kw)}`;
    try {
      const j = await fetchJson(url);
      calls++;
      const items = arr(j?.response?.body?.items?.item);
      let added = 0;
      for (const it of items) {
        const id = String(it.contentid || "");
        const type = String(it.contenttypeid || "");
        if (!id || !ALLOWED_TYPES.has(type)) continue;
        if (!it.firstimage) continue; // 이미지 없는 항목 제외
        if (byId.has(id)) continue;
        const sido = AREA_TO_SIDO[Number(it.areacode)] || "";
        if (!sido) continue;
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
          keyword: kw,
        });
        added++;
      }
      console.log(`  ${kw.padEnd(6)} 총 ${j?.response?.body?.totalCount ?? "?"}건 → 신규 ${added}건 (누적 ${byId.size})`);
    } catch (e) {
      console.log(`  ${kw.padEnd(6)} 실패: ${e.message}`);
    }
  }

  const spots = [...byId.values()];
  const byArea = {};
  for (const s of spots) byArea[s.area] = (byArea[s.area] || 0) + 1;

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify({ generatedAt: new Date().toISOString(), count: spots.length, spots }, null, 0)
  );

  console.log(`\n💾 저장: data/tour-kids.json (${spots.length}곳, TourAPI ${calls}콜)`);
  console.log(`   지역별: ${Object.entries(byArea).sort((a, b) => b[1] - a[1]).map(([a, n]) => `${a} ${n}`).join(" · ")}\n`);
}

main().catch((e) => {
  console.error("\n❌ 수집 실패:", e.message);
  process.exit(1);
});
