// 여행코스 블로그 자동 생성·발행 (GitHub Action이 매일 실행)
// 재료 = data/courses.json (정부 공식 코스, scripts/collectCourses.mjs로 미리 수집)
// 생성 = OpenAI(gpt-5.6-luna)만. ★제미나이 미사용★ (정부 검증 사실 리라이팅이라 환각 위험 낮음)
// 안전망 = 로컬 품질검사 + 패턴검사(경유지 자료에 없는 연도·인물 차단) + 자가치유. 실패 시 스킵.
//
// 실행: node scripts/generateCourses.mjs
// 필요: OPENAI_API_KEY (필수)
// 옵션: FORCE_COUNT(개수 강제), COURSE_IDS(특정 코스만, 콤마구분)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildCoursePrompt, buildListPrompt, courseQualityCheck, courseSourceFacts, patternCheck, sanitizeUnsupported,
  callOpenAI, rampCourses, COURSE_THEME_LABEL, checkCourseComposition, courseGeoFeasible, courseStopsCheck,
  usageTotal, usageCost,
  selectCourseStops, COURSE_CAP_VERSION, COURSE_ATT_CAP,
} from "./lib/articleGen.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COURSES = path.join(ROOT, "data", "courses.json");         // 공식(정부) 코스
const COURSES_AUTO = path.join(ROOT, "data", "courses-auto.json"); // 자동 조합 코스
const PLACES = path.join(ROOT, "data", "places.json");           // 경유지→좌표 매칭(지리 실현성 검사)
const FESTIVALS = path.join(ROOT, "data", "festivals.json");     // 공식 축제 캐시(가을 코스 글 연결용)
const OVERVIEWS = path.join(ROOT, "data", "place-overviews.json"); // 스팟 소개 캐시(글 파이프라인과 공유)
const STORE = path.join(ROOT, "data", "course-articles.json");
const ENRICH_MAX = Number(process.env.ENRICH_MAX || 80); // 발행분 스팟 소개 보강 최대 호출(한도 방어)
const REBUILD_MAX = Number(process.env.COURSE_REBUILD_MAX || 8); // 상한 초과 옛 글 재생성 한도(1회 실행당)

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";
const MODEL = process.env.OPENAI_GEN_MODEL || OPENAI_MODEL;

function envKey(name) {
  if (process.env[name]) return process.env[name].trim();
  const p = path.join(ROOT, ".env.local");
  if (fs.existsSync(p)) {
    const l = fs.readFileSync(p, "utf8").split(/\r?\n/).find((x) => x.startsWith(name + "="));
    if (l) return l.slice(name.length + 1).trim();
  }
  return "";
}
const OPENAI = envKey("OPENAI_API_KEY");
const GEMINI = envKey("GEMINI_API_KEY"); // 코스 "구성" 교차검증용(본문 생성은 OpenAI)
const TOURKEY = envKey("DATA_GO_KR_KEY") || envKey("TOUR_API_KEY");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ymd = (date) => `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
const MARKET_API = process.env.MARKET_API_URL || "https://mwohaji.kr/api/traditional-markets";
let marketCache = null;

async function marketNoteFor(area) {
  if (marketCache === null) {
    try {
      const r = await fetch(`${MARKET_API}?source=course-generator`, { signal: AbortSignal.timeout(12000) });
      const j = await r.json();
      marketCache = Array.isArray(j?.markets) ? j.markets : [];
    } catch { marketCache = []; }
  }
  const rows = marketCache.filter((m) => m.region === area).slice(0, 5);
  if (!rows.length) return "";
  return rows.map((m) => [m.name, m.address, m.category, m.hasParking === true ? "주차 가능" : "", m.items ? `취급품목=${m.items}` : ""].filter(Boolean).join(" / ")).join("\n");
}

// ── 경유지명 → 좌표 해석기(places.json 정규화 매칭). 지리 실현성 검사(courseGeoFeasible)에 사용. ──
const _norm = (s) => String(s || "").replace(/\s|\(.*?\)/g, "");
function buildResolver() {
  let idx = null;
  return (name) => {
    if (!idx) {
      idx = new Map();
      try {
        const spots = JSON.parse(fs.readFileSync(PLACES, "utf8")).spots || [];
        for (const p of spots) {
          if (!p.mapx || !p.mapy) continue;
          const k = _norm(p.title);
          if (k && !idx.has(k)) idx.set(k, p);
        }
      } catch { /* places.json 없으면 빈 인덱스(검사 통과) */ }
    }
    const n = _norm(name);
    if (!n) return null;
    if (idx.has(n)) return idx.get(n);
    for (const [k, p] of idx) if (k && (k.includes(n) || n.includes(k))) return p;
    return null;
  };
}
const resolvePlace = buildResolver();

// ── 스팟 소개 캐시 로드/저장 (글 파이프라인과 공유) ──
const ovStore = fs.existsSync(OVERVIEWS) ? JSON.parse(fs.readFileSync(OVERVIEWS, "utf8")) : {};
const OV = ovStore.overviews || ovStore;
const festivalStore = fs.existsSync(FESTIVALS) ? JSON.parse(fs.readFileSync(FESTIVALS, "utf8")) : {};
const FESTIVAL_LIST = Array.isArray(festivalStore) ? festivalStore : festivalStore.festivals || [];
let ovDirty = false;
let enrichCalls = 0;

// ── 요금·운영정보 캐시 (주소·이용요금·운영시간 보강용) ──
const FEES_PATH = path.join(ROOT, "data", "place-fees.json");
const INTRO_PATH = path.join(ROOT, "data", "place-intro.json");
const FEE = fs.existsSync(FEES_PATH) ? (JSON.parse(fs.readFileSync(FEES_PATH, "utf8")).fees || {}) : {};
const INTRO = fs.existsSync(INTRO_PATH) ? (JSON.parse(fs.readFileSync(INTRO_PATH, "utf8")).intro || {}) : {};
const cleanTxt = (s) => String(s || "").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
function feeOf(id) {
  const it = INTRO[id];
  if (it && it.usefee && cleanTxt(it.usefee)) return cleanTxt(it.usefee).slice(0, 60);
  if (FEE[id] === "free") return "무료";
  if (FEE[id] === "paid") return "유료(현장 확인)";
  return "";
}
function usetimeOf(id) {
  const it = INTRO[id];
  return it && it.usetime ? cleanTxt(it.usetime).slice(0, 60) : "";
}

async function fetchOverview(id) {
  if (Object.prototype.hasOwnProperty.call(OV, id)) return String(OV[id] || "");
  if (!TOURKEY || enrichCalls >= ENRICH_MAX) return "";
  enrichCalls++;
  const keys = /%[0-9A-Fa-f]{2}/.test(TOURKEY) ? [TOURKEY, encodeURIComponent(TOURKEY)] : [encodeURIComponent(TOURKEY), TOURKEY];
  for (const key of keys) {
    try {
      const url = `https://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${key}&MobileOS=ETC&MobileApp=mwohaji&_type=json&contentId=${id}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const j = await r.json();
      if (j?.response?.header?.resultCode !== "0000") continue;
      const it = j?.response?.body?.items?.item;
      const o = (Array.isArray(it) ? it[0] : it)?.overview || "";
      const clean = String(o).replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
      OV[id] = clean; ovDirty = true;
      return clean;
    } catch { /* 다음 키 */ }
  }
  return "";
}

// 스팟 보강: 소개(overview) + 주소·이용요금·운영시간(확정정보). placeId 있는 자동 코스가 주 대상.
async function enrichStops(course) {
  for (const s of course.stops || []) {
    if (!s.overview && s.placeId) { s.overview = await fetchOverview(s.placeId); await sleep(120); }
    if (s.placeId) {
      if (!s.fee) s.fee = feeOf(s.placeId);
      if (!s.usetime) s.usetime = usetimeOf(s.placeId);
      // addr는 자동 코스 스팟에 이미 있음(placeId 기반). 공식 코스 스팟은 주소 없음.
    }
  }
  return course;
}

// LLM 출력 첫 "# 제목" 줄을 SEO 제목으로 분리, 본문에서 제거(페이지가 자체 h1 렌더)
function splitTitle(text, fallback) {
  const lines = String(text || "").split(/\r?\n/);
  let title = "", start = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "") { start = i + 1; continue; }
    const m = lines[i].match(/^#\s+(.+)$/);
    if (m) { title = m[1].trim(); start = i + 1; }
    break;
  }
  const body = lines.slice(start).join("\n").trim();
  return { title: title || fallback, body: body || String(text || "").trim() };
}

// 여름·지방 우선 큐: 지금 여름휴가철 → 지방·바다피서부터 채워 시즌 검색 트래픽 흡수
const REGION_PRIORITY = {
  강원: 10, 제주: 10, 전남: 9, 전북: 9, 경남: 9, 경북: 9,
  충남: 7, 충북: 7, 부산: 6, 대구: 6, 광주: 6, 대전: 6, 울산: 6,
  인천: 4, 경기: 3, 세종: 3, 서울: 2,
};

// 실제 검색 의도가 강한 느린 가족 동선과 사찰·시장 코스를 우선 발행한다.
const courseNames = (c) => (c.stops || []).map((s) => String(s.name || "")).join(" ");
const isSeniorPlan = (c) => {
  const text = courseNames(c);
  return /(사찰|절(?=\s|$)|암자|향교|서원|고택|성당|성지)/.test(text) && /(시장|오일장|5일장|장터)/.test(text);
};
const isImpossibleRoute = (c) => {
  const names = (c.stops || []).map((s) => String(s.name || ""));
  const ferryIsland = /(굴업|덕적|백령|대청|연평|울릉|거문|욕지|한산|사량|청산|보길|노화|소안|흑산|추자)/;
  return names.some((name) => ferryIsland.test(name)) && names.some((name) => !ferryIsland.test(name));
};
// 계절 자동 — 현재 달에 맞는 테마 우선(여름=바다, 가을=문화유적·축제, 겨울=실내)
function seasonTheme() {
  const m = new Date().getMonth() + 1;
  if (m >= 6 && m <= 8) return "바다피서";
  if (m >= 9 && m <= 11) return "문화유적";
  if (m === 12 || m <= 2) return "가족체험";
  return "가족체험"; // 봄
}

// 현재 계절(월 기준) — 코스의 계절 태그(seasons)와 매칭해 제철 코스 우선 발행.
function currentSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

function pickQueue(courses, doneIds, n) {
  const seasonKey = seasonTheme();
  const curSeason = currentSeason();
  const cand = courses.filter((c) => !doneIds.has(c.id) && !isImpossibleRoute(c) && (c.stops?.length || 0) >= 2);
  const prio = (a, b) => {
    // ① 제철 스팟(온천·꽃·단풍·물가 등)을 가진 코스를 최우선 — 계절별 다양화
    const na = a.seasons?.includes(curSeason) ? 1 : 0, nb = b.seasons?.includes(curSeason) ? 1 : 0;
    if (na !== nb) return nb - na;
    const sa = a.themes?.includes(seasonKey) ? 1 : 0, sb = b.themes?.includes(seasonKey) ? 1 : 0;
    if (sa !== sb) return sb - sa;                                  // 제철 테마 먼저
    const oa = a.source === "official" ? 1 : 0, ob = b.source === "official" ? 1 : 0;
    if (oa !== ob) return ob - oa;                                  // 공식 우선
    const ra = REGION_PRIORITY[a.area] || 1, rb = REGION_PRIORITY[b.area] || 1;
    if (ra !== rb) return rb - ra;                                  // 지방 우선
    return (b.stops?.length || 0) - (a.stops?.length || 0);
  };
  // 기간별 비율 배분: 당일 50% · 1박2일 30% · 2박3일 20% (예: 10개 → 5·3·2).
  //  베스트 해수욕장(finite 8개)은 데일리 비율에서 제외 — 필요시 남는 자리 채움용으로만.
  const buckets = { "당일": [], "1박2일": [], "2박3일": [], "베스트": [] };
  for (const c of cand) (buckets[c.duration] || (buckets[c.duration] = [])).push(c);
  for (const k of Object.keys(buckets)) buckets[k].sort(prio);
  const quota = { "당일": Math.round(n * 0.5), "1박2일": Math.round(n * 0.3), "2박3일": n - Math.round(n * 0.5) - Math.round(n * 0.3) };
  const idx = { "당일": 0, "1박2일": 0, "2박3일": 0, "베스트": 0 };
  const out = [];
  const taken = new Set();
  const reserve = (predicate, count) => {
    for (const c of cand.filter(predicate).sort(prio)) {
      if (out.length >= n || taken.has(c.id) || count <= 0) continue;
      out.push(c); taken.add(c.id); count--;
    }
  };
  // 하루 10개 기준: 사찰·전통시장 동선 3개를 먼저 확보한다.
  reserve(isSeniorPlan, Math.min(3, n));
  // 1) 비율만큼 우선 채움
  for (const k of ["당일", "1박2일", "2박3일"]) {
    const b = buckets[k];
    let added = 0;
    while (added < (quota[k] || 0) && idx[k] < b.length) {
      const c = b[idx[k]++];
      if (taken.has(c.id)) continue;
      out.push(c); taken.add(c.id); added++;
    }
  }
  // 2) 부족분은 남은 코스(당일→1박2일→2박3일→베스트)에서 채워 목표 n 맞춤
  let progressed = true;
  while (out.length < n && progressed) {
    progressed = false;
    for (const k of ["당일", "1박2일", "2박3일", "베스트"]) {
      const b = buckets[k];
      if (b) {
        while (idx[k] < b.length && taken.has(b[idx[k]].id)) idx[k]++;
        if (idx[k] < b.length) { out.push(b[idx[k]]); taken.add(b[idx[k]].id); idx[k]++; progressed = true; if (out.length >= n) break; }
      }
    }
  }
  return out;
}

// ── 상한 재적용 큐 ──
// 기간별 관광지 상한(당일 3 · 1박2일 6 · 2박3일 7 = 하루 최대 3곳)은 페이지에 "즉시" 적용되지만,
// 이미 발행된 글의 본문은 옛 상한(4/6/9)으로 쓰여 있어 글과 페이지가 어긋난다.
//  → 발행글을 전부 점검해서
//     · 새 상한을 이미 지키는 글: 도장(capV)만 찍고 넘어감(API 0)
//     · 어긋난 글: 재생성 큐(하루 REBUILD_MAX개까지)
// 재생성이 끝날 때까지 옛 글은 그대로 노출된다(빈 페이지 만들지 않음).
function planRebuilds(store, courses) {
  const byId = new Map(courses.map((c) => [c.id, c]));
  const queue = [];
  let stamped = 0, orphan = 0;
  for (const [id, a] of Object.entries(store.articles)) {
    if (a.capV === COURSE_CAP_VERSION) continue;
    const c = byId.get(id);
    if (!c) { orphan++; continue; } // 재료가 사라진 글(코스 풀 재조합) — 손대지 않음
    const want = selectCourseStops(c);
    if (courseStopsCheck(c, a.content).ok) {   // 본문이 새 선별과 정확히 일치 → 재생성 불필요
      a.capV = COURSE_CAP_VERSION;
      a.stopCount = want.length;
      stamped++;
      continue;
    }
    queue.push(c);
  }
  return { queue, stamped, orphan };
}

function autumnFestivalNote(course) {
  const month = new Date().getMonth() + 1;
  if (month < 9 || month > 11) return "";
  const today = ymd(new Date());
  const limit = ymd(new Date(Date.now() + 90 * 86400000));
  const matches = FESTIVAL_LIST
    .filter((festival) => festival.area === course.area)
    .filter((festival) => String(festival.endDate || "") >= today && String(festival.startDate || "") <= limit)
    .slice(0, 2);
  if (!matches.length) return "";
  return `공식 축제 참고(코스 지역·가을 일정 연결용): ${matches.map((festival) => `${festival.title} (${festival.startDate}~${festival.endDate})`).join(" / ")}`;
}

// 생성 → 로컬검사 → 패턴검사(자가치유) → 발행. 제미나이 없음.
async function produceCourse(course, existingTexts, marketNote = "") {
  const festivalNote = autumnFestivalNote(course);
  const source = `${courseSourceFacts(course)}${festivalNote ? `\n${festivalNote}` : ""}`;
  const mth = new Date().getMonth() + 1;
  const summer = mth >= 6 && mth <= 8 && (course.themes || []).includes("바다피서");
  const reasons = [];
  const log = (m) => { console.log(`  · ${course.title} ${m}`); reasons.push(m); };
  let retryHint = "";

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const base = course.format === "list" ? buildListPrompt(course) : buildCoursePrompt(course, { summer, festivalNote, marketNote });
      const prompt = base + (retryHint ? `\n\n[❗ 직전 시도 반려 — 교정]\n${retryHint}` : "");
      const { text: raw } = await callOpenAI(prompt, { apiKey: OPENAI, model: MODEL });
      if (!raw) { log(`시도${attempt} 빈 응답`); await sleep(1500); continue; }
      const { title, body: text } = splitTitle(raw, `${course.area} ${course.duration} 여행코스`);

      const q = courseQualityCheck(text, { source, existingTexts });
      if (!q.ok) {
        log(`시도${attempt} 품질 반려: ${q.reason}`);
        retryHint = `직전 시도가 "${q.reason}" 사유로 반려됐어요. 고쳐 다시 쓰세요.`;
        await sleep(1000); continue;
      }

      // 경유지 일치 검사 — 자료에 없는 장소를 지어내거나 관광지를 빼먹은 글은 발행 금지(환각 차단)
      const sc = courseStopsCheck(course, text);
      if (!sc.ok) {
        log(`시도${attempt} 경유지 반려: ${sc.reason}`);
        retryHint = `직전 시도가 "${sc.reason}" 사유로 반려됐어요. 소제목은 위 [관광 경유지] 목록에 있는 장소 이름만 그대로 쓰고, 목록에 없는 장소는 절대 등장시키지 마세요. 목록의 관광지는 하나도 빠뜨리지 마세요.`;
        await sleep(1000); continue;
      }

      let finalText = text;
      const p = patternCheck(text, source);
      if (!p.ok) {
        // 근거 없는 표현이 든 문장만 잘라내고 재검(글 전체 폐기 방지)
        const s = sanitizeUnsupported(text, source);
        const sq = courseQualityCheck(s.text, { source, existingTexts });
        const sp = patternCheck(s.text, source);
        if (s.text && sq.ok && sp.ok && courseStopsCheck(course, s.text).ok) {
          log(`시도${attempt} 근거없는 표현 ${s.removed}곳 자동 제거 후 통과`);
          finalText = s.text;
        } else {
          log(`시도${attempt} 패턴 반려: ${p.reason}`);
          retryHint = `직전 시도가 ${p.reason} 문제로 반려됐어요. 경유지 자료에 없는 연도·인물·수치는 쓰지 마세요.`;
          await sleep(1000); continue;
        }
      }
      const fin = courseQualityCheck(finalText, {});
      return { art: { text: finalText, len: fin.len, title }, reasons };
    } catch (e) {
      log(`시도${attempt} 오류: ${e.message}`);
      await sleep(1500);
    }
  }
  return { art: null, reasons };
}

async function main() {
  if (!OPENAI) { console.error("❌ OPENAI_API_KEY 없음 — 코스 글 생성 불가."); process.exit(1); }

  // 공식 + 자동 코스 병합 (둘 중 하나만 있어도 동작)
  const official = fs.existsSync(COURSES) ? (JSON.parse(fs.readFileSync(COURSES, "utf8")).courses || []) : [];
  const auto = fs.existsSync(COURSES_AUTO) ? (JSON.parse(fs.readFileSync(COURSES_AUTO, "utf8")).courses || []) : [];
  const courses = [...official, ...auto].filter((course) => !isImpossibleRoute(course));
  if (!courses.length) { console.error("❌ 코스 재료 없음 — collectCourses.mjs / buildCourses.mjs 먼저 실행."); process.exit(1); }
  const store = fs.existsSync(STORE)
    ? JSON.parse(fs.readFileSync(STORE, "utf8"))
    : { startDate: new Date().toISOString().slice(0, 10), generatedAt: null, articles: {} };
  store.articles ||= {};

  const doneIds = new Set(Object.keys(store.articles));
  const existingTexts = Object.values(store.articles).map((a) => a.content);

  const forcedIds = (process.env.COURSE_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const target = Number(process.env.FORCE_COUNT) || rampCourses();

  let items;
  const rebuildIds = new Set();
  if (forcedIds.length) {
    items = forcedIds.map((id) => courses.find((c) => c.id === id)).filter(Boolean);
    for (const c of items) if (doneIds.has(c.id)) rebuildIds.add(c.id);
    console.log(`\n🧪 지정 코스 ${items.length}건`);
  } else {
    // (1) 상한 초과 옛 글 재생성이 먼저 — 글과 페이지가 어긋난 상태를 푸는 게 신규 발행보다 급하다. (2) 그다음 신규.
    const { queue: rebuilds, stamped, orphan } = planRebuilds(store, courses);
    const todo = rebuilds.slice(0, REBUILD_MAX);
    for (const c of todo) rebuildIds.add(c.id);
    items = [...todo, ...pickQueue(courses, doneIds, target)];
    console.log(`\n🧭 코스 글 신규 목표 ${target}건 · 후보풀 ${courses.length - doneIds.size} · 기존 ${doneIds.size} · 모델 ${MODEL} · 제미나이 OFF`);
    console.log(`   상한 재적용(당일 ${COURSE_ATT_CAP["당일"]}·1박2일 ${COURSE_ATT_CAP["1박2일"]}·2박3일 ${COURSE_ATT_CAP["2박3일"]}, 하루 3곳) — 적합 ${stamped}건 통과 · 재생성 ${todo.length}/${rebuilds.length}건${orphan ? ` · 재료없음 ${orphan}건` : ""}`);
  }

  let made = 0, skipped = 0, errored = 0, rebuilt = 0;
  const report = [];
  for (const course of items) {
   try { // 코스 하나가 에러나도 전체 중단 없이 다음으로 (부분 발행 + 커밋 보장)
    // 스팟 상한은 buildCoursePrompt·lib(courseAttractions) 모두 lib/courseSelect.js 하나를 쓰므로 여기선 자르지 않음(요약↔글 일치).
    const isRebuild = rebuildIds.has(course.id);
    await enrichStops(course); // 자동 코스 스팟 소개 보강(캐시/한도 내 조회)

    // ── 지리 실현성 검사(결정적) — 공식·자동 모두 적용. "원거리 배편 섬 + 육지" 혼합 코스 차단.
    //    섬 안에서만 도는 코스(유명 섬 단독)는 통과. 연평도·굴업도 등 배 타고 가는 섬을 육지 일정에 섞은 것 방지.
    const geo = courseGeoFeasible(course, resolvePlace);
    if (!geo.ok) {
      skipped++;
      report.push({ id: course.id, title: course.title, outcome: "skip", reason: `지리 NG: ${geo.reason}` });
      console.log(`  ✗ 지리 반려: ${course.title} (${geo.reason})`);
      continue;
    }

    // 코스 "구성" Gemini 교차검증 — 자동 코스만(공식은 정부 큐레이션이라 신뢰). 리스트형·공식 제외.
    if (GEMINI && course.format !== "list" && course.source !== "official") {
      const comp = await checkCourseComposition(course, { apiKey: GEMINI });
      if (!comp.ok) {
        skipped++;
        report.push({ id: course.id, title: course.title, outcome: "skip", reason: `구성 NG: ${comp.reason.slice(0, 80)}` });
        console.log(`  ✗ 구성 반려: ${course.title} (${comp.reason.slice(0, 60)})`);
        continue;
      }
    }
    // 재생성이면 "자기 자신"을 중복 비교 대상에서 뺀다(옛 글과 비슷하다고 스스로 반려되는 것 방지).
    const prevText = store.articles[course.id]?.content || "";
    const compareTexts = isRebuild ? existingTexts.filter((t) => t !== prevText) : existingTexts;
    const marketNote = isRebuild ? "" : await marketNoteFor(course.area);
    const { art, reasons } = await produceCourse(course, compareTexts, marketNote);
    if (!art) {
      skipped++;
      report.push({ id: course.id, title: course.title, outcome: "skip", reason: reasons.slice(-2).join(" | ") });
      console.log(`  ✗ ${isRebuild ? "재생성 실패(옛 글 유지)" : "스킵"}: ${course.title}`);
      continue;
    }
    store.articles[course.id] = {
      status: "published",
      generatedAt: new Date().toISOString(),
      publishedAt: store.articles[course.id]?.publishedAt || new Date().toISOString(),
      area: course.area,
      duration: course.duration,
      themes: course.themes || [],
      themeLabels: (course.themes || []).map((t) => COURSE_THEME_LABEL[t] || t),
      title: art.title || course.title, // LLM이 만든 SEO 제목 우선(지역+기간+여행코스)
      content: art.text,
      model: MODEL,
      length: art.len,
      stopCount: selectCourseStops(course).length, // 실제 노출 관광지 수(식당 제외·상한 적용)
      capV: COURSE_CAP_VERSION,                     // 이 상한 규칙으로 쓰인 글이라는 도장
      image: course.image || "",
      source: course.source || "official",
    };
    made++;
    if (isRebuild) { rebuilt++; const i = existingTexts.indexOf(prevText); if (i >= 0) existingTexts.splice(i, 1); }
    existingTexts.push(art.text);
    report.push({ id: course.id, title: course.title, outcome: isRebuild ? "rebuilt" : "published", detail: `${art.len}자/${course.duration}/${course.area}` });
    console.log(`  ✓ ${isRebuild ? "재생성" : `발행 ${made - rebuilt}/${target}`}: ${course.title} (${art.len}자, ${course.area} ${course.duration}, 관광지 ${selectCourseStops(course).length}곳)`);
    await sleep(800);
   } catch (e) {
    errored++;
    report.push({ id: course.id, title: course.title, outcome: "error", reason: String(e && e.message || e).slice(0, 120) });
    console.log(`  ⚠ 오류(스킵): ${course.title} — ${String(e && e.message || e).slice(0, 100)}`);
   }
  }

  // 실비 측정 — 코스 글에는 web_search를 쓰지 않으므로 토큰 요금이 곧 전부다.
  const cost = usageCost();
  console.log(`
💰 코스 토큰: 입력 ${usageTotal.in.toLocaleString()} · 출력 ${usageTotal.out.toLocaleString()} · 호출 ${usageTotal.calls}회 → $${cost.toFixed(4)}`);

  store.generatedAt = new Date().toISOString();
  store._lastRun = {
    at: new Date().toISOString(), made, rebuilt, skipped, errored,
    usage: { ...usageTotal, costUsd: Number(cost.toFixed(4)) },
    results: report,
  };
  fs.writeFileSync(STORE, JSON.stringify(store, null, 0));
  const pub = Object.values(store.articles).filter((a) => a.status === "published").length;
  console.log(`\n💾 저장: 신규 ${made - rebuilt} · 재생성 ${rebuilt} · 스킵 ${skipped} | 총 코스글 ${pub} / 전체 코스 ${courses.length}\n`);
}

main().catch((e) => { console.error("❌ 실패:", e.message); process.exit(1); });
