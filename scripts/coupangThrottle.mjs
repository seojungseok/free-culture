// Operating ceiling, not an official Coupang allowance. All I/O uses the shared gateway.
export const MIN_INTERVAL_MS=6100;
export async function gate(){throw Error('로컬 제한기 사용 금지: 중앙 coupangFetch를 사용하세요.');}
export {coupangFetch} from './prep/coupang.mjs';
