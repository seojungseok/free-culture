// scripts/collectEventCoupang.mjs
// 문화행사(공연·전시) 페이지용 쿠팡 상품 수집 → data/eventCoupang.json
//   ① 관람 필수템(공통)  ② 장르 맞춤(음악/공연/전시/가족)  ③ 나들이 소품(공통)  ④ 골드박스
// 방문자마다 API를 때리지 않도록 미리 받아 캐시. `node scripts/collectEventCoupang.mjs`

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

const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY;
const SECRET_KEY = process.env.COUPANG_SECRET_KEY;
if (!ACCESS_KEY || !SECRET_KEY) {
  console.error("❌ COUPANG_ACCESS_KEY / COUPANG_SECRET_KEY 가 없습니다.");
  process.exit(1);
}
const DOMAIN = "https://api-gateway.coupang.com";

// --- 키워드 -------------------------------------------------------------
const ESSENTIALS = ["오페라글라스", "공연용 쌍안경", "여행 목베개", "무릎 담요", "보조배터리", "휴대용 우산"];
const OUTING = ["텀블러", "미니 크로스백", "핸드크림", "휴대용 방석", "블루투스 이어폰"];
const GENRES = {
  음악: { heading: "🎵 콘서트 즐기는 아이템", subtitle: "공연장에서 더 신나게", keywords: ["콘서트 귀마개", "응원봉", "공연용 쌍안경", "슬로건 타월"] },
  공연: { heading: "🎭 공연 관람 아이템", subtitle: "무대가 멀어도 생생하게", keywords: ["오페라글라스", "여행 목베개", "무릎 담요", "휴대용 방석"] },
  전시: { heading: "🖼️ 전시 관람 아이템", subtitle: "오래 걸어도 편하게", keywords: ["신발 깔창", "에코백", "블루라이트 차단 안경", "미니 노트"] },
  가족: { heading: "👨‍👩‍👧 아이와 함께 아이템", subtitle: "가족 나들이에 챙기면 좋은", keywords: ["아기 목베개", "휴대용 방석", "물티슈", "아이 간식"] },
};

// --- HMAC ---------------------------------------------------------------
function generateHmac(method, urlPathWithQuery) {
  const [path_, query = ""] = urlPathWithQuery.split("?");
  const datetime = new Date().toISOString().substr(2, 17).replace(/[-:]/g, "") + "Z";
  const message = datetime + method + path_ + query;
  const signature = crypto.createHmac("sha256", SECRET_KEY).update(message).digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${datetime}, signature=${signature}`;
}
const mapProduct = (p) => ({ id: String(p.productId), name: p.productName, price: p.productPrice, image: p.productImage, url: p.productUrl, isRocket: !!p.isRocket });
async function apiGet(urlPath) {
  await gate(); // 분당 8회 이하로 호출 간격 강제 (쿠팡 레이트리밋 패널티 방지)
  const res = await fetch(DOMAIN + urlPath, { headers: { Authorization: generateHmac("GET", urlPath) } });
  if (!res.ok) { console.warn(`  ⚠️ HTTP ${res.status} — ${urlPath.slice(0, 60)}`); return null; }
  return res.json().catch(() => null);
}
async function search(keyword, limit = 3) {
  const j = await apiGet(`/v2/providers/affiliate_open_api/apis/openapi/v1/products/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`);
  return (j?.data?.productData || []).map(mapProduct);
}
async function goldbox() {
  const j = await apiGet(`/v2/providers/affiliate_open_api/apis/openapi/v1/products/goldbox`);
  return (j?.data || []).map(mapProduct);
}
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
async function collect(keywords, perKw, cap, tag) {
  const seen = new Set(); const out = [];
  for (const kw of keywords) {
    const items = await search(kw, perKw);
    for (const it of items) if (!seen.has(it.id)) { seen.add(it.id); out.push(it); }
    console.log(`  · ${kw}: ${items.length}개`);
  }
  return shuffle(out).slice(0, cap);
}

async function main() {
  const now = new Date();
  console.log(`🎭 문화행사 쿠팡 수집 시작 (${now.toISOString().slice(0, 10)})`);
  console.log(`⏳ 레이트리밋 보호: 호출 간격 최소 ${(MIN_INTERVAL_MS / 1000).toFixed(1)}초 (분당 약 ${Math.floor(60000 / MIN_INTERVAL_MS)}회)\n`);

  console.log("① 관람 필수템");
  const essentials = await collect(ESSENTIALS, 3, 14);
  console.log("\n③ 나들이 소품");
  const outing = await collect(OUTING, 3, 12);

  const genres = {};
  for (const [key, cfg] of Object.entries(GENRES)) {
    console.log(`\n② 장르: ${key}`);
    genres[key] = { heading: cfg.heading, subtitle: cfg.subtitle, products: await collect(cfg.keywords, 3, 12) };
  }

  console.log("\n④ 골드박스");
  const gold = shuffle(await goldbox()).slice(0, 12);
  console.log(`  · 골드박스: ${gold.length}개`);

  const out = {
    generatedAt: now.toISOString(),
    essentials: { heading: "🎫 관람 챙길 아이템", subtitle: "공연·전시 보러 갈 때 있으면 좋은 것들", products: essentials },
    outing: { heading: "👜 나들이 소품", subtitle: "관람 전후 외출에 유용한 소품", products: outing },
    goldbox: { heading: "⚡ 오늘의 쿠팡 특가", subtitle: "쿠팡이 매일 고르는 특가 (문화행사 외 상품도 섞여 있어요)", products: gold },
    genres,
  };

  fs.writeFileSync(path.join(process.cwd(), "data", "eventCoupang.json"), JSON.stringify(out, null, 2), "utf8");
  const total = essentials.length + outing.length + gold.length + Object.values(genres).reduce((s, g) => s + g.products.length, 0);
  console.log(`\n✅ 총 ${total}개 상품 저장 → data/eventCoupang.json`);
}
main();
