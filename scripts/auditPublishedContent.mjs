// Cross-collection audit for already public informational pages.
// It never rewrites, hides, or deletes a page.  It stores deterministic review
// markers so an editor can improve a factually risky page before touching copy.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WRITE = process.argv.includes("--write");
const TODAY = new Date();
const VERSION = 1;

function load(relative, fallback) {
  const file = path.join(ROOT, relative);
  const raw = fs.readFileSync(file, "utf8");
  return { file, raw, value: raw.trim() ? JSON.parse(raw) : fallback };
}
function save({ file, raw, value }) {
  // Keep the repository's existing JSON style to avoid a formatting-only diff.
  const pretty = /\n\s{2}"/.test(raw) ? 2 : 0;
  fs.writeFileSync(file, JSON.stringify(value, null, pretty) + "\n");
}
function textLength(value) {
  return String(value || "").replace(/[#*_>`-]/g, " ").replace(/\s+/g, " ").trim().length;
}
function count(value, pattern) {
  return (String(value || "").match(pattern) || []).length;
}
function hasRepeatedVisitHeading(value) {
  const headings = [...String(value || "").matchAll(/^##\s*(방문\s*팁|가는\s*길(?:·주차)?|주차).*$/gm)]
    .map((match) => match[1].replace(/\s/g, ""));
  return headings.length > new Set(headings).size;
}
function dated(value) {
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? ms : null;
}
function daysOld(value) {
  const ms = dated(value);
  return ms === null ? null : Math.floor((TODAY.getTime() - ms) / 86400000);
}
function reasonsForPlace(article) {
  const reasons = [];
  const primary = article.verify || "미기록";
  const independent = article.factcheck2 || "미기록";
  if (article.minimalMode) reasons.push(["minimal_fallback", "최소 가공 폴백으로 작성됨", "high"]);
  if (primary !== "PASS" && independent !== "PASS") reasons.push(["fact_check_unconfirmed", `검증 확인 필요: 1차 ${primary}, 교차 ${independent}`, "high"]);
  else if (primary !== "PASS") reasons.push(["fact_check_mismatch", `1차 검증 불일치: ${primary} (교차 ${independent})`, "review"]);
  if (article.needsRewrite) reasons.push(["existing_rewrite_flag", article.rewriteReason || "기존 품질 점검에서 보완 표시", "review"]);
  if (textLength(article.content) < 600) reasons.push(["thin_article", `본문 ${textLength(article.content)}자`, "review"]);
  if (hasRepeatedVisitHeading(article.content)) reasons.push(["duplicate_visit_section", "같은 방문 정보 소제목이 반복됨", "review"]);
  return reasons;
}
function reasonsForCourse(article, rawCourse) {
  const reasons = [];
  const body = article.content || "";
  if (!rawCourse) reasons.push(["missing_source_course", "연결할 원본 코스 자료를 찾지 못함", "high"]);
  if (textLength(body) < 1200) reasons.push(["thin_course_article", `본문 ${textLength(body)}자`, "review"]);
  if (rawCourse?.source !== "official") reasons.push(["auto_route_editorial_check", "자동 조합 코스: 실제 이동·체류 근거를 편집 확인", "review"]);
  if (count(body, /1\s*[~∼-]\s*2시간/g) >= 3) reasons.push(["generic_duration_check", "반복된 체류시간 제안의 근거 확인", "review"]);
  return reasons;
}
function reasonsForCity(article) {
  const reasons = [];
  if (!article.reviewed) reasons.push(["not_editorially_reviewed", "발행 전 편집 검토 기록 없음", "high"]);
  if (!article.officialUrl) reasons.push(["missing_official_url", "운행 정보 확인용 공식 주소 없음", "high"]);
  const age = daysOld(article.raw?.["데이터기준일자"]);
  if (age === null) reasons.push(["missing_data_date", "원본 데이터 기준일 없음", "high"]);
  else if (age > 120) reasons.push(["stale_operation_data", `운행·요금 원본이 ${age}일 전 기준`, "review"]);
  return reasons;
}
function mark(article, reasons) {
  const priority = reasons.some(([, , level]) => level === "high") ? "high" : reasons.length ? "review" : "clear";
  const next = reasons.length ? {
    version: VERSION,
    priority,
    reasons: reasons.map(([code, label]) => ({ code, label })),
  } : undefined;
  const before = JSON.stringify(article.qualityAudit || null);
  if (next) article.qualityAudit = next;
  else delete article.qualityAudit;
  return before !== JSON.stringify(article.qualityAudit || null);
}

function main() {
  const places = load("data/place-articles.json", { articles: {} });
  const courses = load("data/course-articles.json", { articles: {} });
  const cityTours = load("data/city-tour-articles.json", { articles: [] });
  const sourceCourses = [
    ...(load("data/courses.json", { courses: [] }).value.courses || []),
    ...(load("data/courses-auto.json", { courses: [] }).value.courses || []),
  ];
  const courseById = new Map(sourceCourses.map((course) => [course.id, course]));
  const rows = [];
  let changed = false;

  for (const [id, article] of Object.entries(places.value.articles || {})) {
    if (article.status !== "published") continue;
    const reasons = reasonsForPlace(article);
    changed = mark(article, reasons) || changed;
    if (reasons.length) rows.push({ kind: "관광지", id, title: article.title, priority: article.qualityAudit.priority, reasons });
  }
  for (const [id, article] of Object.entries(courses.value.articles || {})) {
    if (article.status !== "published") continue;
    const reasons = reasonsForCourse(article, courseById.get(id));
    changed = mark(article, reasons) || changed;
    if (reasons.length) rows.push({ kind: "여행코스", id, title: article.title, priority: article.qualityAudit.priority, reasons });
  }
  for (const article of cityTours.value.articles || []) {
    const reasons = reasonsForCity(article);
    changed = mark(article, reasons) || changed;
    if (reasons.length) rows.push({ kind: "시티투어", id: article.id, title: article.title, priority: article.qualityAudit.priority, reasons });
  }

  const high = rows.filter((row) => row.priority === "high");
  const review = rows.filter((row) => row.priority === "review");
  console.log(`공개 글 품질 점검: 검토 ${rows.length}건 · 우선 확인 ${high.length}건 · 보완 검토 ${review.length}건`);
  for (const row of [...high, ...review].slice(0, 30)) {
    console.log(`- [${row.priority}] ${row.kind} ${row.id} ${row.title}: ${row.reasons.map(([, label]) => label).join(" · ")}`);
  }
  if (rows.length > 30) console.log(`… 추가 ${rows.length - 30}건은 데이터의 qualityAudit 필드에 기록됨`);
  if (WRITE && changed) {
    save(places); save(courses); save(cityTours);
    console.log("품질 검토 표식을 저장했습니다. 공개 본문·URL·상태는 변경하지 않았습니다.");
  } else if (WRITE) console.log("품질 검토 표식 변경 없음");
}

main();
