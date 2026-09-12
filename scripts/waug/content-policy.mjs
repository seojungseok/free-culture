import crypto from 'node:crypto';
import fs from 'node:fs';
import {decodeHtml} from './parse.mjs';
import {TICKET_POLICY, guaranteeActive} from '../../lib/ticket-guarantee.mjs';
export const VISIT_TOPICS = ['추천 대상','즐길 거리','예상 소요시간','위치','교통','주차','운영시간','이용권 종류','포함 사항','불포함 사항','예약·이용 방법','주의사항'];
export const EDITORIAL_REVISION = '2026-09-12';
const textValue = value => typeof value === 'string' && value.trim().length > 0;
const sourceUrl = value => { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password; } catch { return false; } };
const expiryTime = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? Date.parse(`${value}T23:59:59.999+09:00`) : Date.parse(value);
// Server jobs consume this metadata; no visitor-time requests are made.
export function ticketComparisonFreshness(row, now = new Date()) {
  const checked = Date.parse(row?.checkedAt), until = row?.validUntil == null ? Infinity : expiryTime(row.validUntil);
  if (!Number.isFinite(checked) || checked > +now || Number.isNaN(until) || until < +now || +now - checked > 7 * 86400000) return 'stale';
  return until - +now <= 7 * 86400000 ? 'due' : 'fresh';
}
const policy=JSON.parse(fs.readFileSync(new URL('../../data/waug/content-policy.json',import.meta.url),'utf8'));
const fresh = (at, now, age = 7 * 86400000) => Date.parse(at) <= +now && +now - Date.parse(at) <= age;
export function contentErrors(a, now = new Date(), products) {
  const revised = a.editorialRevision === EDITORIAL_REVISION;
  const legacy = policy.legacySlugs.includes(a.slug);
  if (a.contentPolicyVersion !== TICKET_POLICY && !legacy && Date.parse(a.createdAt)>=Date.parse(policy.effectiveAt)) return ['신규 작성 기준 버전 필요'];
  if (legacy && a.contentPolicyVersion === TICKET_POLICY) return ['기존 작성 글에 신규 기준 소급 적용 금지'];
  if (a.contentPolicyVersion !== TICKET_POLICY && !revised) return [];
  const errors = [], sources = new Set((a.sources || []).filter(s => fresh(s.checkedAt, now)).map(s => s.url));
  const evidenced = info => fresh(info?.checkedAt, now) && Array.isArray(info?.sourceUrls) && info.sourceUrls.length > 0 && info.sourceUrls.every(u => typeof u === 'string' && sourceUrl(u) && sources.has(u));
  // Topics are suggestions, never a quota. Omit information that is not known.
  if (a.visitInfo != null && !Array.isArray(a.visitInfo)) errors.push('방문 정보 배열 확인');
  for (const info of Array.isArray(a.visitInfo) ? a.visitInfo : []) {
    if (!textValue(info?.topic) || !textValue(info?.value) || (revised ? info.status !== 'confirmed' : !['confirmed','unknown'].includes(info.status)) || (info?.status === 'confirmed' && !evidenced(info))) errors.push(`방문 정보 근거 확인: ${info?.topic || '항목'}`);
  }
  if ((!revised && !a.sections?.some(s => s.kind === 'visit')) || a.sections?.filter(s => s.tickets).length !== 1 || !Array.isArray(a.faq) || !a.faq.length || a.faq.some(f => !textValue(f?.question) || !textValue(f?.answer) || (revised && /^(?:상품|예약|공식)\s*(?:페이지|사이트)에서?\s*확인(?:해\s*보세요|하세요|이 필요합니다)[.!?]*$/.test(f.answer.trim())))) errors.push('방문 정보·예약 안내·FAQ 구조 확인');
  if (revised) {
    if ((a.ticketComparison != null && !Array.isArray(a.ticketComparison)) || (a.productIds?.length > 1 && (!Array.isArray(a.ticketComparison) || !a.ticketComparison.length))) errors.push('확인된 이용권 비교표 필요');
    for (const row of Array.isArray(a.ticketComparison) ? a.ticketComparison : []) {
      if (!row || !['label','includes','checkedAt'].every(k => textValue(row[k])) || !['entryTime','duration','conditions'].every(k => typeof row[k] === 'string') || !evidenced(row) || (row.validUntil != null && (!textValue(row.validUntil) || !Number.isFinite(expiryTime(row.validUntil))))) errors.push('이용권 비교표 필드·실제 출처 확인');
      if (row?.href != null) {
        const linked = !products || products.some(p => a.productIds?.includes(p.id) && p.affiliateUrl === row.href && Array.isArray(row.sourceUrls) && row.sourceUrls.includes(p.detailUrl));
        if (typeof row.href !== 'string' || !/^https:\/\/www\.waug\.com\/r\/[A-Za-z0-9]+$/.test(row.href) || !linked) errors.push('이용권 비교표 기존 제휴 URL·상품 출처 확인');
      }
      if (ticketComparisonFreshness(row, now) === 'stale') errors.push('이용권 비교표 stale: 서버 재검수 필요');
    }
    for (const item of [...(Array.isArray(a.sections) ? a.sections : []), ...(Array.isArray(a.faq) ? a.faq : [])]) {
      if (item?.validUntil != null && (typeof item.validUntil !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.validUntil) || !Number.isFinite(Date.parse(`${item.validUntil}T00:00:00Z`)) || new Date(`${item.validUntil}T00:00:00Z`).toISOString().slice(0,10) !== item.validUntil)) errors.push('섹션·FAQ validUntil 실제 유효일 확인');
    }
  }
  if (a.contentReview?.status !== 'approved' || !fresh(a.contentReview.checkedAt, now) || !a.contentReview.sourceCompared || !a.contentReview.uniqueCopy || !a.contentReview.searchIntent || !a.contentReview.comparedSlugs || !a.contentReview.imageRightsChecked || !a.contentReview.noUnsupportedClaims) errors.push('신규 작성 기준·출처·검색 의도·이미지 권리 검수 필요');
  const placeTokens = typeof a.placeName === 'string' ? a.placeName.trim().split(/\s+/).filter(token => token && token !== a.area) : [];
  if (!placeTokens.length || typeof a.title !== 'string' || !placeTokens.every(token => a.title.includes(token)) || !a.description || a.description === a.intro) errors.push('실제 장소 제목 및 본문과 일치하는 고유 검색 설명 확인');
  // Existing legacy assets keep their original readiness/rights gates and renderer.
  if (legacy) return errors;
  const images = [a.thumbnail, ...(a.photos || [])].filter(Boolean);
  const generated = images.filter(p => p.kind === 'ai-generated');
  if (new Set(generated.map(p => p.url)).size > 4) errors.push('AI 생성 이미지는 글당 최대 4장');
  for (const p of images) {
    if (!(p.width > 0 && p.height > 0)) errors.push('이미지 크기 저장 필요');
    if (p.kind === 'ai-generated') {
      if (p.role !== 'illustration' || !p.necessityNote || !p.generation?.nonDocumentaryReviewed || !p.generation?.realPhotoSearchNote) errors.push('AI 보조 이미지 필요성·실제 장소 오인 방지 검수 필요');
    } else {
      const rights = p === a.thumbnail ? p.sources : [p];
      if (!rights?.length || rights.some(r => !r.sourceUrl || !r.rightsUrl || !r.usageConditions || !r.credit || !r.commercialAllowed || !r.placeMatched || !fresh(r.checkedAt, now) || (r.edited && !r.editAllowed))) errors.push('개별 사진 출처·이용 조건·상업적 사용 근거 필요');
      if (rights?.some(r => (r.provider === 'waug' || p.kind === 'waug-original' || p.url?.includes('cloudfront.net/files/good/')) && (r.faceReview?.status !== 'no-identifiable-faces' || !['partner-material','explicit-permission'].includes(r.permissionBasis)))) errors.push('와그 사진 제휴 사용 허가·얼굴 검수 필요');
    }
  }
  if (!(a.photos || []).length && !a.imageResearch?.unavailableReason) errors.push('본문 사진 부족 사유 기록 필요');
  return errors;
}
const clean = html => decodeHtml(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
const normalize = value => String(value || '').replace(/\s+/g,' ').trim();
// A general footer mentioning a guarantee is never evidence. An editor must first
// identify this product's badge and its exact applicable conditions on the page.
export async function recheckGuarantee(p, {fetcher = fetch, now = new Date()} = {}) {
  const checkedAt = now.toISOString(), review = p.priceGuaranteeReview;
  const result = {status:'unconfirmed',affiliateUrl:p.affiliateUrl,sourceUrl:p.detailUrl || '',checkedAt,reason:'상품별 보장 근거 미확인'};
  try {
    if (!/^https:\/\/www\.waug\.com\/ko\/activities\/\d+$/.test(p.detailUrl || '')) throw Error('상품 상세 주소 미확인');
    const response = await fetcher(p.detailUrl, {redirect:'error',signal:AbortSignal.timeout(12000)});
    if (!response.ok) throw Error(`상품 확인 HTTP ${response.status}`);
    const html = await response.text(), body = clean(html);
    result.pageSha256 = crypto.createHash('sha256').update(html).digest('hex');
    if (review?.status !== 'approved' || review.sourceUrl !== p.detailUrl || review.affiliateUrl !== p.affiliateUrl || review.productId !== p.productId || review.productBadgeConfirmed !== true || !fresh(review.checkedAt, now) || !review.conditions || !review.evidenceText) return result;
    const evidence = normalize(review.evidenceText), conditions = normalize(review.conditions);
    if (review.startsAt && !(Date.parse(review.startsAt) <= +now)) throw Error('보장 적용 시작 전·미확인');
    if (!/최저가\s*보장/.test(evidence) || !body.includes(evidence) || !body.includes(conditions)) throw Error('보장 표시 또는 적용 조건 변경·미확인');
    const expiry = Math.min(+now + 86400000, review.endsAt ? Date.parse(review.endsAt) : Infinity);
    if (!(expiry > +now)) throw Error('보장 적용 기간 종료·미확인');
    return {...result,status:'confirmed',reason:undefined,conditions,evidenceText:evidence,reviewedAt:review.checkedAt,expiresAt:new Date(expiry).toISOString()};
  } catch (error) { return {...result,reason:error.message}; }
}
export async function recheckBeforePublish(state, products, options = {}) {
  const now = options.now || new Date();
  const candidates = state.articles.filter(a => a.contentPolicyVersion === TICKET_POLICY && !a.publishedAt && a.status === 'scheduled' && Date.parse(a.scheduledAt) <= +now);
  const ids = [...new Set(candidates.flatMap(a => a.productIds))], results = new Map();
  await Promise.all(Array.from({length:3}, async () => {
    while (ids.length) { const id = ids.shift(), p = products.find(p => p.id === id); if (p) results.set(id, await recheckGuarantee(p,{...options,now})); }
  }));
  for (const a of candidates) a.priceGuaranteeChecks = Object.fromEntries(a.productIds.map(id => [id,results.get(id) || {status:'unconfirmed',checkedAt:now.toISOString(),reason:'상품 없음'}]));
}
export function publicationGuarantee(a, p, now) {
  const g = a.priceGuaranteeChecks?.[p.id];
  return fresh(g?.checkedAt, now, 15 * 60000) && guaranteeActive(g,p.affiliateUrl,+now) ? structuredClone(g) : null;
}
