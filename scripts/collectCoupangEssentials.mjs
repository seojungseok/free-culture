// scripts/collectCoupangEssentials.mjs
// 캠핑 "글 중간"에 넣을 생필품 링크 풀을 만든다 → data/coupangEssentials.json
//
// 무엇을 담나 — **쿠팡 판매량 상위(베스트셀러)** 생필품.
//   `products/bestcategories/{id}` 는 카테고리별 판매 순위(rank)를 그대로 준다.
//   ① 1013 주방용품 — 키친타월·위생장갑·랩·롤백·종이컵·지퍼백·일회용 수저. 캠핑에서 그대로 쓰는 것들이 상위권.
//   ② 1012 식품     — 생수(무라벨 샘물)가 판매 상위권에 다수.
//   ③ 일회용 접시·종이컵·지퍼백 등 — 베스트 목록(약 95개)에 다 안 들어와서 검색으로 보충(로테이션).
//   ※ 1014 생활용품은 상위권이 유아 손수건·기저귀 쓰레기봉투라 캠핑과 안 맞아 쓰지 않는다.
//
// 가격은 저장도 노출도 하지 않는다(수시로 바뀌어 낡은 값 표기는 금지 + "얼마지?" 궁금증이 클릭 동기).
// rank도 "몇 위"로는 안 쓴다 — 페이지 캐시가 길어 숫자는 금방 낡는다. "판매량 상위"까지만 사실로 표기.
//
// ★ 레이트리밋: 쿠팡 API는 분당 6회 미만(coupangThrottle.mjs).
//   1회 실행 = 베스트 2 + 검색 1 + 골드박스 1 = **4콜**(약 42초). 결과는 기존 풀에 누적한다.
//
//   실행: node scripts/collectCoupangEssentials.mjs
//   준비: COUPANG_ACCESS_KEY / COUPANG_SECRET_KEY (.env.local 또는 환경변수)

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
  console.error("❌ COUPANG_ACCESS_KEY / COUPANG_SECRET_KEY 가 없습니다 (.env.local 또는 환경변수).");
  process.exit(1);
}

const DOMAIN = "https://api-gateway.coupang.com";
const OUT = path.join(process.cwd(), "data", "coupangEssentials.json");
const POOL_MAX = Number(process.env.ESSENTIALS_POOL_MAX) || 60;

// 판매 순위를 가져올 카테고리
const BEST_CATEGORIES = [
  { id: 1013, name: "주방용품" },
  { id: 1012, name: "식품" },
];
// 베스트 목록에 안 잡히는 것만 검색으로 보충 — 매 실행 하나씩 돌린다.
//  캠핑에서 많이 담는 것 위주(물티슈·화장지는 카드 후순위라 하나만 남김).
const FILL_KEYWORDS = ["캠핑 일회용 접시", "캠핑 종이컵", "캠핑 지퍼백", "휴대용 물티슈"];

// 캠핑에서 실제로 쓰는 것만 남긴다(종류 판정 겸용). 위에서부터 먼저 맞는 것으로 분류.
//  ★ "주방용품" 한 덩어리로 묶으면 카드에 키친타월이 두 개 나오는 식이 되므로 세분화한다.
//    생수는 카드 첫 줄 고정이고, 나머지 두 줄은 아래 종류 중 서로 다른 것으로 채운다.
const KINDS = [
  { kind: "물", label: "생수", re: /생수|샘물|먹는샘물|미네랄워터/ },
  { kind: "장갑", label: "위생장갑", re: /위생장갑|니트릴장갑|고무장갑|비닐장갑/ },
  { kind: "봉투", label: "지퍼백", re: /지퍼백|롤백|크린백|위생롤백|위생봉투|밀폐백/ },
  { kind: "식기", label: "일회용 식기", re: /종이컵|종이용기|일회용\s?(숟가락|젓가락|수저|접시|용기|그릇)|나무젓가락/ },
  { kind: "타월", label: "키친타월", re: /키친타월|키친타올|위생행주|행주/ },
  { kind: "랩", label: "랩·호일", re: /프레스앤씰|매직랩|랩(?!톱)|호일|은박지/ },
  { kind: "정리", label: "쓰레기봉투", re: /쓰레기봉투|종량제|비닐봉투/ },
  { kind: "물티슈", label: "물티슈", re: /물티슈/ },
  { kind: "화장지", label: "화장지", re: /화장지|화장실용|롤휴지|두루마리|미용티슈|각티슈/ },
];
// 캠핑과 무관하거나 오해를 부르는 것 — 유아용품·반려용품·가전은 제외.
const EXCLUDE = /기저귀|유아|아기|신생아|분유|이유식|턱받이|손수건|가제|반려|강아지|고양이|매직캔|정수기|필터|에그쿠커|전기|충전|배터리/;

function kindOf(name) {
  if (EXCLUDE.test(name)) return null;
  return KINDS.find((k) => k.re.test(name)) || null;
}

// --- HMAC 서명 ----------------------------------------------------------
function generateHmac(method, urlPathWithQuery) {
  const [path_, query = ""] = urlPathWithQuery.split("?");
  const datetime = new Date().toISOString().substr(2, 17).replace(/[-:]/g, "") + "Z";
  const message = datetime + method + path_ + query;
  const signature = crypto.createHmac("sha256", SECRET_KEY).update(message).digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${datetime}, signature=${signature}`;
}
async function apiGet(urlPath) {
  await gate(); // 분당 6회 미만으로 호출 간격 강제
  const res = await fetch(DOMAIN + urlPath, { method: "GET", headers: { Authorization: generateHmac("GET", urlPath) } });
  if (!res.ok) { console.warn(`  ⚠️ HTTP ${res.status} — ${urlPath.slice(0, 70)}`); return null; }
  return res.json().catch(() => null);
}

// 가격은 담지 않는다 — 페이지에 절대 노출하지 않을 값이라 아예 저장하지 않음(낡은 가격 표기 사고 원천 차단).
function mapProduct(p, k, { best = false, deal = false } = {}) {
  return {
    id: String(p.productId),
    name: String(p.productName || "").replace(/\s+/g, " ").trim(),
    image: p.productImage,
    url: p.productUrl,
    isRocket: !!p.isRocket,
    kind: k.kind,
    label: k.label,
    best,  // 판매량 상위 목록에서 온 것
    deal,  // 골드박스(그날의 특가)에서 온 것
  };
}

const API = "/v2/providers/affiliate_open_api/apis/openapi/v1/products";
async function bestOf(catId) {
  const j = await apiGet(`${API}/bestcategories/${catId}?limit=100`);
  return j?.data || [];
}
async function searchProducts(keyword, limit = 4) {
  const j = await apiGet(`${API}/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`);
  return j?.data?.productData || [];
}
async function goldbox() {
  const j = await apiGet(`${API}/goldbox`);
  return j?.data || [];
}

async function main() {
  const nowIso = new Date().toISOString();
  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
  const pool = Array.isArray(prev.pool) ? prev.pool : [];
  const cursor = Number(prev.cursor) || 0;
  const fillKw = FILL_KEYWORDS[cursor % FILL_KEYWORDS.length];

  console.log(`🧻 생필품(판매량 상위) 수집 — 베스트 ${BEST_CATEGORIES.length}종 + 보충검색 "${fillKw}" + 골드박스`);
  console.log(`⏳ 레이트리밋: 간격 최소 ${(MIN_INTERVAL_MS / 1000).toFixed(1)}초 (분당 ${(60000 / MIN_INTERVAL_MS).toFixed(1)}회) · 이번 실행 4콜\n`);

  const found = [];

  // ① 카테고리별 판매 순위 — rank 순서를 그대로 살려 담는다(앞쪽이 더 많이 팔린 것).
  for (const c of BEST_CATEGORIES) {
    const items = await bestOf(c.id);
    let hit = 0;
    for (const p of items) {
      const k = kindOf(String(p.productName || ""));
      if (!k) continue;
      found.push(mapProduct(p, k, { best: true }));
      hit++;
    }
    console.log(`  · 베스트 ${c.name}: ${items.length}개 중 생필품 ${hit}개`);
  }

  // ② 베스트 목록에 안 잡히는 캠핑 소모품 보충
  const fill = await searchProducts(fillKw, 4);
  let fillHit = 0;
  for (const p of fill) {
    const k = kindOf(String(p.productName || ""));
    if (!k) continue;
    found.push(mapProduct(p, k));
    fillHit++;
  }
  console.log(`  · 보충검색 "${fillKw}": ${fill.length}개 중 ${fillHit}개`);

  // ③ 골드박스(그날의 특가) 중 생필품
  const gb = await goldbox();
  let dealHit = 0;
  for (const p of gb) {
    const k = kindOf(String(p.productName || ""));
    if (!k) continue;
    found.push(mapProduct(p, k, { deal: true }));
    dealHit++;
  }
  console.log(`  · 골드박스: ${gb.length}개 중 생필품 ${dealHit}개`);

  // ── 기존 풀에 누적(merge) — 같은 상품이면 최신 정보로 갱신하고 최초 수집일은 보존 ──
  const byId = new Map(pool.map((p) => [p.id, p]));
  const order = new Map(); // 이번 수집에서의 등장 순서 = 판매 순위 근사
  let added = 0;
  found.forEach((p, i) => { if (!order.has(p.id)) order.set(p.id, i); });
  for (const p of found) {
    if (!p.id || !p.url || !p.image) continue;
    const old = byId.get(p.id);
    if (old) byId.set(p.id, { ...old, ...p, best: p.best || old.best, deal: p.deal || old.deal, firstSeenAt: old.firstSeenAt, lastSeenAt: nowIso });
    else { byId.set(p.id, { ...p, firstSeenAt: nowIso, lastSeenAt: nowIso }); added++; }
  }

  // 종류별로 고르게 남긴다 — 한 종류(예: 주방)가 풀을 독차지하지 않게 라운드로빈으로 상한까지.
  const groups = new Map();
  for (const p of byId.values()) {
    if (!groups.has(p.kind)) groups.set(p.kind, []);
    groups.get(p.kind).push(p);
  }
  const rankOf = (p) => (order.has(p.id) ? order.get(p.id) : 9999);
  for (const list of groups.values()) {
    // 판매 상위 → 이번에 잡힌 순위 → 최근 수집순
    list.sort((a, b) =>
      (b.best ? 1 : 0) - (a.best ? 1 : 0) ||
      rankOf(a) - rankOf(b) ||
      String(b.lastSeenAt).localeCompare(String(a.lastSeenAt)));
  }
  const kinds = [...groups.keys()].sort();
  const kept = [];
  for (let i = 0; kept.length < POOL_MAX; i++) {
    let progressed = false;
    for (const k of kinds) {
      const list = groups.get(k);
      if (i < list.length) { kept.push(list[i]); progressed = true; if (kept.length >= POOL_MAX) break; }
    }
    if (!progressed) break;
  }

  fs.writeFileSync(OUT, JSON.stringify({
    generatedAt: nowIso,
    cursor: (cursor + 1) % FILL_KEYWORDS.length,
    pool: kept,
  }, null, 2), "utf8");

  const byKind = kinds.map((k) => `${k} ${kept.filter((p) => p.kind === k).length}`).join(" · ");
  console.log(`\n✅ 풀 ${kept.length}개 (신규 ${added} · 판매상위 ${kept.filter((p) => p.best).length} · 특가 ${kept.filter((p) => p.deal).length}) → data/coupangEssentials.json`);
  console.log(`   종류별: ${byKind}`);
}

main();
