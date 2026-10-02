// 캠핑: 한국관광공사 고캠핑(GoCamping) basedList 전체 수집 → data/camping.json
//  전국 ≈ 3,065곳. numOfRows=1000 → 3~4콜. DATA_GO_KR_KEY 공용(별도 서비스라 KorService2와 한도 분리).
// 실행: node scripts/collectCamping.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readCache, writeCache, createBudget, fetchJson, safeApiError, hasKey } from "./lib/tourClient.mjs";
import { mergeCollectedRecord, checkedSnapshot } from "./lib/collectorState.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "data", "camping.json");
const BASE = "https://apis.data.go.kr/B551011/GoCamping";

if (!hasKey("public")) { console.error("❌ DATA_GO_KR_KEY 없음"); process.exit(1); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const https = (u) => String(u || "").replace(/^http:\/\//i, "https://");

const SIDO = { 서울특별시: "서울", 인천광역시: "인천", 부산광역시: "부산", 대구광역시: "대구", 대전광역시: "대전", 광주광역시: "광주", 울산광역시: "울산", 세종특별자치시: "세종", 세종특별자치도: "세종", 경기도: "경기", 강원도: "강원", 강원특별자치도: "강원", 충청북도: "충북", 충청남도: "충남", 전라북도: "전북", 전북특별자치도: "전북", 전라남도: "전남", 경상북도: "경북", 경상남도: "경남", 제주특별자치도: "제주", 제주도: "제주" };
const SIDO_SHORT = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
const GWANGJU_GU = new Set(["동구", "서구", "남구", "북구", "광산구"]);
const JEONNAM_RE = /여수|순천|목포|나주|광양|담양|곡성|구례|고흥|보성|화순|장흥|강진|해남|영암|무안|함평|영광|장성|완도|진도|신안/;
// 시도 정규화: doNm → 정상값. "전남광주통합" 등 이상값은 시군구/주소로 판별.
function areaOf(it) {
  const raw = String(it.doNm || "").trim();
  if (SIDO[raw]) return SIDO[raw];
  const stripped = raw.replace(/(특별자치도|특별자치시|특별시|광역시|도)$/, "").trim();
  if (SIDO_SHORT.includes(stripped)) return stripped;
  const sgg = String(it.sigunguNm || "").trim();
  if (GWANGJU_GU.has(sgg)) return "광주";
  if (JEONNAM_RE.test(sgg)) return "전남";
  const m = String(it.addr1 || "").match(new RegExp(`^(${SIDO_SHORT.join("|")})`));
  return m ? m[1] : stripped;
}

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

async function fetchPage(pageNo, rows, budget) {
  const j = await fetchJson("basedList", { numOfRows: rows, pageNo }, budget, BASE);
  const body = j?.response?.body;
  return { total: Number(body?.totalCount || 0), items: arr(body?.items?.item) };
}

async function main() {
  const previous = readCache("camping.json", { camps: [] });
  const budget = createBudget(Number(process.env.CAMPING_LIST_BUDGET || 8));
  const checkedAt = new Date().toISOString();
  const ROWS = 1000;
  const first = await fetchPage(1, ROWS, budget);
  if (!first.total || !first.items.length) throw new Error("캠핑 확인 0건 — 기존 스냅샷 유지");
  const pages = Math.ceil(first.total / ROWS);
  console.log(`\n🏕️  고캠핑 수집 — 전국 ${first.total}곳 (${pages}페이지 × ${ROWS})`);
  const items = [...first.items];
  let failures = 0;
  for (let p = 2; p <= pages; p++) {
    await sleep(250);
    try {
      const page = await fetchPage(p, ROWS, budget);
      if (!page.items.length) throw new Error("API 응답 형식 오류");
      items.push(...page.items);
    } catch (error) {
      failures++; console.warn(`캠핑 p${p} 갱신 보류: ${safeApiError(error)}`);
      if (budget.stopped) break;
    }
  }

  const byId = new Map((previous.camps || []).map((camp) => [camp.id, camp]));
  const checkedIds = new Set();
  for (const it of items) {
    const id = String(it.contentId || "");
    if (!id || !String(it.facltNm || "").trim()) continue;
    byId.set(id, mergeCollectedRecord(byId.get(id), {
      id,
      name: String(it.facltNm || "").trim(),
      area: areaOf(it),
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
      sourceModifiedAt: String(it.modifiedtime || ""),
    }, checkedAt));
    checkedIds.add(id);
  }

  if (!checkedIds.size) throw new Error("캠핑 확인 0건 — 기존 스냅샷 유지");
  const camps = [...byId.values()];
  const byType = {}, byArea = {};
  let withImg = 0, pet = 0;
  for (const c of camps) { for (const t of c.types) byType[t] = (byType[t] || 0) + 1; byArea[c.area] = (byArea[c.area] || 0) + 1; if (c.image) withImg++; if (c.pet) pet++; }

  const complete = failures === 0 && !budget.stopped && items.length >= first.total;
  writeCache("camping.json", checkedSnapshot(previous, camps, "camps", { checkedAt, calls: budget.used, failures, complete }));
  const mb = (fs.statSync(OUT).size / 1048576).toFixed(2);
  console.log(`\n💾 저장: data/camping.json (${camps.length}곳, ${mb}MB)`);
  console.log(`   유형: ${Object.entries(byType).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
  console.log(`   사진有 ${withImg} · 반려동물 ${pet} · 지역수 ${Object.keys(byArea).length}`);
  console.log(`   실제 확인 ${checkedIds.size} · API콜 ${budget.used} · 전체완료 ${complete} · 기존 ID 보존`);
  if (!complete) process.exitCode = 1;
}
main().catch((e) => { console.error("❌ 실패:", safeApiError(e)); process.exit(1); });
