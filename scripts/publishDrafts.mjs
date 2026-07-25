// 초안 → 발행 전환 (확인 후 발행)
// 실행: node scripts/publishDrafts.mjs [개수]   (개수 생략 시 전체 초안 발행)
// GitHub Actions의 "글 발행(수동)" 워크플로우에서 호출.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STORE = path.join(ROOT, "data", "place-articles.json");

const limit = Number(process.argv[2] || process.env.PUBLISH_COUNT || 0) || Infinity;

const store = JSON.parse(fs.readFileSync(STORE, "utf8"));
const now = new Date().toISOString();
let n = 0;

for (const a of Object.values(store.articles)) {
  if (n >= limit) break;
  if (a.status === "draft") {
    a.status = "published";
    a.publishedAt = now;
    n++;
  }
}

store.generatedAt = now;
fs.writeFileSync(STORE, JSON.stringify(store, null, 0));

const pub = Object.values(store.articles).filter((a) => a.status === "published").length;
const draft = Object.values(store.articles).filter((a) => a.status === "draft").length;
console.log(`✅ 발행 ${n}건 전환 완료 | 총 발행 ${pub} · 남은 초안 ${draft}`);
