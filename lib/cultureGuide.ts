import type { CultureEvent, EventSourceDetail } from './types';
import { eventContentsText } from './eventContents';
import { fmtRange } from './format';

export function publicEventLink(value?: string): string {
  try {
    const url = new URL(value || '');
    if (!/^https?:$/.test(url.protocol) || url.username || url.password ||
      /^(localhost|127\.|10\.|192\.168\.|0\.)/.test(url.hostname) ||
      /[?&](?:servicekey|token|password|access_token)=/i.test(url.search)) return '';
    return url.href;
  } catch { return ''; }
}

export function verifiedEventDetail(event: CultureEvent): EventSourceDetail | undefined {
  const detail = event.sourceDetail;
  const key = (value:string) => value.replace(/[^가-힣a-z0-9]/gi,'').toLowerCase();
  return detail?.status === 'verified' && detail.eventStartDate === event.startDate &&
    detail.eventEndDate === event.endDate && key(detail.eventTitle) === key(event.title) ? detail : undefined;
}

const plain = (value?: string) => eventContentsText(value || '').replace(/\s+/g, ' ').trim();
const clamp = (value: string, max: number) => value.length > max ? value.slice(0, max - 1).trimEnd() + '…' : value;

export function cultureGuide(event: CultureEvent) {
  const detail = verifiedEventDetail(event);
  const facts = (detail?.facts || []).map(fact => ({ ...fact, value: plain(fact.value) })).filter(fact => fact.value);
  const find = (label: RegExp) => facts.find(fact => label.test(fact.label))?.value || '';
  const time = plain(event.scheduleLabel) || facts.find(fact => /시간|일시/.test(fact.label) &&
    /\d{1,2}\s*[:시]|오전|오후/.test(fact.value) && !/소요|러닝/.test(fact.label))?.value || '';
  const duration = find(/소요시간|러닝타임/) || facts.find(fact => fact.label === '관람시간' && /분|시간/.test(fact.value) && !/:/.test(fact.value))?.value || '';
  const age = find(/관람연령|관람등급/) || facts.find(fact => /대상|등급/.test(fact.label) && /세|학년|관람|성인|어린이|유아/.test(fact.value))?.value || '';
  const booking = facts.filter(fact => /신청|예약|예매|접수|준비물|모집|정원/.test(fact.label));
  const organizer = plain(event.organizerName) || find(/^주최$/);
  const official = publicEventLink(event.registrationUrl) || publicEventLink(detail?.url) || publicEventLink(event.officialUrl);
  const region = event.addressConflict ? '' : [event.area, event.sigungu].filter(Boolean).join(' ');
  const period = fmtRange(event.startDate, event.endDate);
  const price = plain(event.priceRaw || event.priceLabel) || '요금 정보 확인 필요';
  const summary = plain(event.description) || `${period}, ${plain(event.place) || '공식 안내에 등록된 장소'}에서 열리는 ${plain(event.realmName) || '문화행사'}입니다. ${event.priceType === 'unknown' ? '관람료는 공식 안내에서 확인해 주세요.' : `안내된 요금은 ${price}입니다.`}`;
  const visit = [time && `행사 시간은 ${time}입니다.`, duration && `안내된 소요시간은 ${duration}입니다.`, age && `관람·참여 대상은 ${age}입니다.`].filter(Boolean).join(' ');
  const title = event.seoTitle || (event.title.length < 58 && region
    ? `${event.title} | ${event.sigungu || event.area} ${event.genreKey === 'exhibition' ? '전시' : event.genreKey === 'edu' ? '체험' : '문화행사'} 일정` : event.title);
  const description = clamp(`${event.endDate && event.endDate < new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10).replace(/-/g, '') ? '종료 · ' : ''}${event.title} · ${period} · ${region} · ${price}${time ? ` · ${time}` : ''} · ${event.place}`, 80);
  const faq = [
    { question: '언제 열리나요?', answer: `${period} 일정입니다.${time ? ` 행사 시간은 ${time}입니다.` : ' 세부 시간과 회차는 공식 안내에서 확인해 주세요.'}` },
    { question: '어디에서 열리나요?', answer: `${event.place || '장소 확인이 필요합니다.'}${!event.addressConflict && event.address ? `. 주소는 ${event.address}입니다.` : ''}` },
    { question: event.priceType === 'free' ? '무료로 관람할 수 있나요?' : '관람료는 얼마인가요?', answer: event.priceType === 'unknown' ? '확정된 요금 안내가 없습니다. 공식 안내 또는 문의처에서 확인해 주세요.' : `${price}로 안내되어 있습니다.${event.priceType === 'partial_free' && event.freeCondition ? ` 무료 적용 조건: ${event.freeCondition}.` : ''}${event.priceType === 'free' ? ' 무료 행사도 초대권 수령이나 사전 신청이 필요할 수 있으니 참여 조건을 확인해 주세요.' : ''}` },
    ...(age ? [{ question: '관람·참여 연령은 어떻게 되나요?', answer: `공식 안내의 대상은 ${age}입니다.${duration ? ` 소요시간은 ${duration}입니다.` : ''}` }] : []),
    ...(booking.length ? [{ question: '신청 전에 무엇을 확인해야 하나요?', answer: booking.map(fact => `${fact.label}: ${fact.value}`).join(' · ') }] : []),
  ];
  const sources = (detail?.sources?.length ? detail.sources : detail ? [{url: detail.url, title: detail.title, checkedAt: detail.checkedAt}] : [])
    .filter(source => publicEventLink(source.url));
  return { detail, facts, time, duration, age, booking, organizer, official, region, period, price, summary, visit, title, description, faq, sources };
}

/** A clock is unambiguous only for a single-day event with exactly one session. */
export function eventStartIso(event: CultureEvent, time: string): string | undefined {
  if (event.startAt) return event.startAt;
  if (!/^\d{8}$/.test(event.startDate)) return undefined;
  const date = `${event.startDate.slice(0, 4)}-${event.startDate.slice(4, 6)}-${event.startDate.slice(6, 8)}`;
  const clocks = [...time.matchAll(/(?<!\d)([01]?\d|2[0-3]):([0-5]\d)(?!\d)/g)];
  if (event.startDate !== event.endDate || clocks.length !== 1 || /[~～–]|부터|까지/.test(time)) return date;
  let hour=Number(clocks[0][1]);
  if(/오후/.test(time)&&hour<12)hour+=12;
  if(/오전/.test(time)&&hour===12)hour=0;
  return `${date}T${String(hour).padStart(2, '0')}:${clocks[0][2]}:00+09:00`;
}
