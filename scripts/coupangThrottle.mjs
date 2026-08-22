// scripts/coupangThrottle.mjs
// 쿠팡 파트너스 레이트리밋(분당 초과 호출 시 패널티) 방지용 공용 게이트.
//
// 규칙: **분당 6회 미만**. 모든 쿠팡 API 호출 직전에 `await gate()` 를 부르면
// 호출 간격을 최소 MIN_INTERVAL_MS(기본 10.5초 ≈ 분당 5.7회) 이상으로 벌려 준다.
// (fetch/네트워크 시간이 더해지므로 실제 호출수는 항상 분당 6회 "미만")
//
// ★ 프로세스가 달라도 간격이 유지된다.
//   collectCoupang / collectCoupangEssentials / collectEventCoupang / collectKidCoupang 은
//   워크플로에서 "순차" 실행되지만 각각 별개 프로세스라, 예전 메모리 게이트로는
//   앞 스크립트의 마지막 호출 직후에 다음 스크립트가 바로 때릴 수 있었다.
//   → 마지막 호출 시각을 임시파일에 남겨 프로세스 사이에서도 간격을 지킨다.
//
// 필요하면 환경변수로 조정: COUPANG_MIN_INTERVAL_MS=12000

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const MIN_INTERVAL_MS = Number(process.env.COUPANG_MIN_INTERVAL_MS) || 10500;
const STAMP = path.join(os.tmpdir(), "coupang-partners-last-call");

let lastCallAt = 0;

function readStamp() {
  try {
    const v = Number(fs.readFileSync(STAMP, "utf8").trim());
    return Number.isFinite(v) ? v : 0;
  } catch { return 0; }
}
function writeStamp(t) {
  try { fs.writeFileSync(STAMP, String(t), "utf8"); } catch { /* 임시파일 못 써도 메모리 게이트로 동작 */ }
}

/** 직전 호출(다른 스크립트 포함)로부터 MIN_INTERVAL_MS 가 지날 때까지 대기. */
export async function gate() {
  const prev = Math.max(lastCallAt, readStamp());
  const wait = prev + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();
  writeStamp(lastCallAt);
}

export { MIN_INTERVAL_MS };
