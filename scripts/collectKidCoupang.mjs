// scripts/collectKidCoupang.mjs
// "아이와 함께" 페이지용 쿠팡 상품 4섹션 수집 → data/kidCoupang.json
//   ① 장난감  ② 피크닉 준비물  ③ 오늘의 특가(골드박스)  ④ 나들이 생활용품
// `node scripts/collectKidCoupang.mjs` (COUPANG_ACCESS_KEY/SECRET_KEY 필요)

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gate, MIN_INTERVAL_MS } from "./coupangThrottle.mjs";

function loadEnvLocal() {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnvLocal();
const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY, SECRET_KEY = process.env.COUPANG_SECRET_KEY;
if (!ACCESS_KEY || !SECRET_KEY) { console.error("❌ COUPANG 키가 없습니다."); process.exit(1); }
const DOMAIN = "https://api-gateway.coupang.com";

const TOYS = ["유아 장난감", "블록 장난감", "역할놀이 장난감", "보드게임", "물놀이 장난감", "유아 자동차 장난감"];
const PICNIC = ["피크닉 매트", "캠핑 돗자리", "피크닉 가방", "피크닉 세트", "휴대용 아이스박스", "폴딩 왜건"];
const HOUSEHOLD = ["아기 물티슈", "유아 물통", "휴대용 손소독제", "아동 우비", "유아 간식", "아기 모기 밴드"];

function generateHmac(method, u) {
  const [p, q = ""] = u.split("?");
  const dt = new Date().toISOString().substr(2, 17).replace(/[-:]/g, "") + "Z";
  const sig = crypto.createHmac("sha256", SECRET_KEY).update(dt + method + p + q).digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${dt}, signature=${sig}`;
}
const mapP = (p) => ({ id: String(p.productId), name: p.productName, price: p.productPrice, image: p.productImage, url: p.productUrl, isRocket: !!p.isRocket });
async function apiGet(u) { await gate(); const r = await fetch(DOMAIN + u, { headers: { Authorization: generateHmac("GET", u) } }); if (!r.ok) { console.warn(`  ⚠️ HTTP ${r.status}`); return null; } return r.json().catch(() => null); }
async function search(kw, n = 3) { const j = await apiGet(`/v2/providers/affiliate_open_api/apis/openapi/v1/products/search?keyword=${encodeURIComponent(kw)}&limit=${n}`); return (j?.data?.productData || []).map(mapP); }
async function goldbox() { const j = await apiGet(`/v2/providers/affiliate_open_api/apis/openapi/v1/products/goldbox`); return (j?.data || []).map(mapP); }
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
async function collect(keywords, cap, tag) {
  console.log(tag); const seen = new Set(); const out = [];
  for (const kw of keywords) { const it = await search(kw, 3); for (const x of it) if (!seen.has(x.id)) { seen.add(x.id); out.push(x); } console.log(`  · ${kw}: ${it.length}개`); }
  return shuffle(out).slice(0, cap);
}

async function main() {
  const now = new Date();
  console.log(`🧸 아이 쿠팡 수집 (${now.toISOString().slice(0, 10)})`);
  console.log(`⏳ 레이트리밋 보호: 호출 간격 최소 ${(MIN_INTERVAL_MS / 1000).toFixed(1)}초 (분당 약 ${Math.floor(60000 / MIN_INTERVAL_MS)}회)\n`);
  const toys = await collect(TOYS, 14, "① 장난감");
  const picnic = await collect(PICNIC, 14, "\n② 피크닉 준비물");
  const household = await collect(HOUSEHOLD, 14, "\n④ 나들이 생활용품");
  console.log("\n③ 골드박스"); const gold = shuffle(await goldbox()).slice(0, 12); console.log(`  · 골드박스: ${gold.length}개`);

  const out = {
    generatedAt: now.toISOString(),
    sections: [
      { key: "toys", heading: "🧸 아이 장난감", subtitle: "블록·보드게임·역할놀이까지, 아이가 좋아하는 것들", products: toys },
      { key: "picnic", heading: "🧺 피크닉 준비물", subtitle: "돗자리·왜건·피크닉 세트로 나들이 준비 끝", products: picnic },
      { key: "goldbox", heading: "⚡ 오늘의 쿠팡 특가", subtitle: "쿠팡이 매일 고르는 특가 (아이 상품 외도 섞여 있어요)", products: gold },
      { key: "household", heading: "🧴 나들이 생활용품", subtitle: "물티슈·물통·우비 등 챙기면 든든한 것들", products: household },
    ],
  };
  fs.writeFileSync(path.join(process.cwd(), "data", "kidCoupang.json"), JSON.stringify(out, null, 2), "utf8");
  console.log(`\n✅ 총 ${out.sections.reduce((s, x) => s + x.products.length, 0)}개 저장 → data/kidCoupang.json`);
}
main();
