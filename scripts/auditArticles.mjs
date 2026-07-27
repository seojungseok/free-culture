// 3-5. 기존 발행글 전면 재점검 — 추측성/미사여구/빈 방문팁/속빈글 판정.
//  기본: 진단 리포트만 출력(변경 없음)
//  --write: 재작성 대상에 needsRewrite=true·rewriteReason 표시(발행 상태는 유지 → 재생성 전까지 계속 서빙)
//
// 실행: node scripts/auditArticles.mjs [--write]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { vagueHits, speculativeHits, speculativeRatio, tipsAllEmpty } from "./lib/articleGen.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STORE = path.join(ROOT, "data", "place-articles.json");
const WRITE = process.argv.includes("--write");
const THIN = 480; // 공백 제외 이 미만이면 얇은 글

const stripLen = (md) => String(md || "").replace(/^#+\s/gm, "").replace(/[*_>#`-]/g, "").replace(/\s+/g, "").trim().length;

function audit(a) {
  const body = a.content || "";
  const reasons = [];
  const vh = vagueHits(body);
  if (vh.length) reasons.push(`미사여구(${vh.slice(0, 3).join(",")})`);
  const spec = speculativeHits(body);
  const sr = speculativeRatio(body);
  if (spec.length >= 2 || sr > 0.25) reasons.push(`추측성 ${spec.length}문장(${(sr * 100).toFixed(0)}%)`);
  if (tipsAllEmpty(body)) reasons.push("방문팁 전부 정보없음");
  const len = stripLen(body);
  if (len < THIN) reasons.push(`얇은 글 ${len}자`);
  return { rewrite: reasons.length > 0, reasons, len };
}

function main() {
  const store = JSON.parse(fs.readFileSync(STORE, "utf8"));
  const arts = store.articles || {};
  const rows = [];
  for (const [id, a] of Object.entries(arts)) {
    if (a.status !== "published") continue;
    const r = audit(a);
    rows.push({ id, title: a.title, area: a.area, ...r });
    if (WRITE) {
      if (r.rewrite) { a.needsRewrite = true; a.rewriteReason = r.reasons.join(" · "); }
      else { delete a.needsRewrite; delete a.rewriteReason; }
    }
  }

  const rewrite = rows.filter((r) => r.rewrite);
  const keep = rows.filter((r) => !r.rewrite);
  console.log(`\n📋 발행글 재점검 — 총 ${rows.length}건 · 재작성 ${rewrite.length} · 유지 ${keep.length}\n`);
  console.log("── 재작성 대상 ──");
  for (const r of rewrite.sort((a, b) => a.len - b.len))
    console.log(`  ✗ ${r.title.padEnd(14)} ${String(r.len).padStart(4)}자 · ${r.reasons.join(" · ")}`);
  console.log("\n── 유지 ──");
  for (const r of keep.sort((a, b) => b.len - a.len))
    console.log(`  ✓ ${r.title.padEnd(14)} ${String(r.len).padStart(4)}자`);

  if (WRITE) {
    store._audit = { at: new Date().toISOString(), total: rows.length, rewrite: rewrite.length };
    fs.writeFileSync(STORE, JSON.stringify(store, null, 0));
    console.log(`\n💾 needsRewrite 표시 저장 (${rewrite.length}건). 다음 생성 사이클에서 재작성.`);
  } else {
    console.log("\n(리포트만 — 표시하려면 --write)");
  }
}

main();
