// scripts/collectCoupangEssentials.mjs
// 캠핑 "글 중간"에 넣을 생필품 링크 풀을 만든다 → data/coupangEssentials.json
//
// 왜 따로 만드나
//   기존 collectCoupang(4섹션)은 캠핑 장비 위주에 글 맨 아래에만 붙는다.
//   글 중간에는 "물·화장지·물티슈"처럼 **누구나 자주 사는 생필품**을 소수(2~3개)만 노출한다.
//   가격은 저장도 노출도 하지 않는다(수시로 바뀌어 낡은 값 표기는 금지 + "얼마지?" 궁금증이 클릭 동기).
//
// ★ 레이트리밋: 쿠팡 API는 분당 6회 미만(coupangThrottle.mjs).
//   그래서 한 번에 다 긁지 않고 **키워드를 매 실행 조금씩 돌려가며(rotation) 여러 번에 걸쳐 모은다.**
//   - 1회 실행 = 검색 ESSENTIALS_PER_RUN개(기본 4) + 골드박스 1회 = 5콜 (약 50초)
//   - 결과는 기존 풀에 "누적" — 한 바퀴(기본 3회 실행)면 전 키워드가 채워진다.
//   - 풀에서 어느 상품을 보여줄지는 페이지가 캠핑장별로 골라 뿌린다(고르게 노출).
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
const PER_RUN = Number(process.env.ESSENTIALS_PER_RUN) || 4;   // 1회 실행당 검색 키워드 수
const PER_KEYWORD = Number(process.env.ESSENTIALS_PER_KW) || 3; // 키워드당 담을 상품 수
const POOL_MAX = Number(process.env.ESSENTIALS_POOL_MAX) || 72; // 풀 상한(오래된 것부터 정리)

// ── 생필품 키워드 — "집에서도 자주 사는데 캠핑 갈 때 또 사는" 것들만. 종류(kind)로 묶어 고르게 노출한다. ──
const KEYWORDS = [
  { kw: "생수 2L 무라벨", kind: "물", label: "생수" },
  { kw: "생수 500ml", kind: "물", label: "생수" },
  { kw: "3겹 화장지 30롤", kind: "화장지", label: "화장지" },
  { kw: "대용량 화장지", kind: "화장지", label: "화장지" },
  { kw: "캡형 물티슈", kind: "물티슈", label: "물티슈" },
  { kw: "휴대용 미니 물티슈", kind: "물티슈", label: "물티슈" },
  { kw: "대용량 물티슈", kind: "물티슈", label: "물티슈" },
  { kw: "키친타월", kind: "주방", label: "키친타월" },
  { kw: "종이컵", kind: "주방", label: "종이컵" },
  { kw: "지퍼백", kind: "주방", label: "지퍼백" },
  { kw: "위생장갑", kind: "주방", label: "위생장갑" },
  { kw: "종량제 쓰레기봉투", kind: "정리", label: "쓰레기봉투" },
];
// 골드박스(오늘의 특가)에서 생필품만 걸러낼 때 쓰는 사전 — 여기 걸리면 "오늘의 특가" 배지를 붙인다(사실).
const DEAL_KINDS = [
  { kind: "물", label: "생수", re: /생수|먹는샘물|미네랄워터|워터/ },
  { kind: "화장지", label: "화장지", re: /화장지|두루마리|롤화장지|미용티슈|각티슈/ },
  { kind: "물티슈", label: "물티슈", re: /물티슈/ },
  { kind: "주방", label: "주방소모품", re: /키친타월|종이컵|지퍼백|위생장갑|호일|랩|일회용\s?(접시|수저|용기)/ },
  { kind: "정리", label: "생활소모품", re: /쓰레기봉투|종량제|비닐봉투|세제|섬유유연제|핸드워시|비누|치약|칫솔/ },
];

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
function mapProduct(p, { kind, label, deal = false }) {
  return {
    id: String(p.productId),
    name: String(p.productName || "").replace(/\s+/g, " ").trim(),
    image: p.productImage,
    url: p.productUrl,
    isRocket: !!p.isRocket,
    kind, label, deal,
  };
}
async function searchProducts(keyword, limit) {
  const urlPath = `/v2/providers/affiliate_open_api/apis/openapi/v1/products/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
  const json = await apiGet(urlPath);
  return json?.data?.productData || [];
}
async function goldbox() {
  const json = await apiGet(`/v2/providers/affiliate_open_api/apis/openapi/v1/products/goldbox`);
  return json?.data || [];
}

async function main() {
  const now = new Date();
  const nowIso = now.toISOString();
  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
  const pool = Array.isArray(prev.pool) ? prev.pool : [];
  const cursor = Number(prev.cursor) || 0;

  // 이번 실행에서 돌릴 키워드 창(window) — 실행할 때마다 다음 구간으로 넘어간다.
  const win = [];
  for (let i = 0; i < Math.min(PER_RUN, KEYWORDS.length); i++) win.push(KEYWORDS[(cursor + i) % KEYWORDS.length]);
  const nextCursor = (cursor + win.length) % KEYWORDS.length;
  const round = Math.ceil(KEYWORDS.length / Math.max(1, PER_RUN));

  console.log(`🧻 생필품 링크 수집 — 키워드 ${win.length}/${KEYWORDS.length}개 (커서 ${cursor} → ${nextCursor}, ${round}회 실행이면 한 바퀴)`);
  console.log(`⏳ 레이트리밋: 호출 간격 최소 ${(MIN_INTERVAL_MS / 1000).toFixed(1)}초 (분당 ${(60000 / MIN_INTERVAL_MS).toFixed(1)}회) · 이번 실행 ${win.length + 1}콜\n`);

  const found = [];
  for (const k of win) {
    const items = await searchProducts(k.kw, PER_KEYWORD);
    for (const p of items) found.push(mapProduct(p, { kind: k.kind, label: k.label }));
    console.log(`  · ${k.kw}: ${items.length}개`);
  }

  // 골드박스(쿠팡이 매일 고르는 특가)에서 생필품만 — "오늘의 특가"는 여기 걸린 것만 붙인다(과장 금지).
  const gb = await goldbox();
  let dealCount = 0;
  for (const p of gb) {
    const hit = DEAL_KINDS.find((d) => d.re.test(String(p.productName || "")));
    if (!hit) continue;
    found.push(mapProduct(p, { kind: hit.kind, label: hit.label, deal: true }));
    dealCount++;
  }
  console.log(`  · 골드박스에서 생필품만: ${dealCount}개 (전체 ${gb.length}개 중)`);

  // ── 기존 풀에 누적(merge) — 같은 상품이면 최신 정보로 갱신하고 최초 수집일은 보존 ──
  const byId = new Map(pool.map((p) => [p.id, p]));
  let added = 0;
  for (const p of found) {
    if (!p.id || !p.url || !p.image) continue;
    const old = byId.get(p.id);
    if (old) byId.set(p.id, { ...old, ...p, deal: p.deal || old.deal, firstSeenAt: old.firstSeenAt, lastSeenAt: nowIso });
    else { byId.set(p.id, { ...p, firstSeenAt: nowIso, lastSeenAt: nowIso }); added++; }
  }

  // 종류별로 고르게 남긴다 — 한 종류(예: 물티슈)가 풀을 독차지하지 않게 라운드로빈으로 상한까지.
  const groups = new Map();
  for (const p of byId.values()) {
    if (!groups.has(p.kind)) groups.set(p.kind, []);
    groups.get(p.kind).push(p);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => (b.deal ? 1 : 0) - (a.deal ? 1 : 0) || String(b.lastSeenAt).localeCompare(String(a.lastSeenAt)));
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

  const out = {
    generatedAt: nowIso,
    cursor: nextCursor,
    keywordCount: KEYWORDS.length,
    runsPerRound: round,
    pool: kept,
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), "utf8");

  const byKind = kinds.map((k) => `${k} ${kept.filter((p) => p.kind === k).length}`).join(" · ");
  console.log(`\n✅ 풀 ${kept.length}개 (신규 ${added}개 · 특가 ${kept.filter((p) => p.deal).length}개) → data/coupangEssentials.json`);
  console.log(`   종류별: ${byKind}`);
}

main();
