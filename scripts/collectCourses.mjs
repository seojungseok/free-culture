// 한국관광공사 TourAPI - "여행코스"(contentTypeId=25) 전체 수집 → data/courses.json
// 공식 코스는 상시(거의 안 변함) 정보라 매일 호출하지 않고, 로컬/수동으로만 갱신.
//  - areaBasedList2(type 25): 지역별 코스 목록
//  - detailInfo2(type 25): 코스 경유지(subname·subdetailoverview·subdetailimg) — "여기→여기" 동선
//  - detailCommon2: 코스 자체 소개(overview)·대표사진
// 글쓰기(블로그화)는 별도: scripts/generateCourses.mjs (OpenAI). 여기선 "재료"만 모은다.
//
// 실행: node scripts/collectCourses.mjs
// 키: TOUR_API_KEY (없으면 DATA_GO_KR_KEY 폴백)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "courses.json");
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
if (!KEY) { console.error("❌ TOUR_API_KEY / DATA_GO_KR_KEY 없음"); process.exit(1); }

const AREA_TO_SIDO = {
  1: "서울", 2: "인천", 3: "대전", 4: "대구", 5: "광주", 6: "부산", 7: "울산",
  8: "세종", 31: "경기", 32: "강원", 33: "충북", 34: "충남", 35: "경북",
  36: "경남", 37: "전북", 38: "전남", 39: "제주",
};
const AREA_CODES = Object.keys(AREA_TO_SIDO).map(Number);

const commonBase = `serviceKey=${encodeURIComponent(KEY)}&MobileOS=ETC&MobileApp=mwohaji&_type=json`;
const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const https = (u) => String(u || "").replace(/^http:\/\//i, "https://");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s) =>
  String(s || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#3[49];/g, "'")
    .replace(/\s+/g, " ").trim();

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
      await sleep(700 * (i + 1));
    }
  }
}

// ── 기간 판별: 스팟 수 기반 현실 산정(정부 라벨은 "당일 9곳"처럼 비현실적이라 신뢰 안 함) ──
//  사람 기준: 한 곳 ~2시간 + 이동·휴식 → 하루 잘해야 3~4곳.
function realisticDuration(stopCount) {
  if (stopCount <= 4) return "당일";
  if (stopCount <= 7) return "1박2일";
  return "2박3일";
}

// ── 테마 판별: 경유지 이름·설명 키워드로 태깅(복수 가능). 여름 피서 우선 노출용 태그 포함 ──
const THEME_RULES = [
  { key: "바다피서", label: "바다·피서", re: /해수욕장|해변|바다|해안|계곡|워터|수상|해빈|섬|항|포구|해양/ },
  { key: "문화유적", label: "문화유적", re: /궁|사찰|사(?=\s|$)|유적|고택|한옥|서원|향교|성곽|왕릉|문화재|유물|고분|읍성|종묘|서당/ },
  { key: "자연힐링", label: "자연·힐링", re: /숲|수목원|공원|산|정원|호수|둘레길|생태|습지|폭포|계곡|전망대|휴양림|허브/ },
  { key: "가족체험", label: "가족·체험", re: /체험|박물관|과학관|미술관|테마파크|농원|목장|동물원|아쿠아리움|어린이|키즈|기념관/ },
  { key: "맛집", label: "맛집·먹거리", re: /맛집|먹거리|시장|유통|카페|빵|특산|미식|한정식|막걸리/ },
];
function detectThemes(course) {
  const hay = [course.title, course.overview, ...course.stops.map((s) => `${s.name} ${s.overview}`)].join(" ");
  const hit = THEME_RULES.filter((r) => r.re.test(hay)).map((r) => r.key);
  return hit.length ? hit : ["자연힐링"];
}

async function fetchStops(id) {
  try {
    const j = await fetchJson(`${BASE}/detailInfo2?${commonBase}&numOfRows=30&contentId=${id}&contentTypeId=25`);
    return arr(j?.response?.body?.items?.item)
      .map((s) => ({
        num: Number(s.subnum || 0),
        name: clean(s.subname),
        overview: clean(s.subdetailoverview),
        image: https(s.subdetailimg || ""),
      }))
      .filter((s) => s.name)
      .sort((a, b) => a.num - b.num);
  } catch { return []; }
}

async function fetchCourseCommon(id) {
  try {
    const j = await fetchJson(`${BASE}/detailCommon2?${commonBase}&contentId=${id}`);
    const it = arr(j?.response?.body?.items?.item)[0] || {};
    return { overview: clean(it.overview), image: https(it.firstimage || it.firstimage2 || ""), tel: clean(it.tel) };
  } catch { return { overview: "", image: "", tel: "" }; }
}

async function main() {
  console.log(`\n🧭 TourAPI 여행코스(type 25) 수집 시작 (지역 ${AREA_CODES.length})\n`);
  const byId = new Map();
  let calls = 0;

  // 1) 지역별 코스 목록
  for (const area of AREA_CODES) {
    const sido = AREA_TO_SIDO[area];
    let page = 1, total = Infinity, added = 0;
    while ((page - 1) * 100 < total) {
      try {
        const j = await fetchJson(`${BASE}/areaBasedList2?${commonBase}&numOfRows=100&pageNo=${page}&areaCode=${area}&contentTypeId=25`);
        calls++;
        const body = j?.response?.body;
        total = Number(body?.totalCount || 0);
        const items = arr(body?.items?.item);
        for (const it of items) {
          const id = String(it.contentid || "");
          if (!id || byId.has(id)) continue;
          byId.set(id, {
            id,
            title: clean(it.title),
            area: sido,
            image: https(it.firstimage || ""),
            mapx: String(it.mapx || ""),
            mapy: String(it.mapy || ""),
            tel: clean(it.tel),
            source: "official",
          });
          added++;
        }
        if (items.length === 0) break;
        page++;
        await sleep(200);
      } catch (e) { console.log(`  ${sido} p${page} 실패: ${e.message}`); break; }
    }
    if (added) console.log(`  ${sido.padEnd(3)} 코스 ${added}`);
  }

  // 2) 코스별 소개 + 경유지
  const courses = [...byId.values()];
  console.log(`\n📄 코스 ${courses.length}건 상세(소개·경유지) 수집…\n`);
  for (const c of courses) {
    const common = await fetchCourseCommon(c.id); calls++;
    await sleep(150);
    const stops = await fetchStops(c.id); calls++;
    await sleep(150);
    c.overview = common.overview;
    if (!c.image) c.image = common.image || (stops.find((s) => s.image)?.image || "");
    if (!c.tel) c.tel = common.tel;
    c.stops = stops;
    c.stopCount = stops.length;
    c.duration = realisticDuration(stops.length);
    c.themes = detectThemes(c);
  }

  // 경유지 2곳 미만은 "코스"로 보기 어려워 제외
  const kept = courses.filter((c) => c.stopCount >= 2);

  const byArea = {}, byDur = {}, byTheme = {};
  for (const c of kept) {
    byArea[c.area] = (byArea[c.area] || 0) + 1;
    byDur[c.duration] = (byDur[c.duration] || 0) + 1;
    for (const t of c.themes) byTheme[t] = (byTheme[t] || 0) + 1;
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), count: kept.length, courses: kept }, null, 0));

  const sizeKB = (fs.statSync(OUT).size / 1024).toFixed(0);
  console.log(`\n💾 저장: data/courses.json (${kept.length}코스, ${sizeKB}KB, TourAPI ${calls}콜)`);
  console.log(`   기간: ${Object.entries(byDur).map(([k, n]) => `${k} ${n}`).join(" · ")}`);
  console.log(`   테마: ${Object.entries(byTheme).map(([k, n]) => `${k} ${n}`).join(" · ")}`);
  console.log(`   지역: ${Object.entries(byArea).sort((a, b) => b[1] - a[1]).map(([a, n]) => `${a} ${n}`).join(" · ")}\n`);
}

main().catch((e) => { console.error("\n❌ 수집 실패:", e.message); process.exit(1); });
