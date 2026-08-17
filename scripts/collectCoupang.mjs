// scripts/collectCoupang.mjs
// 캠핑 페이지용 쿠팡 상품을 4개 섹션으로 수집 → data/coupang.json 저장.
// 방문자마다 API를 때리지 않도록(호출 한도 절약) 미리 받아 캐시하는 방식.
//
//   실행: node scripts/collectCoupang.mjs
//   준비: .env.local 또는 환경변수 COUPANG_ACCESS_KEY, COUPANG_SECRET_KEY
//
// 섹션:
//   1) staples  — 캠핑 필수템(텐트·의자·코펠·버너 등). 고정 키워드, 상품은 매 수집마다 로테이션
//   2) seasonal — 오늘 날짜로 계절 자동 판단(봄/여름/가을/겨울)
//   3) food     — 캠핑 간편음식(밀키트·즉석밥·라면 등)
//   4) goldbox  — 쿠팡 골드박스(매일 특가). 카테고리 혼합(캠핑 외 상품도 포함)

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

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
  console.error("❌ COUPANG_ACCESS_KEY / COUPANG_SECRET_KEY 가 없습니다 (.env.local 또는 환경변수).");
  process.exit(1);
}

const DOMAIN = "https://api-gateway.coupang.com";

// --- 섹션별 키워드 ------------------------------------------------------
const STAPLE_KEYWORDS = ["캠핑 텐트", "캠핑 의자", "코펠", "캠핑 버너", "캠핑 랜턴", "아이스박스", "캠핑 테이블", "캠핑 타프"];
// 간편음식: 불 없이 먹는 "신기한" 것 위주 (당기면 데워지는 발열도시락 등)
const FOOD_KEYWORDS = ["발열 도시락", "자가발열 국밥", "전투식량", "발열팩 즉석식", "휴대용 발열도시락", "캠핑 마시멜로", "즉석 짜장밥"];

const SEASONS = {
  spring: { label: "봄", heading: "🌸 봄 캠핑 용품", subtitle: "선선한 봄, 캠핑 나서기 전 챙기면 좋은 것들",
    keywords: ["캠핑 돗자리", "황사 마스크", "캠핑 화로대", "감성 캠핑 랜턴", "캠핑 담요", "캠핑 폴딩박스"] },
  summer: { label: "여름", heading: "☀️ 여름 캠핑 용품", subtitle: "무더위·모기 대비, 여름 캠핑 필수템",
    keywords: ["캠핑 모기장", "휴대용 선풍기", "쿨매트", "캠핑 그늘막", "캠핑 아이스박스", "차량용 선풍기"] },
  autumn: { label: "가을", heading: "🍂 가을 감성 캠핑 용품", subtitle: "선선한 밤, 불멍하기 좋은 계절",
    keywords: ["캠핑 화로대", "감성 캠핑 랜턴", "캠핑 담요", "캠핑 난로", "캠핑 무드등", "캠핑 워머"] },
  winter: { label: "겨울", heading: "❄️ 겨울 캠핑 용품", subtitle: "추위 대비, 따뜻한 겨울 캠핑을 위해",
    keywords: ["캠핑 난로", "전기장판", "동계 침낭", "핫팩", "캠핑 온수매트", "방한 텐트"] },
};
function seasonOf(month /* 1~12 */) {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

// --- HMAC 서명 ----------------------------------------------------------
function generateHmac(method, urlPathWithQuery) {
  const [path_, query = ""] = urlPathWithQuery.split("?");
  const datetime = new Date().toISOString().substr(2, 17).replace(/[-:]/g, "") + "Z";
  const message = datetime + method + path_ + query;
  const signature = crypto.createHmac("sha256", SECRET_KEY).update(message).digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${datetime}, signature=${signature}`;
}
function mapProduct(p) {
  return {
    id: String(p.productId),
    name: p.productName,
    price: p.productPrice,
    image: p.productImage,
    url: p.productUrl,
    isRocket: !!p.isRocket,
  };
}
async function apiGet(urlPath) {
  const res = await fetch(DOMAIN + urlPath, { method: "GET", headers: { Authorization: generateHmac("GET", urlPath) } });
  if (!res.ok) { console.warn(`  ⚠️ HTTP ${res.status} — ${urlPath.slice(0, 70)}`); return null; }
  return res.json().catch(() => null);
}
async function searchProducts(keyword, limit = 3) {
  const urlPath = `/v2/providers/affiliate_open_api/apis/openapi/v1/products/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
  const json = await apiGet(urlPath);
  return (json?.data?.productData || []).map(mapProduct);
}
async function goldbox() {
  const json = await apiGet(`/v2/providers/affiliate_open_api/apis/openapi/v1/products/goldbox`);
  return (json?.data || []).map(mapProduct);
}

const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };

async function collectByKeywords(keywords, perKw, cap) {
  const seen = new Set();
  const out = [];
  for (const kw of keywords) {
    const items = await searchProducts(kw, perKw);
    for (const it of items) { if (!seen.has(it.id)) { seen.add(it.id); out.push(it); } }
    process.stdout.write(`  · ${kw}: ${items.length}개\n`);
    await new Promise((r) => setTimeout(r, 220));
  }
  return shuffle(out).slice(0, cap); // 매 수집마다 순서 셔플 → "매번 바뀌는" 느낌
}

async function main() {
  const now = new Date();
  const season = seasonOf(now.getMonth() + 1);
  const scfg = SEASONS[season];
  console.log(`🗓️  ${now.toISOString().slice(0, 10)} · ${scfg.label} 시즌 — 4개 섹션 수집\n`);

  console.log("① 캠핑 필수템");
  const staples = await collectByKeywords(STAPLE_KEYWORDS, 3, 16);
  console.log(`\n② 계절별(${scfg.label})`);
  const seasonal = await collectByKeywords(scfg.keywords, 3, 14);
  console.log("\n③ 캠핑 간편음식");
  const food = await collectByKeywords(FOOD_KEYWORDS, 3, 14);
  console.log("\n④ 골드박스(매일 특가)");
  const gold = shuffle(await goldbox()).slice(0, 14);
  console.log(`  · 골드박스: ${gold.length}개`);

  const out = {
    generatedAt: now.toISOString(),
    season,
    seasonLabel: scfg.label,
    sections: [
      { key: "staples", heading: "🏕️ 캠핑 필수템", subtitle: "텐트·의자·코펠·버너까지, 빠지면 아쉬운 준비물", products: staples },
      { key: "seasonal", heading: scfg.heading, subtitle: scfg.subtitle, products: seasonal },
      { key: "food", heading: "🍲 불 없이 먹는 신기한 캠핑 음식", subtitle: "당기면 뜨거워지는 발열도시락처럼, 신기하게 즐기는 먹거리", products: food },
      { key: "goldbox", heading: "⚡ 오늘의 쿠팡 특가", subtitle: "쿠팡이 매일 고르는 특가 (캠핑 외 상품도 섞여 있어요)", products: gold },
    ],
  };

  const outPath = path.join(process.cwd(), "data", "coupang.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  const total = out.sections.reduce((s, x) => s + x.products.length, 0);
  console.log(`\n✅ 총 ${total}개 상품 (4섹션) 저장 → data/coupang.json`);
}

main();
