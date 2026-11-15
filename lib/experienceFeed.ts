import type { Experience } from './experienceData';
import { experienceHref, experienceTopics } from './experienceData';
import { SITE } from './site';

const escape = (value: string) => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
}[char]!));
const paragraph = (text: string) => text ? `<p>${escape(text)}</p>` : '';
const list = (items: string[]) => items.length ? `<ul>${items.map(item => `<li>${escape(item)}</li>`).join('')}</ul>` : '';

/** Full substantive detail, using the same stored public facts as the internal page. */
export function experienceFeedBody(item: Experience): string {
  const period = item.period || (item.start ? `${item.start} ~ ${item.end}` : '');
  const facts = [
    ['활동 일정', period], ['참여 대상', item.audience],
    ['참가비', item.kind === 'rural' ? '체험별 비용은 공개자료에 미기재' : item.price || '공개자료에 미기재'],
    ['접수 안내', item.registration], ['보유 시설', item.facilities],
    ['운영·관리', item.institution], ['자료 기준일', item.referenceDate],
    ['주소', item.address || `${item.area} ${item.city}`], ['문의 전화', item.phone],
  ].filter(([, value]) => value);
  return [
    `<h2>${escape(item.title)}</h2>`, paragraph(item.summary),
    item.image ? `<figure><img src="${escape(new URL(item.image.src, SITE.url).href)}" alt="${escape(item.imageAlt)}"/><figcaption>${escape(item.imageAlt)}</figcaption></figure>` : '',
    item.kind === 'rural'
      ? `<h3>이 마을에서 할 수 있는 체험</h3>${list(item.programs)}${paragraph('공공자료에 등록된 체험입니다. 수확 시기와 작황에 따라 진행하는 프로그램이 달라질 수 있습니다.')}`
      : `<h3>${item.kind === 'science' ? '교육 내용' : '활동 안내'}</h3>${item.content.map(paragraph).join('')}${item.activities.length ? '<h3>무엇을 하나요?</h3>' + item.activities.map(paragraph).join('') : ''}`,
    item.venueOverview ? `<h3>장소 소개</h3>${paragraph(item.venueOverview)}${paragraph('한국관광공사 장소 소개 · 프로그램별 운영 안내와 별도로 제공되는 장소 정보입니다.')}` : '',
    `<h3>일정·비용·위치</h3><dl>${facts.map(([label, value]) => `<dt>${label}</dt><dd>${escape(value)}</dd>`).join('')}</dl>`,
    paragraph(item.kind === 'rural'
      ? '체험 운영일, 어린이 참여 연령, 최소 인원과 예약 가능 여부를 마을에 확인하세요.'
      : item.kind === 'science'
        ? '접수기간 안이라도 정원 마감일 수 있습니다. 전시 입장과 별도 교육예약 조건을 확인하세요.'
        : '활동명과 기관명을 확인해 신청하세요. API의 활동 일정과 실제 접수기간은 다를 수 있습니다.'),
    item.officialUrl ? `<p><a href="${escape(item.officialUrl)}">공식 신청·예약 안내</a></p>` : '',
    `<p><a href="${escape(new URL(experienceHref(item), SITE.url).href)}">홈페이지에서 체험 상세 보기</a></p>`,
    paragraph(`목록 확인: ${item.checkedAt}${item.detailCheckedAt ? ' · 상세자료 확인: ' + item.detailCheckedAt : ''}`),
    item.source ? `<p>출처: <a href="${escape(item.source)}">${item.kind === 'rural' ? '한국농어촌공사·한국어촌어항공단 농어촌 체험마을 API' : item.kind === 'family' ? '성평등가족부 청소년 프로그램 목록·상세 API' : '과학관 공식 교육 일정'}</a></p>` : '',
    item.venueOverview && item.venueSource ? `<p>장소 소개 출처: <a href="${escape(item.venueSource)}">한국관광공사</a></p>` : '',
  ].join('');
}

export function renderExperienceFeed(items: Experience[], builtAt = new Date()): string {
  const feedUrl = new URL('/rss.xml', SITE.url).href;
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel><title>${escape(SITE.name)} 체험·교육</title><link>${escape(SITE.url)}</link>
<description>가족·청소년 프로그램, 과학관 교육·행사, 농촌·어촌 체험의 내용과 일정·비용·신청 안내</description>
<language>ko-KR</language><lastBuildDate>${builtAt.toUTCString()}</lastBuildDate><ttl>60</ttl>
<atom:link href="${escape(feedUrl)}" rel="self" type="application/rss+xml"/>
${items.map(item => {
    const url = new URL(experienceHref(item), SITE.url).href;
    const body = escape(experienceFeedBody(item));
    // Collection/check timestamps are deliberately not represented as publication dates.
    return `<item><title>${escape(item.title)}</title><link>${escape(url)}</link><guid isPermaLink="true">${escape(url)}</guid><category>${escape(experienceTopics[item.kind].short)}</category><description>${body}</description><content:encoded>${body}</content:encoded></item>`;
  }).join('\n')}
</channel></rss>`;
}
