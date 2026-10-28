import { kstDay } from './winter-course.mjs';
import { createHash } from 'node:crypto';

const caps = {'당일': 3, '1박2일': 2};
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const knownSlugs = {
  'seoul-family-day-ervk2g':'seoul-bukchon-winter-daytrip',
  'busan-family-day-mnyk49':'busan-dongbaek-winter-daytrip',
  'seoul-heritage-1n2d-cfrk65':'seoul-history-winter-1n2d',
  'busan-nature-1n2d-ilhzk2':'busan-winter-1n2d-course',
};
export function publicationSlug(sourceCourseId, duration) {
  if (knownSlugs[sourceCourseId]) return knownSlugs[sourceCourseId];
  const region = /^[a-z]+/.exec(String(sourceCourseId))?.[0] || 'korea';
  const period = duration === '당일' ? 'daytrip' : '1n2d';
  return `${region}-winter-${period}-${createHash('sha256').update(String(sourceCourseId)).digest('hex').slice(0,10)}`;
}

// Actual publication counts, not the number of drafted or held candidates.
export function remainingPublications(rows, now = new Date()) {
  const today = kstDay(now);
  return Object.fromEntries(Object.entries(caps).map(([duration, cap]) => {
    const count = rows.filter(row => row.status === 'published' && row.duration === duration &&
      Number.isFinite(Date.parse(row.publishedAt || '')) && kstDay(new Date(row.publishedAt)) === today).length;
    return [duration, Math.max(0, cap - count)];
  }));
}
export function availableTargets(remaining, pool) {
  return Object.fromEntries(Object.keys(caps).map(duration=>[duration,Math.min(remaining[duration] || 0,pool.filter(course=>course.duration===duration).length)]));
}
// Select the largest non-overlapping portfolio; favour scarce overnight
// courses on a tie so that a day course cannot block the only overnight.
export function bestPortfolio(pool, remaining) {
  const ordered=[...pool.filter(c=>c.duration==='1박2일').slice(0,12),...pool.filter(c=>c.duration==='당일').slice(0,12)];
  let best=[];
  const goal=Math.min(5,(remaining['당일']||0)+(remaining['1박2일']||0));
  const overlap=(a,b)=>{const ids=new Set(a.stops.map(s=>s.placeId));return b.stops.filter(s=>ids.has(s.placeId)).length/Math.min(a.stops.length,b.stops.length)>=0.67;};
  function visit(start,chosen,counts){
    const overnight=chosen.filter(c=>c.duration==='1박2일').length;
    if(chosen.length>best.length || (chosen.length===best.length && overnight>best.filter(c=>c.duration==='1박2일').length))best=[...chosen];
    if(best.length===goal)return true;
    for(let i=start;i<ordered.length;i++){
      const next=ordered[i];
      if((counts[next.duration]||0)>=(remaining[next.duration]||0) || chosen.some(c=>overlap(c,next)))continue;
      if(visit(i+1,[...chosen,next],{...counts,[next.duration]:(counts[next.duration]||0)+1}))return true;
    }
    return false;
  }
  if(goal)visit(0,[],{});
  return best;
}

function validEvidence(stop, registry, now) {
  const record = registry?.places?.[String(stop.placeId)];
  if (!record || record.eligible !== true || record.name !== stop.name || !nonempty(record.feature) || !nonempty(record.winterReason)) return null;
  if (record.displayName != null && (!nonempty(record.displayName) || !/^[가-힣a-zA-Z0-9\s·()\-]{2,80}$/.test(record.displayName))) return null;
  const checked = Date.parse(record.verifiedAt || '');
  if (!Number.isFinite(checked) || checked > now.getTime() || now.getTime() - checked > 90 * 86400000) return null;
  try { const url = new URL(record.sourceUrl); if (url.protocol !== 'https:' || url.username || url.password) return null; } catch { return null; }
  // Public copy cannot assert changeable entry, price, opening, weather or transit details.
  if (record.detail != null && (!nonempty(record.detail) || record.detail.length > 250)) return null;
  if (/\d|무료|유료|할인|예약\s*필수|매일\s*운영|운영\s*중|영업\s*중|눈꽃\s*(?:명소|보장)|보장/.test(record.feature + record.winterReason + (record.detail || ''))) return null;
  return record;
}

// Records are submitted by a separate verification process; a model's output or
// raw tourism cache on its own cannot create or approve a verification record.
export function preparePublication(draft, registry, now = new Date()) {
  if (!draft || draft.status !== 'draft' || !['당일','1박2일'].includes(draft.duration)) return null;
  if (!Array.isArray(draft.stops) || draft.stops.length < (draft.duration === '당일' ? 2 : 4) || draft.stops.length > (draft.duration === '당일' ? 3 : 6)) return null;
  const evidence = draft.stops.map(stop => validEvidence(stop, registry, now));
  if (evidence.some(value => !value)) return null;
  const stops = draft.stops.map((stop, index)=>({...stop, name:evidence[index].displayName || stop.name, officialUrl:evidence[index].sourceUrl}));
  const expectedDays = draft.duration === '당일' ? [1] : [1, 2];
  if (expectedDays.some(day => !draft.stops.some(stop => stop.day === day))) return null;
  const names = new Set();
  for (const stop of draft.stops) {
    if (!/^\d+$/.test(String(stop.placeId || '')) || names.has(String(stop.placeId)) || !expectedDays.includes(stop.day)) return null;
    names.add(String(stop.placeId));
  }
  const sections = [];
  for (const day of expectedDays) {
    const dayStops = stops.filter(stop => stop.day === day);
    const dayIds = new Set(dayStops.map(stop=>String(stop.placeId)));
    const connections = [];
    if (dayIds.has('1604784') && dayIds.has('1604824')) connections.push('흥화문과 경희궁공원은 같은 경희궁 권역이므로 따로 먼 곳을 이동하는 일정이 아닙니다.');
    if (dayIds.has('2778454') && dayIds.has('129186')) connections.push('정동길과 덕수궁 돌담길은 일부 이어지는 산책 구간이므로 한 번의 산책으로 묶어 보세요.');
    if (dayIds.has('1918263') && dayIds.has('128810')) connections.push('누리마루 APEC하우스는 동백공원 권역에 있어 공원 산책과 함께 둘러볼 수 있습니다.');
    sections.push({heading: draft.duration === '당일' ? '방문 순서' : `${day}일 차 방문 순서`, paragraphs: [
      `${dayStops.map(stop => stop.name).join(' → ')} 순서로 둘러보는 일정입니다. 방문 순서는 교통편과 날씨에 맞춰 조정하세요.`,
      ...connections,
      '출발 전 지도에서 실제 이동 경로와 교통편을 확인하세요.'
    ]});
    for (const [position, stop] of dayStops.entries()) {
      const record = evidence[stops.indexOf(stop)];
      const role = position === 0
        ? `첫 방문 후보인 ${stop.name}부터 살펴보고 동행자의 관심사에 맞춰 이 날의 일정을 시작해 보세요.`
        : `앞서 살펴본 ${dayStops[position-1].name} 다음에 이어지는 방문 후보입니다. 이동 경로는 지도에서 확인해 주세요.`;
      sections.push({heading: stop.name, paragraphs: [record.feature, ...(nonempty(record.detail) ? [record.detail] : []), record.winterReason, role]});
    }
  }
  if (draft.duration === '1박2일') {
    const firstEnd=stops.filter(stop=>stop.day===1).at(-1), secondStart=stops.find(stop=>stop.day===2);
    sections.push({heading:'숙박 지역 고르기', paragraphs:[`첫날 마지막 후보 ${firstEnd.name}에서 둘째 날 시작 후보 ${secondStart.name}까지의 실제 이동 경로를 먼저 살펴보세요.`, '대중교통을 이용한다면 숙소 주변 정류장과 다음 날 이동편을, 차량을 이용한다면 주차 조건을 비교해 예산에 맞게 고르세요.']});
  }
  sections.push({heading:'겨울 방문 전 확인', paragraphs:['출발 전 각 장소의 공식 안내에서 운영일과 예약·요금을 확인하고, 날씨와 도로 상황도 살펴보세요. 기상이 나쁘면 야외 일정은 조정하거나 생략하세요.']});
  const durationLabel = draft.duration === '당일' ? '당일치기' : '1박 2일';
  return {...draft, slug:publicationSlug(draft.sourceCourseId,draft.duration), stops,
    title:`${draft.area} 겨울 ${durationLabel} 여행코스 · ${stops[0].name}에서 ${stops.at(-1).name}까지`,
    intro:`${draft.area}에서 겨울에 둘러볼 장소를 묶은 여행 계획입니다: ${stops.map(stop=>stop.name).join(', ')}. 날씨와 각 장소의 안내에 맞춰 순서를 조절해 보세요.`, sections,
    sources:evidence.map((record, i)=>({title:`${stops[i].name} 공식 안내`,url:record.sourceUrl,checkedAt:record.verifiedAt})),
    status:'published', publishedAt:now.toISOString(),
    validation:{version:1, checkedAt:now.toISOString(),sourceKind:'cached-tour-data',checks:['identity','coordinates','route','text'], needsEditorialReview:false, routeBasis:'내부 코스의 좌표 및 각 장소의 검증 기록을 대조했습니다. 실제 도로와 운영은 출발 전 확인이 필요합니다.'}};
}
