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
  callOpenAI, rampCourses, COURSE_THEME_LABEL, checkCourseComposition,
} from "./lib/articleGen.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COURSES = path.join(ROOT, "data", "courses.json");         // 공식(정부) 코스
const COURSES_AUTO = path.join(ROOT, "data", "courses-auto.json"); // 자동 조합 코스
const OVERVIEWS = path.join(ROOT, "data", "place-overviews.json"); // 스팟 소개 캐시(글 파이프라인과 공유)
const STORE = path.join(ROOT, "data", "course-articles.json");
const ENRICH_MAX = Number(process.env.ENRICH_MAX || 80); // 발행분 스팟 소개 보강 최대 호출(한도 방어)

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

// ── 스팟 소개 캐시 로드/저장 (글 파이프라인과 공유) ──
const ovStore = fs.existsSync(OVERVIEWS) ? JSON.parse(fs.readFileSync(OVERVIEWS, "utf8")) : {};
const OV = ovStore.overviews || ovStore;
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
// 계절 자동 — 현재 달에 맞는 테마 우선(여름=바다, 가을=단풍(자연), 겨울=실내(가족), 봄=자연)
function seasonTheme() {
  const m = new Date().getMonth() + 1;
  if (m >= 6 && m <= 8) return "바다피서";
  if (m >= 9 && m <= 11) return "자연힐링";
  if (m === 12 || m <= 2) return "가족체험";
  return "자연힐링"; // 봄
}

function pickQueue(courses, doneIds, n) {
  const seasonKey = seasonTheme();
  const cand = courses.filter((c) => !doneIds.has(c.id) && (c.stops?.length || 0) >= 2);
  const prio = (a, b) => {
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
  // 1) 비율만큼 우선 채움
  for (const k of ["당일", "1박2일", "2박3일"]) {
    const b = buckets[k];
    for (let i = 0; i < (quota[k] || 0) && idx[k] < b.length; i++) out.push(b[idx[k]++]);
  }
  // 2) 부족분은 남은 코스(당일→1박2일→2박3일→베스트)에서 채워 목표 n 맞춤
  let progressed = true;
  while (out.length < n && progressed) {
    progressed = false;
    for (const k of ["당일", "1박2일", "2박3일", "베스트"]) {
      const b = buckets[k];
      if (b && idx[k] < b.length) { out.push(b[idx[k]++]); progressed = true; if (out.length >= n) break; }
    }
  }
  return out;
}

// 생성 → 로컬검사 → 패턴검사(자가치유) → 발행. 제미나이 없음.
async function produceCourse(course, existingTexts) {
  const source = courseSourceFacts(course);
  const mth = new Date().getMonth() + 1;
  const summer = mth >= 6 && mth <= 8 && (course.themes || []).includes("바다피서");
  const reasons = [];
  const log = (m) => { console.log(`  · ${course.title} ${m}`); reasons.push(m); };
  let retryHint = "";

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const base = course.format === "list" ? buildListPrompt(course) : buildCoursePrompt(course, { summer });
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

      let finalText = text;
      const p = patternCheck(text, source);
      if (!p.ok) {
        // 근거 없는 표현이 든 문장만 잘라내고 재검(글 전체 폐기 방지)
        const s = sanitizeUnsupported(text, source);
        const sq = courseQualityCheck(s.text, { source, existingTexts });
        const sp = patternCheck(s.text, source);
        if (s.text && sq.ok && sp.ok) {
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
  const courses = [...official, ...auto];
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
  if (forcedIds.length) {
    items = forcedIds.map((id) => courses.find((c) => c.id === id)).filter(Boolean);
    console.log(`\n🧪 지정 코스 ${items.length}건`);
  } else {
    items = pickQueue(courses, doneIds, target);
    console.log(`\n🧭 코스 글 목표 ${target}건 · 후보풀 ${courses.length - doneIds.size} · 기존 ${doneIds.size} · 모델 ${MODEL} · 제미나이 OFF`);
  }

  let made = 0, skipped = 0, errored = 0;
  const report = [];
  for (const course of items) {
   try { // 코스 하나가 에러나도 전체 중단 없이 다음으로 (부분 발행 + 커밋 보장)
    await enrichStops(course); // 자동 코스 스팟 소개 보강(캐시/한도 내 조회)
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
    const { art, reasons } = await produceCourse(course, existingTexts);
    if (!art) {
      skipped++;
      report.push({ id: course.id, title: course.title, outcome: "skip", reason: reasons.slice(-2).join(" | ") });
      console.log(`  ✗ 스킵: ${course.title}`);
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
      stopCount: course.stopCount || (course.stops?.length || 0),
      image: course.image || "",
      source: course.source || "official",
    };
    made++;
    existingTexts.push(art.text);
    report.push({ id: course.id, title: course.title, outcome: "published", detail: `${art.len}자/${course.duration}/${course.area}` });
    console.log(`  ✓ 발행 ${made}/${target}: ${course.title} (${art.len}자, ${course.area} ${course.duration})`);
    await sleep(800);
   } catch (e) {
    errored++;
    report.push({ id: course.id, title: course.title, outcome: "error", reason: String(e && e.message || e).slice(0, 120) });
    console.log(`  ⚠ 오류(스킵): ${course.title} — ${String(e && e.message || e).slice(0, 100)}`);
   }
  }

  store.generatedAt = new Date().toISOString();
  store._lastRun = { at: new Date().toISOString(), made, skipped, errored, results: report };
  fs.writeFileSync(STORE, JSON.stringify(store, null, 0));
  const pub = Object.values(store.articles).filter((a) => a.status === "published").length;
  console.log(`\n💾 저장: 발행 ${made} · 스킵 ${skipped} | 총 코스글 ${pub} / 전체 코스 ${courses.length}\n`);
}

main().catch((e) => { console.error("❌ 실패:", e.message); process.exit(1); });
