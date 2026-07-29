// 캠핑 이미지 백필 — 대표이미지(firstImageUrl) 없는 캠핑장을 goCamping imageList로 보강.
//  대표이미지는 없지만 갤러리 사진은 등록된 곳을 복구 → data/camping-images.json { id: imageUrl }.
//  goCamping은 KorService2와 별도 서비스(한도 분리). 미수집만, CIMG_DAILY(기본 1000)만큼.
// 실행:
//   node scripts/collectCampingImages.mjs
//   CIMG_DAILY=300 node scripts/collectCampingImages.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CAMPING = path.join(ROOT, "data", "camping.json");
const OUT = path.join(ROOT, "data", "camping-images.json");
const BASE = "https://apis.data.go.kr/B551011/GoCamping";
const DAILY = Number(process.env.CIMG_DAILY || 1000);

function loadKey() {
  if (process.env.DATA_GO_KR_KEY) return process.env.DATA_GO_KR_KEY.trim();
  if (process.env.TOUR_API_KEY) return process.env.TOUR_API_KEY.trim();
  const p = path.join(ROOT, ".env.local");
  const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
  for (const n of ["DATA_GO_KR_KEY", "TOUR_API_KEY"]) {
    const l = lines.find((x) => x.startsWith(n + "="));
    if (l && l.slice(n.length + 1).trim()) return l.slice(n.length + 1).trim();
  }
  return "";
}
const KEY = loadKey();
if (!KEY) { console.error("❌ DATA_GO_KR_KEY 없음"); process.exit(1); }
const KP = /%[0-9A-Fa-f]{2}/.test(KEY) ? KEY : encodeURIComponent(KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const https = (u) => String(u || "").replace(/^http:\/\//i, "https://");

async function imageOf(contentId) {
  const url = `${BASE}/imageList?serviceKey=${KP}&numOfRows=1&pageNo=1&MobileOS=ETC&MobileApp=mwohaji&_type=json&contentId=${contentId}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const t = await r.text();
  if (/Unauthorized|LIMIT|초과/i.test(t) && t[0] !== "{") throw new Error(`한도/인증: ${t.slice(0, 40)}`);
  const j = JSON.parse(t);
  const code = j?.response?.header?.resultCode;
  if (code === "22" || code === "99") throw new Error(`resultCode ${code} (한도)`);
  const it = arr(j?.response?.body?.items?.item)[0];
  return it?.imageUrl ? https(it.imageUrl) : "";
}

async function main() {
  const camps = JSON.parse(fs.readFileSync(CAMPING, "utf8")).camps || [];
  const store = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};

  // 대표이미지 없음 + 아직 백필 시도 안 함(=키에 없음)
  const targets = camps.filter((c) => !c.image && !(c.id in store));
  const batch = targets.slice(0, DAILY);
  console.log(`\n🏕️📷 캠핑 이미지 백필 — 대표이미지 없음 ${targets.length} · 이번 실행 ${batch.length} (상한 ${DAILY})`);

  let ok = 0, empty = 0, fail = 0;
  for (const c of batch) {
    try {
      const img = await imageOf(c.id);
      store[c.id] = img; // 빈 문자열도 기록 → 다음 실행에서 재시도 안 함
      if (img) ok++; else empty++;
    } catch (e) {
      if (/한도/.test(e.message)) { console.log(`\n⛔ ${e.message} — 진행분 저장 후 중단`); break; }
      fail++;
      if (fail <= 5) console.log(`  · ${c.name} 실패: ${e.message}`);
    }
    await sleep(200);
  }

  fs.writeFileSync(OUT, JSON.stringify(store));
  const recovered = Object.values(store).filter((v) => v).length;
  console.log(`\n💾 저장: data/camping-images.json`);
  console.log(`   이번: 복구 ${ok} · 사진없음 ${empty} · 실패 ${fail}`);
  console.log(`   누적 시도 ${Object.keys(store).length} · 복구 성공 ${recovered} · 남은 대상 ${Math.max(0, targets.length - batch.length)}\n`);
}
main().catch((e) => { console.error("❌ 실패:", e.message); process.exit(1); });
