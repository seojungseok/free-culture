// TourAPI(KorService2) 공통 수집 코어 — 모든 수집 스크립트가 재사용.
//  · 키 로딩 / 요청 예산(일 1,000회) 자동 중단 / 재시도 / 캐시 read·write
//  · areaBasedList2·detailCommon2·detailIntro2·detailInfo2·searchFestival2 래퍼
//  · 유형별로 이름이 다른 detailIntro2 필드를 공통 스키마로 정규화
//
// 설계 원칙(2-5):
//  - 모든 응답은 data/*.json 캐시에 저장 → 방문자 증가와 무관하게 서빙(런타임 호출 X)
//  - 콜 사이 딜레이(기본 220ms)로 순차 수집
//  - 일일 한도 근접/초과(429·resultCode 22) 시 진행분 저장 후 자동 중단

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DATA_DIR = path.join(ROOT, "data");
export const BASE = "https://apis.data.go.kr/B551011/KorService2";
export const PET_BASE = "https://apis.data.go.kr/B551011/KorPetTourService2";

// ── 키 ──────────────────────────────────────────────────────────
export function loadKey() {
  if (process.env.PET_TOUR_API_KEY) return process.env.PET_TOUR_API_KEY.trim();
  if (process.env.TOUR_API_KEY) return process.env.TOUR_API_KEY.trim();
  if (process.env.DATA_GO_KR_KEY) return process.env.DATA_GO_KR_KEY.trim();
  const p = path.join(ROOT, ".env.local");
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
    for (const n of ["PET_TOUR_API_KEY", "TOUR_API_KEY", "DATA_GO_KR_KEY"]) {
      const l = lines.find((x) => x.startsWith(n + "="));
      if (l && l.slice(n.length + 1).trim()) return l.slice(n.length + 1).trim();
    }
  }
  return "";
}
const KEY = loadKey();
// 이미 URL 인코딩된 키(%2B 등)는 그대로, 아니면 인코딩
const KEY_PARAM = /%[0-9A-Fa-f]{2}/.test(KEY) ? KEY : encodeURIComponent(KEY);
export function hasKey() { return Boolean(KEY); }

// ── 유틸 ────────────────────────────────────────────────────────
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
export const https = (u) => String(u || "").replace(/^http:\/\//i, "https://");
export const cleanText = (s) =>
  String(s || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#3[49];/g, "'")
    .replace(/\s+/g, " ")
    .trim();
export const extractUrl = (s) => {
  const raw = String(s || "");
  const m = raw.match(/href=["']?(https?:\/\/[^"'\s>]+)/i);
  if (m) return m[1];
  const m2 = raw.match(/https?:\/\/[^\s"'<>]+/i);
  return m2 ? m2[0] : "";
};

// areacode → 시도명 (앱의 area 값과 일치)
export const AREA_TO_SIDO = {
  1: "서울", 2: "인천", 3: "대전", 4: "대구", 5: "광주", 6: "부산", 7: "울산",
  8: "세종", 31: "경기", 32: "강원", 33: "충북", 34: "충남", 35: "경북",
  36: "경남", 37: "전북", 38: "전남", 39: "제주",
};
export const AREA_CODES = Object.keys(AREA_TO_SIDO).map(Number);

// ── 캐시 read/write ────────────────────────────────────────────
export function readCache(file, fallback) {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) return fallback;
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; }
}
export function writeCache(file, obj) {
  const p = path.join(DATA_DIR, file);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj));
  return (fs.statSync(p).size / 1048576).toFixed(2);
}

// ── 예산(일일 한도) ─────────────────────────────────────────────
export class QuotaError extends Error {}
export function createBudget(max) {
  return { max: Number(max) || 900, used: 0, stopped: false };
}

// ── 코어 요청: 재시도 + 한도 감지 → QuotaError ───────────────────
async function fetchJson(endpoint, params, budget, base = BASE) {
  if (budget) {
    if (budget.stopped) throw new QuotaError("budget stopped");
    if (budget.used >= budget.max) { budget.stopped = true; throw new QuotaError("budget reached"); }
  }
  const qs = Object.entries(params).map(([k, v]) => `${k}=${v}`).join("&");
  const url = `${base}/${endpoint}?serviceKey=${KEY_PARAM}&MobileOS=ETC&MobileApp=mwohaji&_type=json&${qs}`;
  for (let i = 0; i < 3; i++) {
    let res;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    } catch (e) {
      if (i === 2) throw e;
      await sleep(700 * (i + 1));
      continue;
    }
    if (budget) budget.used++;
    const text = await res.text();
    // 일일 한도 초과 — 즉시 중단(재시도 무의미)
    if (res.status === 429 || /quota exceeded|LIMITED_NUMBER_OF_SERVICE|서비스 요청제한/i.test(text)) {
      if (budget) budget.stopped = true;
      throw new QuotaError("API 일일 한도 초과");
    }
    let j;
    try { j = JSON.parse(text); }
    catch { if (i === 2) throw new Error("JSON 파싱 실패: " + text.slice(0, 80)); await sleep(700 * (i + 1)); continue; }
    const code = j?.response?.header?.resultCode;
    if (code === "22") { if (budget) budget.stopped = true; throw new QuotaError("resultCode 22 한도 초과"); }
    if (code !== "0000") throw new Error(`resultCode=${code} ${j?.response?.header?.resultMsg || ""}`);
    return j;
  }
}

// ── 엔드포인트 래퍼 ─────────────────────────────────────────────
/** areaBasedList2 한 페이지 → { total, items } */
export async function areaBasedPage({ contentTypeId, areaCode, pageNo = 1, rows = 100 }, budget) {
  const params = { numOfRows: rows, pageNo, contentTypeId };
  if (areaCode) params.areaCode = areaCode;
  const j = await fetchJson("areaBasedList2", params, budget);
  const body = j?.response?.body;
  return { total: Number(body?.totalCount || 0), items: arr(body?.items?.item) };
}

/** searchFestival2 — 축제(15) 전용, eventStartDate 이후 진행/예정 */
export async function festivalPage({ eventStartDate, areaCode, pageNo = 1, rows = 100 }, budget) {
  const params = { numOfRows: rows, pageNo, eventStartDate, arrange: "A" };
  if (areaCode) params.areaCode = areaCode;
  const j = await fetchJson("searchFestival2", params, budget);
  const body = j?.response?.body;
  return { total: Number(body?.totalCount || 0), items: arr(body?.items?.item) };
}

export async function detailCommon(contentId, budget) {
  const j = await fetchJson("detailCommon2", { contentId }, budget);
  const it = j?.response?.body?.items?.item;
  const o = Array.isArray(it) ? it[0] : it;
  if (!o) return { overview: "", homepage: "", tel: "" };
  return { overview: cleanText(o.overview), homepage: extractUrl(o.homepage), tel: String(o.tel || "").trim() };
}

export async function detailIntroRaw(contentId, contentTypeId, budget) {
  const j = await fetchJson("detailIntro2", { contentId, contentTypeId }, budget);
  const it = j?.response?.body?.items?.item;
  return Array.isArray(it) ? it[0] : it;
}

export async function detailInfoRaw(contentId, contentTypeId, budget) {
  const j = await fetchJson("detailInfo2", { contentId, contentTypeId }, budget);
  return arr(j?.response?.body?.items?.item);
}

/** TourAPI 관광지·축제 상세 사진 목록. 원본과 썸네일 URL을 함께 제공한다. */
export async function detailImageListRaw(contentId, contentTypeId, budget) {
  // KorService2의 축제 사진 endpoint는 contentTypeId를 받으면 INVALID_REQUEST_PARAMETER를 반환한다.
  const j = await fetchJson("detailImage2", { contentId, numOfRows: 30, pageNo: 1 }, budget);
  return arr(j?.response?.body?.items?.item);
}

/** 반려동물 동반여행 서비스 상세정보 */
export async function detailPetTourRaw(contentId, budget) {
  const j = await fetchJson("detailPetTour2", { contentId }, budget, PET_BASE);
  const it = j?.response?.body?.items?.item;
  return Array.isArray(it) ? it[0] : it;
}

export async function petDetailCommon(contentId, budget) {
  const j = await fetchJson("detailCommon2", { contentId }, budget, PET_BASE);
  const it = j?.response?.body?.items?.item;
  const o = Array.isArray(it) ? it[0] : it;
  return { overview: cleanText(o?.overview), homepage: extractUrl(o?.homepage), tel: cleanText(o?.tel) };
}

export async function petDetailIntroRaw(contentId, contentTypeId, budget) {
  const j = await fetchJson("detailIntro2", { contentId, contentTypeId }, budget, PET_BASE);
  const it = j?.response?.body?.items?.item;
  return Array.isArray(it) ? it[0] : it;
}

export async function petDetailInfoRaw(contentId, contentTypeId, budget) {
  const j = await fetchJson("detailInfo2", { contentId, contentTypeId }, budget, PET_BASE);
  return arr(j?.response?.body?.items?.item);
}

export async function petImageListRaw(contentId, contentTypeId, budget) {
  const j = await fetchJson("detailImage2", { contentId, contentTypeId, numOfRows: 30, pageNo: 1 }, budget, PET_BASE);
  return arr(j?.response?.body?.items?.item);
}

export async function petAreaBasedPage({ areaCode, sigunguCode, pageNo = 1, rows = 1000 }, budget) {
  const params = { numOfRows: rows, pageNo };
  if (areaCode) params.areaCode = areaCode;
  if (sigunguCode) params.sigunguCode = sigunguCode;
  const j = await fetchJson("areaBasedList2", params, budget, PET_BASE);
  const body = j?.response?.body;
  return { total: Number(body?.totalCount || 0), items: arr(body?.items?.item) };
}

// ── detailIntro2 유형별 필드 → 공통 스키마 정규화 ────────────────
// KorService2 detailIntro2 는 유형마다 필드명이 다름(usefee vs usefeeleports 등).
// 화면에서 쓰는 공통 키로 통일.
const INTRO_MAP = {
  "12": { usetime: "usetime", restdate: "restdate", parking: "parking", infocenter: "infocenter",
          babycarriage: "chkbabycarriage", pet: "chkpet", creditcard: "chkcreditcard", expguide: "expguide" },
  "14": { usetime: "usetimeculture", restdate: "restdateculture", parking: "parkingculture", parkingfee: "parkingfee",
          fee: "usefee", discountinfo: "discountinfo", scale: "scale", infocenter: "infocenterculture",
          babycarriage: "chkbabycarriageculture", pet: "chkpetculture", creditcard: "chkcreditcardculture" },
  "28": { usetime: "usetimeleports", restdate: "restdateleports", parking: "parkingleports", parkingfee: "parkingfeeleports",
          fee: "usefeeleports", openperiod: "openperiod", reservation: "reservation", scale: "scaleleports",
          infocenter: "infocenterleports", babycarriage: "chkbabycarriageleports", pet: "chkpetleports", creditcard: "chkcreditcardleports" },
  "39": { usetime: "opentimefood", restdate: "restdatefood", parking: "parkingfood", infocenter: "infocenterfood",
          creditcard: "chkcreditcardfood", firstmenu: "firstmenu", treatmenu: "treatmenu", packing: "packing",
          kidsfacility: "kidsfacility", reservation: "reservationfood", seat: "seat", smoking: "smoking" },
  "15": { usetime: "usetimefestival", eventplace: "eventplace", eventstart: "eventstartdate",
          eventend: "eventenddate", playtime: "playtime", sponsor: "sponsor1", sponsorTel: "sponsor1tel",
          agelimit: "agelimit", program: "program" },
};

/** 원시 detailIntro2 item → 공통 스키마(값 없는 필드는 생략) */
export function normalizeIntro(type, raw) {
  const map = INTRO_MAP[type] || {};
  const out = {};
  for (const [key, field] of Object.entries(map)) {
    const v = cleanText(raw?.[field]);
    if (v) out[key] = v;
  }
  return out;
}

/** 원시 detailInfo2 items → [{name, text}] (부대시설·이용안내·전시실별 안내 등) */
export function normalizeInfo(items) {
  const out = [];
  for (const it of items) {
    // 대부분 유형: infoname/infotext, 여행코스(25): subname/subdetailoverview
    const name = cleanText(it?.infoname || it?.subname);
    const text = cleanText(it?.infotext || it?.subdetailoverview);
    if (name || text) out.push({ name, text });
  }
  return out;
}

/** 요금 텍스트 → free/paid/unknown (모든 유형 공통) */
export function classifyAdmission(fee) {
  const s = cleanText(fee);
  if (!s) return "unknown";
  const hasPrice = /\d[\d,]*\s*원/.test(s);
  const hasFree = /무료/.test(s);
  if (hasFree && !hasPrice) return "free";
  if (hasPrice) return "paid";
  if (hasFree) return "free";
  return "unknown";
}
