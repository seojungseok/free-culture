// 클라이언트/서버 공용 (fs 사용 안 함)

export function fmtDate(ymd: string): string {
  if (!ymd || ymd.length !== 8) return "";
  return `${ymd.slice(0, 4)}.${ymd.slice(4, 6)}.${ymd.slice(6, 8)}`;
}

export function fmtRange(start: string, end: string): string {
  const s = fmtDate(start);
  const e = fmtDate(end);
  if (s && e) return s === e ? s : `${s} – ${e}`;
  return s || e || "상시";
}

function kstYmd(): string {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
}

/** 종료까지 남은 날. 진행중이면 D-n, 아직 시작 전이면 곧 시작 */
export function dday(
  start: string,
  end: string
): { label: string; critical: boolean } | null {
  const today = kstYmd();
  if (!end || end.length !== 8) return null;
  if (end < today) return null;
  const toDate = (y: string) =>
    new Date(Number(y.slice(0, 4)), Number(y.slice(4, 6)) - 1, Number(y.slice(6, 8)));
  const now = toDate(today);
  if (start && start > today) {
    const days = Math.round((toDate(start).getTime() - now.getTime()) / 86400000);
    return { label: days === 0 ? "오늘 시작" : `${days}일 뒤 시작`, critical: false };
  }
  const days = Math.round((toDate(end).getTime() - now.getTime()) / 86400000);
  // 빨강은 오늘/내일 마감일 때만
  if (days <= 0) return { label: "오늘 마감", critical: true };
  if (days === 1) return { label: "내일 마감", critical: true };
  if (days <= 7) return { label: `D-${days}`, critical: false };
  return { label: `~${fmtDate(end).slice(5)}`, critical: false };
}

export function placeText(area: string, sigungu: string, place: string): string {
  const region = [area, sigungu].filter(Boolean).join(" ");
  if (place && region) return `${place} · ${region}`;
  return place || region || "";
}
