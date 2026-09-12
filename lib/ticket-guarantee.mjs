export const TICKET_POLICY = 'tickets-2026-09-11';
export const AI_DISCLOSURE = '이해를 돕기 위한 AI 생성 이미지';
export const AFFILIATE_DISCLOSURE = '이 글에는 제휴링크가 포함되어 있으며, 예약 시 수수료를 받을 수 있습니다.';
export function guaranteeActive(g, href, now = Date.now()) {
  if (!g || g.status !== 'confirmed' || g.affiliateUrl !== href || !g.conditions || !g.evidenceText || !g.pageSha256) return false;
  if (!/^https:\/\/www\.waug\.com\/(?:ko\/)?(?:activities|goods)\/\d+\/?$/.test(g.sourceUrl || '')) return false;
  const checked = Date.parse(g.checkedAt), reviewed = Date.parse(g.reviewedAt), expires = Date.parse(g.expiresAt);
  return Number.isFinite(now) && checked <= now && now - checked < 86400000 && reviewed <= checked && checked - reviewed <= 7 * 86400000 && expires > now;
}
export function bookingLabel(g, href, now) {
  return '이용권 가격·혜택 확인';
}
