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
  buildCoursePrompt, courseQualityCheck, courseSourceFacts, patternCheck, sanitizeUnsupported,
  callOpenAI, rampCourses, COURSE_THEME_LABEL,
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
const TOURKEY = envKey("DATA_GO_KR_KEY") || envKey("TOUR_API_KEY");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── 스팟 소개 캐시 로드/저장 (글 파이프라인과 공유) ──
const ovStore = fs.existsSync(OVERVIEWS) ? JSON.parse(fs.readFileSync(OVERVIEWS, "utf8")) : {};
const OV = ovStore.overviews || ovStore;
let ovDirty = false;
let enrichCalls = 0;

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

// 자동 코스 스팟(placeId 있고 overview 빈 것)에 소개 보강
async function enrichStops(course) {
  for (const s of course.stops || []) {
    if (!s.overview && s.placeId) { s.overview = await fetchOverview(s.placeId); await sleep(120); }
  }
  return course;
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
  cand.sort((a, b) => {
    // 1) 제철 테마 코스 먼저
    const sa = a.themes?.includes(seasonKey) ? 1 : 0;
    const sb = b.themes?.includes(seasonKey) ? 1 : 0;
    if (sa !== sb) return sb - sa;
    // 2) 공식 코스 우선(검증된 사실 → 품질)
    const oa = a.source === "official" ? 1 : 0, ob = b.source === "official" ? 1 : 0;
    if (oa !== ob) return ob - oa;
    // 3) 지방 우선
    const ra = REGION_PRIORITY[a.area] || 1, rb = REGION_PRIORITY[b.area] || 1;
    if (ra !== rb) return rb - ra;
    // 4) 경유지 많은(풍부한) 코스 먼저
    return (b.stops?.length || 0) - (a.stops?.length || 0);
  });
  return cand.slice(0, n);
}

// 생성 → 로컬검사 → 패턴검사(자가치유) → 발행. 제미나이 없음.
async function produceCourse(course, existingTexts) {
  const source = courseSourceFacts(course);
  const summer = isSummerNow() && (course.themes || []).includes("바다피서");
  const reasons = [];
  const log = (m) => { console.log(`  · ${course.title} ${m}`); reasons.push(m); };
  let retryHint = "";

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const prompt = buildCoursePrompt(course, { summer }) + (retryHint ? `\n\n[❗ 직전 시도 반려 — 교정]\n${retryHint}` : "");
      const { text } = await callOpenAI(prompt, { apiKey: OPENAI, model: MODEL });
      if (!text) { log(`시도${attempt} 빈 응답`); await sleep(1500); continue; }

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
      return { art: { text: finalText, len: fin.len }, reasons };
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

  let made = 0, skipped = 0;
  const report = [];
  for (const course of items) {
    await enrichStops(course); // 자동 코스 스팟 소개 보강(캐시/한도 내 조회)
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
      title: course.title,
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
  }

  store.generatedAt = new Date().toISOString();
  store._lastRun = { at: new Date().toISOString(), made, skipped, results: report };
  fs.writeFileSync(STORE, JSON.stringify(store, null, 0));
  const pub = Object.values(store.articles).filter((a) => a.status === "published").length;
  console.log(`\n💾 저장: 발행 ${made} · 스킵 ${skipped} | 총 코스글 ${pub} / 전체 코스 ${courses.length}\n`);
}

main().catch((e) => { console.error("❌ 실패:", e.message); process.exit(1); });
