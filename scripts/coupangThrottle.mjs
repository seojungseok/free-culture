// scripts/coupangThrottle.mjs
// 쿠팡 파트너스 레이트리밋(분당 초과 호출 시 패널티) 방지용 공용 게이트.
//
// 모든 쿠팡 API 호출 직전에 `await gate()` 를 부르면, 호출 간격을 최소
// MIN_INTERVAL_MS(기본 7.5초 = 분당 8회) 이상으로 벌려 준다.
// 쿠팡 한도는 분당 50회지만, 패널티를 맞은 적이 있어 최대한 안전하게 8회로 낮춤.
// (fetch/네트워크 시간이 더해지므로 실제 호출수는 항상 분당 8회 "미만")
//
// 세 수집 스크립트(collectCoupang / collectEventCoupang / collectKidCoupang)는
// 워크플로에서 "순차" 실행되므로, 프로세스별 게이트만으로도 전체 분당 호출수가
// 10회 아래로 유지된다. (동시 실행하면 이 가정이 깨지니 주의)
//
// 필요하면 환경변수로 간격 조정: COUPANG_MIN_INTERVAL_MS=8000

const MIN_INTERVAL_MS = Number(process.env.COUPANG_MIN_INTERVAL_MS) || 7500;
let lastCallAt = 0;

/** 직전 호출로부터 MIN_INTERVAL_MS 가 지날 때까지 대기 (분당 호출수 상한 보장). */
export async function gate() {
  const now = Date.now();
  const wait = lastCallAt + MIN_INTERVAL_MS - now;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();
}

export { MIN_INTERVAL_MS };
