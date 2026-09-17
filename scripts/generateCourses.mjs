import {pickQueue,isImpossibleRoute,canRetryCourse,holdCourse,takeNextCourse} from './lib/course-generation-queue.mjs';
import { newArticleAllowance, dayKST } from './lib/publication-budget.mjs';
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
async function produceCourse(course, existingTexts) {
  const festivalNote = autumnFestivalNote(course);
  const source = `${courseSourceFacts(course)}${festivalNote ? `\n${festivalNote}` : ""}`;
  const mth = new Date().getMonth() + 1;
  const summer = mth >= 6 && mth <= 8 && (course.themes || []).includes("바다피서");
  const reasons = [];
  const log = (m) => { console.log(`  · ${course.title} ${m}`); reasons.push(m); };
  let retryHint = "";

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const base = course.format === "list" ? buildListPrompt(course) : buildCoursePrompt(course, { summer, festivalNote });
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
  if (!OPENAI && process.env.COURSE_CHECK_ONLY!=='true') { console.error("❌ OPENAI_API_KEY 없음 — 코스 글 생성 불가."); process.exit(1); }

  // 공식 + 자동 코스 병합 (둘 중 하나만 있어도 동작)
  const official = fs.existsSync(COURSES) ? (JSON.parse(fs.readFileSync(COURSES, "utf8")).courses || []) : [];
  const auto = fs.existsSync(COURSES_AUTO) ? (JSON.parse(fs.readFileSync(COURSES_AUTO, "utf8")).courses || []) : [];
  const courses = [...official, ...auto].filter((course) => !isImpossibleRoute(course));
  if (!courses.length) { console.error("❌ 코스 재료 없음 — collectCourses.mjs / buildCourses.mjs 먼저 실행."); process.exit(1); }
  const store = fs.existsSync(STORE)
    ? JSON.parse(fs.readFileSync(STORE, "utf8"))
    : { startDate: new Date().toISOString().slice(0, 10), generatedAt: null, articles: {} };
  store.articles ||= {};
  store._generationHistory ||= {};
  const history=store._generationHistory;
  const day=dayKST();
  if(store._generationBudget?.day!==day)store._generationBudget={day,compositionChecks:0,newDrafts:0,rebuildDrafts:0};
  const budget=store._generationBudget;
  // Carry the last failed batch forward once, so the next schedule doesn't
  // spend its entire allowance on the same rejected candidates again.
  for(const result of store._lastRun?.results||[]){
    const course=courses.find(c=>c.id===result.id);
    if(course&&!history[course.id]&&['skip','error'].includes(result.outcome)&&Number.isFinite(Date.parse(store._lastRun.at)))
      holdCourse(history,course,result.reason,{now:Date.parse(store._lastRun.at),transient:result.outcome==='error'});
  }
  const save=()=>fs.writeFileSync(STORE,JSON.stringify(store,null,0));

  const doneIds = new Set(Object.keys(store.articles));
  const existingTexts = Object.values(store.articles).map((a) => a.content);

  const forcedIds = [...new Set((process.env.COURSE_IDS || "").split(",").map((s) => s.trim()).filter(Boolean))];
  const target = Math.max(1,Math.min(10,Math.floor(Number(process.env.FORCE_COUNT)||Number(process.env.COURSE_DAILY)||10)));

  let items;
  const rebuildIds = new Set();
  if (forcedIds.length) {
    items = forcedIds.map((id) => courses.find((c) => c.id === id)).filter(Boolean);
    for (const c of items) if (doneIds.has(c.id)) rebuildIds.add(c.id);
    console.log(`\n🧪 지정 코스 ${items.length}건`);
  } else {
    // (1) 상한 초과 옛 글 재생성이 먼저 — 글과 페이지가 어긋난 상태를 푸는 게 신규 발행보다 급하다. (2) 그다음 신규.
    const { queue: rebuilds, stamped, orphan } = planRebuilds(store, courses);
    const todo = rebuilds.filter(c=>canRetryCourse(c,history)).slice(0, REBUILD_MAX);
    for (const c of todo) rebuildIds.add(c.id);
    items = [...todo, ...pickQueue(courses.filter(c=>canRetryCourse(c,history)), doneIds, target*2)];
    console.log(`\n🧭 코스 글 신규 목표 ${target}건 · 후보풀 ${courses.length - doneIds.size} · 기존 ${doneIds.size} · 모델 ${MODEL} · 구성 교차검증 ${GEMINI?'ON':'키 없음'}`);
    console.log(`   상한 재적용(당일 ${COURSE_ATT_CAP["당일"]}·1박2일 ${COURSE_ATT_CAP["1박2일"]}·2박3일 ${COURSE_ATT_CAP["2박3일"]}, 하루 3곳) — 적합 ${stamped}건 통과 · 재생성 ${todo.length}/${rebuilds.length}건${orphan ? ` · 재료없음 ${orphan}건` : ""}`);
  }

  let made = 0, skipped = 0, errored = 0, rebuilt = 0;
  const report = [];
  let siteNewRemaining = newArticleAllowance(ROOT,'course-articles');
  if(process.env.COURSE_CHECK_ONLY==='true'){
    console.log(JSON.stringify({checkOnly:true,apiCalls:0,target,remaining:siteNewRemaining,budget,held:courses.filter(c=>!doneIds.has(c.id)&&!canRetryCourse(c,history)).length,queue:items.map(c=>({id:c.id,duration:c.duration,rebuild:rebuildIds.has(c.id)}))}));
    return;
  }
  const counts={};
  for(const a of Object.values(store.articles))if(a.publishedAt&&dayKST(new Date(a.publishedAt))===day)counts[a.duration]=(counts[a.duration]||0)+1;
  const pendingRebuilds=items.filter(c=>rebuildIds.has(c.id));
  const pendingNew=items.filter(c=>!rebuildIds.has(c.id));
  while(pendingRebuilds.length||pendingNew.length){
    const course=pendingRebuilds.length?pendingRebuilds.shift():takeNextCourse(pendingNew,counts,target);
    const isRebuild=rebuildIds.has(course.id);
    if(!isRebuild&&(siteNewRemaining<=0||made-rebuilt>=target||budget.newDrafts>=target))continue;
    if(isRebuild&&budget.rebuildDrafts>=REBUILD_MAX)continue;
   try { // 코스 하나가 에러나도 전체 중단 없이 다음으로 (부분 발행 + 커밋 보장)
    // 스팟 상한은 buildCoursePrompt·lib(courseAttractions) 모두 lib/courseSelect.js 하나를 쓰므로 여기선 자르지 않음(요약↔글 일치).

    // ── 지리 실현성 검사(결정적) — 공식·자동 모두 적용. "원거리 배편 섬 + 육지" 혼합 코스 차단.
    //    섬 안에서만 도는 코스(유명 섬 단독)는 통과. 연평도·굴업도 등 배 타고 가는 섬을 육지 일정에 섞은 것 방지.
    const geo = courseGeoFeasible(course, resolvePlace);
    if (!geo.ok) {
      skipped++;
      holdCourse(history,course,`지리 NG: ${geo.reason}`);
      report.push({ id: course.id, title: course.title, outcome: "skip", reason: `지리 NG: ${geo.reason}` });
      console.log(`  ✗ 지리 반려: ${course.title} (${geo.reason})`);
      continue;
    }

    await enrichStops(course); // 유료 작성 전에 실제 출처 자료 보강(기존 호출 상한 유지)

    // 코스 "구성" Gemini 교차검증 — 자동 코스만(공식은 정부 큐레이션이라 신뢰). 리스트형·공식 제외.
    if (GEMINI && course.format !== "list" && course.source !== "official") {
      if(budget.compositionChecks>=target*2+REBUILD_MAX){
        report.push({id:course.id,title:course.title,outcome:'deferred',reason:'오늘 구성 검사 비용 상한 도달'});
        continue;
      }
      budget.compositionChecks++;save();
      const comp = await checkCourseComposition(course, { apiKey: GEMINI });
      if (!comp.ok) {
        skipped++;
        holdCourse(history,course,`구성 NG: ${comp.reason}`,{transient:comp.retryable});
        report.push({ id: course.id, title: course.title, outcome: "skip", reason: `구성 NG: ${comp.reason.slice(0, 80)}` });
        console.log(`  ✗ 구성 반려: ${course.title} (${comp.reason.slice(0, 60)})`);
        continue;
      }
    }
    // 재생성이면 "자기 자신"을 중복 비교 대상에서 뺀다(옛 글과 비슷하다고 스스로 반려되는 것 방지).
    const prevText = store.articles[course.id]?.content || "";
    const compareTexts = isRebuild ? existingTexts.filter((t) => t !== prevText) : existingTexts;
    budget[isRebuild?'rebuildDrafts':'newDrafts']++;save();
    const { art, reasons } = await produceCourse(course, compareTexts);
    if (!art) {
      skipped++;
      holdCourse(history,course,reasons.slice(-2).join(' | '),{transient:true});
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
    delete history[course.id];
    made++;
    if(!isRebuild){siteNewRemaining--;counts[course.duration]=(counts[course.duration]||0)+1;}
    if (isRebuild) { rebuilt++; const i = existingTexts.indexOf(prevText); if (i >= 0) existingTexts.splice(i, 1); }
    existingTexts.push(art.text);
    report.push({ id: course.id, title: course.title, outcome: isRebuild ? "rebuilt" : "published", detail: `${art.len}자/${course.duration}/${course.area}` });
    console.log(`  ✓ ${isRebuild ? "재생성" : `발행 ${made - rebuilt}/${target}`}: ${course.title} (${art.len}자, ${course.area} ${course.duration}, 관광지 ${selectCourseStops(course).length}곳)`);
    await sleep(800);
   } catch (e) {
    errored++;
    holdCourse(history,course,String(e?.message||e),{transient:true});
    report.push({ id: course.id, title: course.title, outcome: "error", reason: String(e && e.message || e).slice(0, 120) });
    console.log(`  ⚠ 오류(스킵): ${course.title} — ${String(e && e.message || e).slice(0, 100)}`);
   } finally {
    save();
   }
  }

  // 실비 측정 — 코스 글에는 web_search를 쓰지 않으므로 토큰 요금이 곧 전부다.
  const cost = usageCost();
  console.log(`
💰 코스 토큰: 입력 ${usageTotal.in.toLocaleString()} · 출력 ${usageTotal.out.toLocaleString()} · 호출 ${usageTotal.calls}회 → $${cost.toFixed(4)}`);

  store.generatedAt = new Date().toISOString();
  store._lastRun = {
    at: new Date().toISOString(), made, rebuilt, skipped, errored, budget:{...budget},
    usage: { ...usageTotal, costUsd: Number(cost.toFixed(4)) },
    results: report,
  };
  fs.writeFileSync(STORE, JSON.stringify(store, null, 0));
  const pub = Object.values(store.articles).filter((a) => a.status === "published").length;
  console.log(`\n💾 저장: 신규 ${made - rebuilt} · 재생성 ${rebuilt} · 스킵 ${skipped} | 총 코스글 ${pub} / 전체 코스 ${courses.length}\n`);
}

main().catch((e) => { console.error("❌ 실패:", e.message); process.exit(1); });
