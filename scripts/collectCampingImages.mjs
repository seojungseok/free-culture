// 캠핑 이미지 백필 — 대표이미지(firstImageUrl) 없는 캠핑장을 goCamping imageList로 보강.
//  대표이미지는 없지만 갤러리 사진은 등록된 곳을 복구 → data/camping-images.json { id: imageUrl }.
//  goCamping은 별도 서비스. 미수집·잘못된 파일형식만 CIMG_DAILY 예산(재시도 포함) 안에서 확인.
// 실행:
//   node scripts/collectCampingImages.mjs
//   CIMG_DAILY=300 node scripts/collectCampingImages.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publicImageUrl } from "../lib/publicImage.mjs";
import { fetchJson, createBudget, hasKey, QuotaError, safeApiError } from "./lib/tourClient.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CAMPING = path.join(ROOT, "data", "camping.json");
const OUT = path.join(ROOT, "data", "camping-images.json");
const BASE = "https://apis.data.go.kr/B551011/GoCamping";
const DAILY = Number(process.env.CIMG_DAILY || 1000);

if (!hasKey('public')) { console.error("❌ DATA_GO_KR_KEY 없음"); process.exit(1); }
const budget = createBudget(DAILY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);

async function imageOf(contentId) {
  const j = await fetchJson('imageList', { numOfRows: 10, pageNo: 1, contentId }, budget, BASE);
  return arr(j?.response?.body?.items?.item).map(it => publicImageUrl(it?.imageUrl)).find(Boolean) || '';
}

async function main() {
  const camps = JSON.parse(fs.readFileSync(CAMPING, "utf8")).camps || [];
  const store = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};

  // 대표이미지 없음 + 아직 백필 시도 안 함(=키에 없음)
  const targets = camps.filter((c) => !publicImageUrl(c.image) && (!(c.id in store) || (store[c.id] && !publicImageUrl(store[c.id]))));
  const batch = targets.slice(0, DAILY);
  console.log(`\n🏕️📷 캠핑 이미지 백필 — 대표이미지 없음 ${targets.length} · 이번 실행 ${batch.length} (상한 ${DAILY})`);

  let ok = 0, empty = 0, fail = 0, retrieved = 0;
  for (const c of batch) {
    try {
      const img = await imageOf(c.id);
      retrieved++;
      store[c.id] = img; // 빈 문자열도 기록 → 다음 실행에서 재시도 안 함
      if (img) ok++; else empty++;
    } catch (e) {
      if (e instanceof QuotaError) { console.log(`\n⛔ ${safeApiError(e)} — 진행분 저장 후 중단`); break; }
      fail++;
      if (fail <= 5) console.log(`  · ${c.name} 실패: ${safeApiError(e)}`);
    }
    await sleep(200);
  }

  if (batch.length && !retrieved) { console.error('캠핑 사진 조회 실패 — 기존 자료 유지'); process.exitCode = 1; return; }
  fs.writeFileSync(OUT, JSON.stringify(store));
  const recovered = Object.values(store).filter((v) => v).length;
  console.log(`\n💾 저장: data/camping-images.json`);
  console.log(`   이번: 복구 ${ok} · 사진없음 ${empty} · 실패 ${fail}`);
  console.log(`   누적 시도 ${Object.keys(store).length} · 복구 성공 ${recovered} · 남은 대상 ${Math.max(0, targets.length - batch.length)}\n`);
}
main().catch((e) => { console.error("❌ 실패:", safeApiError(e)); process.exit(1); });
