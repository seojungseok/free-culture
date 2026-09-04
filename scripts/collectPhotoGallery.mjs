// 한국관광공사 관광사진갤러리 전체 목록을 캐시한다.
// 코스 상세는 이 캐시를 경유지명과 매칭하므로 방문자별 API 호출이 없다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "data", "photo-gallery.json");
const BASE = "https://apis.data.go.kr/B551011/PhotoGalleryService1/galleryList1";
const ROWS = 1000;

function loadKey() {
  for (const key of ["TOUR_API_KEY", "DATA_GO_KR_KEY"]) {
    if (process.env[key]) return process.env[key].trim();
  }
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return "";
  const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
  for (const key of ["TOUR_API_KEY", "DATA_GO_KR_KEY"]) {
    const line = lines.find((x) => new RegExp(`^\\s*${key}\\s*=`).test(x));
    const value = line ? line.split("=", 2)[1].trim() : "";
    if (value) return value;
  }
  return "";
}

const key = loadKey();
if (!key) { console.error("TourAPI 키가 없습니다."); process.exit(1); }
const encodedKey = /%[0-9A-Fa-f]{2}/.test(key) ? key : encodeURIComponent(key);
const arr = (value) => value == null ? [] : Array.isArray(value) ? value : [value];
const https = (value) => String(value || "").replace(/^http:\/\//i, "https://");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function page(pageNo) {
  const url = `${BASE}?serviceKey=${encodedKey}&numOfRows=${ROWS}&pageNo=${pageNo}&MobileOS=ETC&MobileApp=mwohaji&_type=json&arrange=A`;
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  const json = await response.json();
  if (json?.response?.header?.resultCode !== "0000") throw new Error(json?.response?.header?.resultMsg || "사진갤러리 API 오류");
  const body = json.response.body || {};
  return { total: Number(body.totalCount || 0), items: arr(body.items?.item) };
}

const photos = [];
let total = 0;
let pageNo = 1;
do {
  const result = await page(pageNo);
  total = result.total;
  for (const item of result.items) {
    const image = https(item.galWebImageUrl);
    if (!image || !item.galContentId) continue;
    photos.push({
      id: String(item.galContentId),
      title: String(item.galTitle || "관광사진"),
      image,
      month: String(item.galPhotographyMonth || ""),
      location: String(item.galPhotographyLocation || ""),
      keywords: String(item.galSearchKeyword || ""),
      photographer: String(item.galPhotographer || ""),
    });
  }
  console.log(`  page ${pageNo}: ${result.items.length}건 / ${total}건`);
  pageNo++;
  if (photos.length < total) await sleep(220);
} while (photos.length < total && pageNo <= 20);

fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), count: photos.length, photos }));
console.log(`저장 완료: data/photo-gallery.json (${photos.length}장, ${pageNo - 1}콜)`);
