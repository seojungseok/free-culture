// 달력/날짜 필터용 유틸 (클라이언트 안전 — fs 없음). 모두 KST 기준.

export function kstNow(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

/** Date → "YYYYMMDD" (UTC 필드 사용: kstNow가 이미 +9 보정) */
export function toYmd(d: Date): string {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
}

export function todayYmd(): string {
  return toYmd(kstNow());
}

/** "YYYYMMDD" → Date (UTC 자정) */
export function fromYmd(ymd: string): Date {
  return new Date(
    Date.UTC(
      Number(ymd.slice(0, 4)),
      Number(ymd.slice(4, 6)) - 1,
      Number(ymd.slice(6, 8))
    )
  );
}

/** "YYYY-MM-DD" ↔ "YYYYMMDD" */
export function dashToYmd(s: string): string {
  return s.replace(/-/g, "");
}
export function ymdToDash(ymd: string): string {
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

export function addDaysYmd(ymd: string, n: number): string {
  const d = fromYmd(ymd);
  d.setUTCDate(d.getUTCDate() + n);
  return toYmd(d);
}

export function dowOf(ymd: string): number {
  return fromYmd(ymd).getUTCDay(); // 0=일 .. 6=토
}

const WEEK_KO = ["일", "월", "화", "수", "목", "금", "토"];

/** "YYYYMMDD" → "7월 25일 (토)" */
export function formatKoreanDate(ymd: string): string {
  const m = Number(ymd.slice(4, 6));
  const d = Number(ymd.slice(6, 8));
  return `${m}월 ${d}일 (${WEEK_KO[dowOf(ymd)]})`;
}

export function dowLabel(ymd: string): string {
  return WEEK_KO[dowOf(ymd)];
}

/** 이번 주말 (이번 주 토·일). 이미 일요일이면 오늘~오늘 취급 */
export function weekendRangeYmd(base = todayYmd()): { start: string; end: string } {
  const dow = dowOf(base);
  const toSat = (6 - dow + 7) % 7;
  const sat = addDaysYmd(base, toSat);
  const sun = addDaysYmd(sat, 1);
  return { start: sat, end: sun };
}

/** 이번 주 (월~일) */
export function weekRangeYmd(base = todayYmd()): { start: string; end: string } {
  const dow = dowOf(base); // 0=일
  const toMon = dow === 0 ? -6 : 1 - dow;
  const mon = addDaysYmd(base, toMon);
  return { start: mon, end: addDaysYmd(mon, 6) };
}

/** 이번 달 (해당 월 1일~말일). base 의 월 기준 */
export function monthRangeYmd(year: number, month0: number): { start: string; end: string } {
  const start = toYmd(new Date(Date.UTC(year, month0, 1)));
  const end = toYmd(new Date(Date.UTC(year, month0 + 1, 0)));
  return { start, end };
}

export function daysInMonth(year: number, month0: number): number {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

/** 특정 월의 모든 날짜 "YYYYMMDD" 배열 */
export function monthDays(year: number, month0: number): string[] {
  const n = daysInMonth(year, month0);
  const out: string[] = [];
  for (let d = 1; d <= n; d++) {
    out.push(
      `${year}${String(month0 + 1).padStart(2, "0")}${String(d).padStart(2, "0")}`
    );
  }
  return out;
}
