// 원본(overview) 캐시 빌더 — 작동하는 키(로컬)로 미리 받아 data/place-overviews.json 저장.
// 생성 스크립트는 이 캐시를 우선 읽어 GitHub의 TourAPI 401을 우회한다.
//
// 실행:
//   node scripts/cacheOverviews.mjs 2707460,126511,...   (특정 id)
//   node scripts/cacheOverviews.mjs 120                   (우선순위 상위 120곳)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pickQueue } from "./lib/articleGen.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLACES = path.join(ROOT, "data", "places.json");
const OUT = path.join(ROOT, "data", "place-overviews.json");

function loadKey() {
  const p = path.join(ROOT, ".env.local");
  const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
  for (const n of ["TOUR_API_KEY", "DATA_GO_KR_KEY"]) {
    const l = lines.find((x) => x.startsWith(n + "="));
    if (l && l.slice(n.length + 1).trim()) return l.slice(n.length + 1).trim();
  }
  return process.env.DATA_GO_KR_KEY || "";
}
const KEY = loadKey();
if (!KEY) { console.error("❌ 키 없음(.env.local)"); process.exit(1); }
const keyParam = /%[0-9A-Fa-f]{2}/.test(KEY) ? KEY : encodeURIComponent(KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchOverview(id) {
  const url = `https://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${keyParam}&MobileOS=ETC&MobileApp=mwohaji&_type=json&contentId=${id}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const j = await r.json();
  if (j?.response?.header?.resultCode !== "0000") throw new Error(`resultCode ${j?.response?.header?.resultCode}`);
  const it = j?.response?.body?.items?.item;
  const o = (Array.isArray(it) ? it[0] : it)?.overview || "";
  return String(o).replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
}

async function main() {
  const places = JSON.parse(fs.readFileSync(PLACES, "utf8")).spots;
  const cache = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
  const arg = (process.argv[2] || "").trim();

  let ids;
  if (/^[0-9]+$/.test(arg)) {
    // 숫자 하나 → 우선순위 상위 N곳
    ids = pickQueue(places, new Set(Object.keys(cache)), Number(arg)).map((p) => p.id);
  } else {
    ids = arg.split(",").map((s) => s.trim()).filter(Boolean);
  }

  console.log(`\n📥 원본 캐시 수집 대상 ${ids.length}곳 (기존 캐시 ${Object.keys(cache).length})`);
  let ok = 0, fail = 0;
  for (const id of ids) {
    try {
      cache[id] = await fetchOverview(id);
      ok++;
      if (ok % 20 === 0) console.log(`  ...${ok}곳`);
    } catch (e) {
      fail++;
      console.log(`  ✗ ${id}: ${e.message}`);
    }
    await sleep(200);
  }
  fs.writeFileSync(OUT, JSON.stringify(cache));
  const withText = Object.values(cache).filter((v) => v && v.length >= 200).length;
  console.log(`\n💾 저장: data/place-overviews.json | 성공 ${ok} · 실패 ${fail} | 총 ${Object.keys(cache).length}곳(200자+ ${withText})\n`);
}

main().catch((e) => { console.error("실패:", e.message); process.exit(1); });
