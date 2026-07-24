// 기존 data/events.json 을 새 판별 로직(classifyEvent, free_estimated 포함)으로 재분석 (API 호출 없음)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifyEvent,
  priceLabel,
  PRICE_LABELS,
  PRICE_TYPES,
  computeAudiences,
  AUDIENCES,
} from "../lib/classify.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "..", "data", "events.json");

const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
const stat = {};
const audStat = {};
for (const t of PRICE_TYPES) stat[t] = 0;

for (const e of data.events) {
  const p = classifyEvent({
    priceRaw: e.priceRaw,
    genreKey: e.genreKey,
    title: e.title,
    place: e.place,
  });
  e.priceType = p.type;
  e.priceMin = p.min;
  e.priceMax = p.max;
  e.freeCondition = p.freeCondition;
  e.priceLabel = priceLabel(p);
  e.audiences = computeAudiences({
    title: e.title,
    realmName: e.realmName,
    genreKey: e.genreKey,
    contents: e.contents,
    freeCondition: e.freeCondition,
    priceRaw: e.priceRaw,
  });
  for (const a of e.audiences) audStat[a] = (audStat[a] || 0) + 1;
  stat[p.type] = (stat[p.type] || 0) + 1;
}

fs.writeFileSync(FILE, JSON.stringify(data, null, 0));

console.log(`\n📊 재분류 결과 (총 ${data.events.length}건)\n`);
for (const t of PRICE_TYPES) {
  const n = stat[t] || 0;
  const pct = ((n / data.events.length) * 100).toFixed(1);
  console.log(`  ${PRICE_LABELS[t].padEnd(6)} (${t.padEnd(14)}): ${String(n).padStart(4)}건  ${pct}%`);
}

// 무료 추정 랜덤 20건
const est = data.events.filter((e) => e.priceType === "free_estimated");
console.log(`\n🟢 무료 추정(free_estimated) 랜덤 20건 [총 ${est.length}건]:`);
const shuffled = [...est].sort(() => Math.random() - 0.5).slice(0, 20);
shuffled.forEach((e, i) =>
  console.log(`  ${String(i + 1).padStart(2)}. [${e.genreKey}] ${e.title}  @ ${e.area} ${e.place}`)
);

// 남은 unknown 분포
const unk = data.events.filter((e) => e.priceType === "unknown");
const byGenre = {};
for (const e of unk) byGenre[e.genreKey] = (byGenre[e.genreKey] || 0) + 1;
console.log(`\n❓ 남은 unknown ${unk.length}건 분야 분포:`);
for (const [g, n] of Object.entries(byGenre).sort((a, b) => b[1] - a[1]))
  console.log(`  ${g.padEnd(12)}: ${n}건`);

console.log(`\n👥 대상 태깅 분포:`);
for (const a of AUDIENCES)
  console.log(`  ${a.label.padEnd(8)} (${a.key.padEnd(8)}): ${audStat[a.key] || 0}건`);
