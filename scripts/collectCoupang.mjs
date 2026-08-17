// scripts/collectCoupang.mjs
// 계절별 캠핑용품을 쿠팡 오픈 API로 하루 1번 수집 → data/coupang.json 저장.
// 방문자마다 API를 때리지 않도록(호출 한도 절약) 미리 받아 캐시하는 방식.
//
//   실행: node scripts/collectCoupang.mjs
//   준비: .env.local 또는 환경변수 COUPANG_ACCESS_KEY, COUPANG_SECRET_KEY
//
// 오늘 날짜로 계절을 판단해 해당 계절 키워드만 수집한다.
// → 계절이 바뀌면 노출 상품도 자동으로 바뀜(손 안 댐).

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

// --- 계절별 키워드 ------------------------------------------------------
// season 키: spring/summer/autumn/winter. label/heading 은 컴포넌트에서 사용.
const SEASONS = {
  spring: {
    label: "봄",
    heading: "🌸 봄 캠핑 준비물",
    subtitle: "선선한 봄, 캠핑 나서기 전 챙기면 좋은 것들",
    keywords: ["캠핑 텐트", "캠핑 의자", "캠핑 테이블", "돗자리", "캠핑 랜턴", "황사 마스크"],
  },
  summer: {
    label: "여름",
    heading: "☀️ 여름 캠핑, 이건 챙기셨어요?",
    subtitle: "무더위·모기 대비, 여름 캠핑 필수템",
    keywords: ["캠핑 모기장", "아이스박스", "휴대용 선풍기", "캠핑 타프", "쿨매트", "캠핑 그늘막"],
  },
  autumn: {
    label: "가을",
    heading: "🍂 가을 감성 캠핑 준비물",
    subtitle: "선선한 밤, 불멍하기 좋은 계절",
    keywords: ["화로대", "감성 캠핑 랜턴", "캠핑 담요", "캠핑 난로", "캠핑 의자", "캠핑 코펠"],
  },
  winter: {
    label: "겨울",
    heading: "❄️ 겨울 캠핑 필수템",
    subtitle: "추위 대비, 따뜻한 겨울 캠핑을 위해",
    keywords: ["캠핑 난로", "전기장판", "동계 침낭", "핫팩", "캠핑 온수매트", "방한 텐트"],
  },
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

async function searchProducts(keyword, limit = 3) {
  const urlPath =
    `/v2/providers/affiliate_open_api/apis/openapi/v1/products/search` +
    `?keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
  const res = await fetch(DOMAIN + urlPath, {
    method: "GET",
    headers: { Authorization: generateHmac("GET", urlPath) },
  });
  if (!res.ok) {
    console.warn(`  ⚠️ "${keyword}" 실패: HTTP ${res.status}`);
    return [];
  }
  const json = await res.json().catch(() => null);
  const list = json?.data?.productData || [];
  return list.map((p) => ({
    id: String(p.productId),
    name: p.productName,
    price: p.productPrice,
    image: p.productImage,
    url: p.productUrl,
    isRocket: !!p.isRocket,
    keyword,
  }));
}

async function main() {
  const now = new Date();
  const season = seasonOf(now.getMonth() + 1);
  const cfg = SEASONS[season];
  console.log(`🗓️  오늘 ${now.toISOString().slice(0, 10)} → ${cfg.label} 시즌 수집 시작\n`);

  const seen = new Set();
  const products = [];
  for (const kw of cfg.keywords) {
    const items = await searchProducts(kw, 3);
    for (const it of items) {
      if (seen.has(it.id)) continue;
      seen.add(it.id);
      products.push(it);
    }
    console.log(`  · ${kw}: ${items.length}개`);
    await new Promise((r) => setTimeout(r, 250)); // 호출 간 약간의 간격
  }

  const out = {
    season,
    label: cfg.label,
    heading: cfg.heading,
    subtitle: cfg.subtitle,
    generatedAt: now.toISOString(),
    products,
  };

  const outPath = path.join(process.cwd(), "data", "coupang.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log(`\n✅ 총 ${products.length}개 상품 저장 → data/coupang.json (${cfg.label} 시즌)`);
}

main();
