// 데이터 수집 스크립트
// - 공공데이터포털(한국문화정보원) period2 로 목록 페이징 → 신규 항목만 detail2 상세조회
// - 무료/유료 분류, 큰행사(featured) 판별, 종료된 행사 제거
// - data/events.json 생성
//
// 실행:  node scripts/collect.mjs
// 옵션(환경변수):
//   COLLECT_DAYS   수집 기간(오늘부터 N일, 기본 60)
//   COLLECT_MAX    detail2 최대 호출수(트래픽 안전장치, 기본 2000)
//   COLLECT_SIDO   특정 시도만 수집 (예: 서울) — 분할 실행용
//   COLLECT_CONCURRENCY 상세조회 동시 요청수 (기본 8)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { XMLParser } from "fast-xml-parser";
import {
  classifyEvent,
  priceLabel,
  decodeEntities,
  genreKeyOf,
  computeFeatured,
  computeAudiences,
  SIDO_LIST,
} from "../lib/classify.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const OUT_FILE = path.join(DATA_DIR, "events.json");

const BASE = "https://apis.data.go.kr/B553457/cultureinfo";
const parser = new XMLParser({ ignoreAttributes: true, trimValues: true });

// ---- 환경변수/키 로드 -------------------------------------------------------
function loadKey() {
  if (process.env.DATA_GO_KR_KEY) return process.env.DATA_GO_KR_KEY.trim();
  const envPath = path.join(ROOT, ".env.local");
  if (fs.existsSync(envPath)) {
    const line = fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .find((l) => l.startsWith("DATA_GO_KR_KEY="));
    if (line) return line.slice("DATA_GO_KR_KEY=".length).trim();
  }
  return "";
}

const KEY = loadKey();
if (!KEY) {
  console.error("❌ DATA_GO_KR_KEY 가 없습니다. .env.local 을 확인하세요.");
  process.exit(1);
}

const DAYS = Number(process.env.COLLECT_DAYS || 60);
const MAX_DETAIL = Number(process.env.COLLECT_MAX || 2000);
const ONLY_SIDO = process.env.COLLECT_SIDO || "";
const CONCURRENCY = Number(process.env.COLLECT_CONCURRENCY || 8);

// ---- 날짜 유틸 (KST 기준) ---------------------------------------------------
function kstNow() {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}
function ymd(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}
const TODAY = ymd(kstNow());
const TO = ymd(new Date(kstNow().getTime() + DAYS * 24 * 60 * 60 * 1000));

// ---- 호출 카운터 (트래픽 로깅/상한) ----------------------------------------
const calls = { period2: 0, area2: 0, detail2: 0 };
const DAILY_LIMIT = 10000;

async function fetchXml(url, kind) {
  calls[kind]++;
  if (calls[kind] > DAILY_LIMIT) {
    throw new Error(`⛔ ${kind} 일일 호출 상한(${DAILY_LIMIT}) 초과 — 중단`);
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const json = parser.parse(text);
      const code = json?.response?.header?.resultCode;
      if (code !== "00" && code !== 0)
        throw new Error(`resultCode=${code} msg=${json?.response?.header?.resultMsg}`);
      return json;
    } catch (e) {
      if (attempt === 2) throw e;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
}

function asArray(x) {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

// ---- 목록 수집 (period2 또는 sido별 area2) ----------------------------------
const PAGE_SIZE = 100; // numOfrows 로 100건씩 (API가 이 파라미터명/크기 허용)

async function collectList() {
  const seen = new Map(); // seq -> listItem
  const targets = ONLY_SIDO ? [ONLY_SIDO] : [null]; // null = 전체(period2)

  for (const sido of targets) {
    // 페이지네이션 파라미터는 대소문자까지 정확히 일치해야 함: PageNo / numOfrows
    for (let page = 1; page <= 200; page++) {
      const kind = sido ? "area2" : "period2";
      const sidoParam = sido ? `&sido=${encodeURIComponent(sido)}` : "";
      const url = `${BASE}/${kind}?serviceKey=${KEY}&from=${TODAY}&to=${TO}&PageNo=${page}&numOfrows=${PAGE_SIZE}&sortStdr=1${sidoParam}`;
      const json = await fetchXml(url, kind);
      const items = asArray(json?.response?.body?.items?.item);
      if (items.length === 0) break;
      for (const it of items) {
        const seq = String(it.seq ?? "").trim();
        if (!seq) continue;
        if (!seen.has(seq)) seen.set(seq, it);
      }
      process.stdout.write(`  ...${kind} ${page}페이지 (누적 ${seen.size}건)\r`);
      if (items.length < PAGE_SIZE) break; // 마지막 페이지
    }
  }
  console.log(`\n📋 목록 수집 완료: ${seen.size}건 (period2=${calls.period2}, area2=${calls.area2} 콜)`);
  return seen;
}

// ---- 상세 조회 --------------------------------------------------------------
async function fetchDetail(seq) {
  const url = `${BASE}/detail2?serviceKey=${KEY}&seq=${seq}`;
  const json = await fetchXml(url, "detail2");
  const it = asArray(json?.response?.body?.items?.item)[0];
  return it || null;
}

// 동시성 제한 실행기
async function mapLimit(items, limit, worker, onProgress) {
  const results = [];
  let idx = 0;
  let done = 0;
  const runners = Array.from({ length: limit }, async () => {
    while (idx < items.length) {
      const my = idx++;
      results[my] = await worker(items[my], my);
      done++;
      if (onProgress && done % 20 === 0) onProgress(done, items.length);
    }
  });
  await Promise.all(runners);
  return results;
}

// ---- 메인 -------------------------------------------------------------------
async function main() {
  console.log(`\n🎨 무료문화 데이터 수집 시작`);
  console.log(`   기간: ${TODAY} ~ ${TO} (${DAYS}일)  대상: ${ONLY_SIDO || "전국"}`);
  console.log(`   detail2 상한: ${MAX_DETAIL}, 동시요청: ${CONCURRENCY}\n`);

  // 기존 데이터 로드 (신규만 상세조회 → 트래픽 절약)
  let prevEvents = [];
  if (fs.existsSync(OUT_FILE)) {
    try {
      prevEvents = JSON.parse(fs.readFileSync(OUT_FILE, "utf8")).events || [];
    } catch {}
  }
  const prevById = new Map(prevEvents.map((e) => [e.id, e]));

  // 1) 목록
  const listMap = await collectList();

  // 2) 상세조회 대상 = 신규 + 기존 unknown(요금이 나중에 채워질 수 있으므로 매번 재확인)
  const allSeqs = [...listMap.keys()];
  const newSeqs = allSeqs.filter((s) => !prevById.has(s));
  // 요금이 비어있던 항목(unknown/무료추정)은 나중에 원본이 채워질 수 있어 매번 재확인
  const recheckSeqs = allSeqs.filter(
    (s) =>
      prevById.has(s) &&
      ["unknown", "free_estimated"].includes(prevById.get(s).priceType)
  );
  const targetSeqs = [...new Set([...newSeqs, ...recheckSeqs])];
  const toFetch = targetSeqs.slice(0, MAX_DETAIL);
  if (targetSeqs.length > MAX_DETAIL) {
    console.log(
      `⚠️  조회대상 ${targetSeqs.length}건 중 상한 ${MAX_DETAIL}건만 이번에 조회합니다. (다음 실행 때 이어서)`
    );
  }
  console.log(
    `🔎 상세조회: 신규 ${newSeqs.length} + unknown재확인 ${recheckSeqs.length} = ${toFetch.length}건 (기존 재사용 ${allSeqs.length - toFetch.length}건)`
  );

  const detailMap = new Map();
  await mapLimit(
    toFetch,
    CONCURRENCY,
    async (seq) => {
      try {
        const d = await fetchDetail(seq);
        if (d) detailMap.set(seq, d);
      } catch (e) {
        // 개별 실패는 건너뜀 (사이트는 유지)
      }
    },
    (done, total) => process.stdout.write(`  ...상세 ${done}/${total}\r`)
  );
  console.log(`\n✅ 상세조회 완료 (detail2=${calls.detail2} 콜)`);

  // 3) 병합 + 분류 + 종료행사 제거
  const events = [];
  let dropExpired = 0;
  for (const seq of allSeqs) {
    const li = listMap.get(seq) || {};
    const prev = prevById.get(seq);
    const de = detailMap.get(seq);

    // 상세 소스: 이번에 받은 detail > 기존 저장분 > 목록만
    const priceRaw = de ? decodeEntities(de.price) : prev ? prev.priceRaw : "";
    const startDate = String(li.startDate ?? de?.startDate ?? prev?.startDate ?? "");
    const endDate = String(li.endDate ?? de?.endDate ?? prev?.endDate ?? "");

    // 종료된 행사 제거
    if (endDate && endDate < TODAY) {
      dropExpired++;
      continue;
    }

    const title = decodeEntities(li.title ?? de?.title ?? prev?.title ?? "");
    const realmName = String(li.realmName ?? de?.realmName ?? prev?.realmName ?? "");
    const place = decodeEntities(li.place ?? de?.place ?? prev?.place ?? "");
    const area = String(li.area ?? de?.area ?? prev?.area ?? "");
    const sigungu = String(li.sigungu ?? de?.sigungu ?? prev?.sigungu ?? "");
    // http → https 정규화 (배포 시 혼합콘텐츠 차단 방지)
    const imgUrl = String(li.thumbnail ?? de?.imgUrl ?? prev?.imgUrl ?? "").replace(
      /^http:\/\//i,
      "https://"
    );

    const genreKey = genreKeyOf(realmName);
    // 신규이거나 이번에 상세를 받았으면 재분석, 아니면 기존 분류 재사용
    const analyzed =
      de || !prev
        ? classifyEvent({ priceRaw, genreKey, title, place })
        : {
            type: prev.priceType,
            min: prev.priceMin ?? null,
            max: prev.priceMax ?? null,
            freeCondition: prev.freeCondition ?? "",
          };
    const { featured, score } = computeFeatured({ realmName, place, title });
    const contents = de ? decodeEntities(de.contents1) : prev?.contents || "";
    const audiences = computeAudiences({
      title,
      realmName,
      genreKey,
      contents,
      freeCondition: analyzed.freeCondition,
      priceRaw,
    });

    events.push({
      id: seq,
      title,
      priceRaw,
      priceType: analyzed.type,
      priceMin: analyzed.min,
      priceMax: analyzed.max,
      freeCondition: analyzed.freeCondition,
      priceLabel: priceLabel(analyzed),
      startDate,
      endDate,
      place,
      area,
      sigungu,
      address: de ? decodeEntities(de.placeAddr) : prev?.address || "",
      realmName,
      genreKey,
      imgUrl,
      officialUrl: de ? String(de.url || "") : prev?.officialUrl || "",
      phone: de ? decodeEntities(de.phone) : prev?.phone || "",
      contents,
      gpsX: String(li.gpsX ?? de?.gpsX ?? prev?.gpsX ?? ""),
      gpsY: String(li.gpsY ?? de?.gpsY ?? prev?.gpsY ?? ""),
      featured,
      featuredScore: score,
      audiences,
    });
  }

  // 정렬: featured 점수 → 시작일
  events.sort((a, b) => b.featuredScore - a.featuredScore || a.startDate.localeCompare(b.startDate));

  // 통계
  const stat = { free: 0, free_estimated: 0, partial_free: 0, cheap: 0, paid: 0, unknown: 0 };
  for (const e of events) stat[e.priceType] = (stat[e.priceType] || 0) + 1;
  const featuredCount = events.filter((e) => e.featured).length;

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), count: events.length, events },
      null,
      0
    )
  );

  console.log(`\n💾 저장: data/events.json`);
  console.log(
    `   총 ${events.length}건 | 무료 ${stat.free} · 무료추정 ${stat.free_estimated} · 조건부무료 ${stat.partial_free} · 1만↓ ${stat.cheap} · 유료 ${stat.paid} · 확인필요 ${stat.unknown}`
  );
  console.log(`   종료 제거 ${dropExpired}건 | 큰행사(featured) ${featuredCount}건`);
  console.log(`   API 호출: period2=${calls.period2} area2=${calls.area2} detail2=${calls.detail2}\n`);
}

main().catch((e) => {
  console.error("\n❌ 수집 실패:", e.message);
  console.error("   기존 events.json 은 유지됩니다.");
  process.exit(1);
});
