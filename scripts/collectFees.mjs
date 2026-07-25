// 입장료 상태 백필 — detailIntro2로 문화시설(14)·레포츠(28) 요금을 조회해 data/place-fees.json에 캐시.
// 관광지(12)는 요금 필드가 없어 대상 아님. 일 1,000회 한도 → 하루 상한(FEE_DAILY, 기본 900)만큼만.
// 실행: node scripts/collectFees.mjs   (GitHub Action이 매일 실행, 며칠에 걸쳐 완주)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLACES = path.join(ROOT, "data", "places.json");
const OUT = path.join(ROOT, "data", "place-fees.json");
const DAILY = Number(process.env.FEE_DAILY || 900);

function loadKey() {
  if (process.env.TOUR_API_KEY) return process.env.TOUR_API_KEY.trim();
  if (process.env.DATA_GO_KR_KEY) return process.env.DATA_GO_KR_KEY.trim();
  const p = path.join(ROOT, ".env.local");
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
    for (const n of ["TOUR_API_KEY", "DATA_GO_KR_KEY"]) {
      const l = lines.find((x) => x.startsWith(n + "="));
      if (l && l.slice(n.length + 1).trim()) return l.slice(n.length + 1).trim();
    }
  }
  return "";
}
const KEY = loadKey();
if (!KEY) { console.error("❌ TOUR_API_KEY / DATA_GO_KR_KEY 없음"); process.exit(1); }

function classifyAdmission(fee) {
  const s = String(fee || "").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
  if (!s) return "unknown";
  const hasPrice = /\d[\d,]*\s*원/.test(s);
  const hasFree = /무료/.test(s);
  if (hasFree && !hasPrice) return "free";
  if (hasPrice) return "paid";
  if (hasFree) return "free";
  return "unknown";
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchFee(id, type) {
  const url = `https://apis.data.go.kr/B551011/KorService2/detailIntro2?serviceKey=${encodeURIComponent(KEY)}&MobileOS=ETC&MobileApp=mwohaji&_type=json&contentId=${id}&contentTypeId=${type}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const j = await res.json();
  if (j?.response?.header?.resultCode !== "0000") throw new Error(`resultCode=${j?.response?.header?.resultCode}`);
  const it0 = j?.response?.body?.items?.item;
  const it = Array.isArray(it0) ? it0[0] : it0;
  const fee = type === "14" ? it?.usefee : it?.usefeeleports;
  return classifyAdmission(fee);
}

async function main() {
  const places = JSON.parse(fs.readFileSync(PLACES, "utf8")).spots;
  const store = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { generatedAt: null, fees: {} };
  store.fees ||= {};

  const targets = places.filter((p) => (p.type === "14" || p.type === "28") && !(p.id in store.fees));
  const batch = targets.slice(0, DAILY);
  console.log(`\n💳 입장료 백필 — 대상(미수집 14/28) ${targets.length} · 이번 실행 ${batch.length} (상한 ${DAILY})`);

  let done = 0, calls = 0;
  for (const p of batch) {
    try {
      store.fees[p.id] = await fetchFee(p.id, p.type);
      calls++;
      done++;
    } catch (e) {
      // 실패는 저장 안 함(다음 실행에서 재시도)
      console.log(`  · ${p.title} 실패: ${e.message}`);
    }
    await sleep(200);
  }

  store.generatedAt = new Date().toISOString();
  fs.writeFileSync(OUT, JSON.stringify(store));
  const v = Object.values(store.fees);
  const remain = targets.length - done;
  console.log(`\n💾 저장: 이번 ${done}건(${calls}콜) · 누적 ${v.length} (무료 ${v.filter(x=>x==="free").length} · 유료 ${v.filter(x=>x==="paid").length} · 미상 ${v.filter(x=>x==="unknown").length}) · 남은 대상 ${remain}\n`);
}

main().catch((e) => { console.error("❌ 실패:", e.message); process.exit(1); });
