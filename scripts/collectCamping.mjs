// 캠핑: 한국관광공사 고캠핑(GoCamping) basedList 전체 수집 → data/camping.json
//  전국 ≈ 3,065곳. numOfRows=1000 → 3~4콜. DATA_GO_KR_KEY 공용(별도 서비스라 KorService2와 한도 분리).
// 실행: node scripts/collectCamping.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "data", "camping.json");
const BASE = "https://apis.data.go.kr/B551011/GoCamping";

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

const SIDO = { 서울특별시: "서울", 인천광역시: "인천", 부산광역시: "부산", 대구광역시: "대구", 대전광역시: "대전", 광주광역시: "광주", 울산광역시: "울산", 세종특별자치시: "세종", 세종특별자치도: "세종", 경기도: "경기", 강원도: "강원", 강원특별자치도: "강원", 충청북도: "충북", 충청남도: "충남", 전라북도: "전북", 전북특별자치도: "전북", 전라남도: "전남", 경상북도: "경북", 경상남도: "경남", 제주특별자치도: "제주", 제주도: "제주" };

// 유형 정규화: induty(콤마구분) + 사이트수로 보강
function typesOf(it) {
  const set = new Set();
  for (const t of String(it.induty || "").split(/[,·/]/).map((s) => s.trim())) {
    if (/글램핑/.test(t)) set.add("글램핑");
    else if (/카라반/.test(t)) set.add("카라반");
    else if (/자동차|오토/.test(t)) set.add("오토캠핑");
    else if (/일반/.test(t)) set.add("일반야영장");
  }
  if (Number(it.glampSiteCo) > 0) set.add("글램핑");
  if (Number(it.caravSiteCo) > 0 || Number(it.indvdlCaravSiteCo) > 0) set.add("카라반");
  if (Number(it.autoSiteCo) > 0) set.add("오토캠핑");
  if (Number(it.gnrlSiteCo) > 0) set.add("일반야영장");
  return [...set];
}
// 편의시설 플래그: sbrsCl(부대시설 텍스트) + 개수 필드
function facilitiesOf(it) {
  const s = `${it.sbrsCl || ""} ${it.sbrsEtc || ""} ${it.posblFcltyCl || ""}`;
  return {
    전기: /전기/.test(s),
    샤워실: /샤워/.test(s) || Number(it.swrmCo) > 0,
    화장실: /화장실/.test(s) || Number(it.toiletCo) > 0,
    와이파이: /무선인터넷|와이파이|wifi/i.test(s),
    온수: /온수/.test(s),
    마트: /마트|매점|편의점/.test(s),
  };
}

async function fetchPage(pageNo, rows) {
  const url = `${BASE}/basedList?serviceKey=${KP}&numOfRows=${rows}&pageNo=${pageNo}&MobileOS=ETC&MobileApp=mwohaji&_type=json`;
  const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
  const t = await r.text();
  const j = JSON.parse(t);
  if (j?.response?.header?.resultCode !== "0000") throw new Error(`resultCode=${j?.response?.header?.resultCode} ${j?.response?.header?.resultMsg}`);
  const body = j?.response?.body;
  return { total: Number(body?.totalCount || 0), items: arr(body?.items?.item) };
}

async function main() {
  const ROWS = 1000;
  const first = await fetchPage(1, ROWS);
  const pages = Math.ceil(first.total / ROWS);
  console.log(`\n🏕️  고캠핑 수집 — 전국 ${first.total}곳 (${pages}페이지 × ${ROWS})`);
  const items = [...first.items];
  for (let p = 2; p <= pages; p++) { await sleep(250); items.push(...(await fetchPage(p, ROWS)).items); }

  const camps = [];
  for (const it of items) {
    const id = String(it.contentId || "");
    if (!id) continue;
    camps.push({
      id,
      name: String(it.facltNm || "").trim(),
      area: SIDO[String(it.doNm || "").trim()] || String(it.doNm || "").replace(/(특별자치도|특별자치시|특별시|광역시|도)$/, "").trim(),
      sigungu: String(it.sigunguNm || "").trim(),
      addr: String(it.addr1 || "").trim(),
      mapx: String(it.mapX || ""), mapy: String(it.mapY || ""),
      types: typesOf(it),
      facilities: facilitiesOf(it),
      pet: /가능/.test(it.animalCmgCl || "") && !/^불가능$/.test(String(it.animalCmgCl || "").trim()),
      petRaw: String(it.animalCmgCl || "").trim(),
      lctCl: String(it.lctCl || "").trim(), // 입지: 해변/산/숲/계곡/도심/섬 등
      resve: String(it.resveCl || "").trim(),
      operPd: String(it.operPdCl || "").trim(),
      tel: String(it.tel || "").trim(),
      homepage: String(it.homepage || it.resveUrl || "").trim(),
      image: it.firstImageUrl ? https(it.firstImageUrl) : "",
      intro: String(it.lineIntro || "").replace(/\s+/g, " ").trim(),
    });
  }

  const byType = {}, byArea = {};
  let withImg = 0, pet = 0;
  for (const c of camps) { for (const t of c.types) byType[t] = (byType[t] || 0) + 1; byArea[c.area] = (byArea[c.area] || 0) + 1; if (c.image) withImg++; if (c.pet) pet++; }

  fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), count: camps.length, camps }));
  const mb = (fs.statSync(OUT).size / 1048576).toFixed(2);
  console.log(`\n💾 저장: data/camping.json (${camps.length}곳, ${mb}MB)`);
  console.log(`   유형: ${Object.entries(byType).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
  console.log(`   사진有 ${withImg} · 반려동물 ${pet} · 지역수 ${Object.keys(byArea).length}`);
}
main().catch((e) => { console.error("❌ 실패:", e.message); process.exit(1); });
