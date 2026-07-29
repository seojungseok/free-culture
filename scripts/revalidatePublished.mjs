// 발행 파이프라인 후처리 — 최근(WINDOW시간 내) 발행/재작성된 글 페이지만 on-demand revalidate.
//  ISR revalidate를 30일로 길게 두는 대신, 새 글이 나온 페이지만 콕 집어 갱신 → ISR Writes 절감.
//  목록(홈·나들이)도 함께 갱신해 새 글이 목록에 반영되게 함.
//
//  필요 환경변수: REVALIDATE_SECRET(Vercel Production과 동일). 없으면 조용히 건너뜀.
//  선택: SITE_URL(기본 https://mwohaji.kr), REVALIDATE_WINDOW_H(기본 6)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = (process.env.SITE_URL || "https://mwohaji.kr").replace(/\/$/, "");
const SECRET = process.env.REVALIDATE_SECRET;
const WINDOW_MS = Number(process.env.REVALIDATE_WINDOW_H || 6) * 3600 * 1000;

if (!SECRET) { console.log("ℹ️ REVALIDATE_SECRET 없음 — on-demand revalidate 건너뜀"); process.exit(0); }

const file = path.join(ROOT, "data", "place-articles.json");
const articles = JSON.parse(fs.readFileSync(file, "utf8")).articles || {};
const cutoff = Date.now() - WINDOW_MS;

const recentIds = Object.entries(articles)
  .filter(([, a]) => a && a.status === "published")
  .filter(([, a]) => new Date(a.publishedAt || a.generatedAt || 0).getTime() >= cutoff)
  .map(([id]) => id);

// 새 글 상세 + 목록(홈·나들이) 갱신. 새 글 없으면 목록도 건드리지 않고 종료(불필요한 Writes 방지).
if (!recentIds.length) { console.log("ℹ️ 최근 발행글 없음 — revalidate 건너뜀"); process.exit(0); }

const paths = [...new Set(["/", "/places", ...recentIds.map((id) => `/places/spot/${id}`)])];
console.log(`🔄 on-demand revalidate ${paths.length}개 경로 (새 글 ${recentIds.length})`);

const res = await fetch(`${SITE}/api/revalidate?secret=${encodeURIComponent(SECRET)}`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ paths }),
});
const body = await res.text();
if (!res.ok) { console.error(`❌ revalidate 실패 ${res.status}: ${body}`); process.exit(1); }
console.log(`✅ revalidate ${res.status}: ${body}`);
