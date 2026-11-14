import fs from 'node:fs';
import path from 'node:path';

const hour = 3600000;
export const DATA_SOURCES = [
  {id:'events', label:'문화행사', provider:'한국문화정보원', file:'events.json', field:'events', interval:'매일', maxHours:36},
  {id:'festivals', label:'축제', provider:'한국관광공사·지역 관광기관', file:'festivals.json', field:'festivals', interval:'매일', maxHours:36},
  {id:'pet-travel', label:'반려동물 동반여행', provider:'한국관광공사', file:'pet-travel.json', field:'places', interval:'매일', maxHours:36},
  {id:'places', label:'관광지', provider:'한국관광공사', file:'places.json', field:'spots', interval:'매주 월요일', maxHours:216},
  {id:'restaurants', label:'음식점', provider:'한국관광공사', file:'restaurants.json', field:'restaurants', interval:'매주 월요일', maxHours:216},
  {id:'camping', label:'캠핑장', provider:'한국관광공사 고캠핑', file:'camping.json', field:'camps', interval:'매주 월요일', maxHours:216},
  {id:'learning', label:'문화·취미 강좌', provider:'지방자치단체·교육청', file:'learning-classes.json', field:'courses', interval:'매일', maxHours:36},
  {id:'accessible', label:'이동·영유아 편의정보', provider:'한국관광공사', file:'accessible-travel.json', field:'places', interval:'화~일요일 · 상세 순차 확인', maxHours:72},
  {id:'rural-experiences', label:'농촌·어촌 체험', provider:'한국농어촌공사·한국어촌어항공단', file:'rural-experiences.json', field:'records', interval:'매일 원자료 확인 · 원문 반기 갱신', maxHours:36},
  {id:'youth-experiences', label:'어린이·청소년 체험', provider:'성평등가족부', file:'youth-experiences.json', field:'records', interval:'매일', maxHours:36,allowEmpty:true},
  {id:'science-experiences', label:'과학관 교육·체험', provider:'국립중앙과학관·인천학생과학관', file:'science-experiences.json', field:'records', interval:'매일 공식 교육 일정 확인', maxHours:36,allowEmpty:true},
];

export function buildDataFreshness(datasets, now = new Date()) {
  const at = now.getTime();
  const sources = DATA_SOURCES.map(({id,label,provider,file,field,interval,maxHours,allowEmpty}) => {
    const data = datasets[file];
    const raw = data?.refresh?.checkedAt || data?.generatedAt;
    const parsed = Date.parse(raw);
    const valid = Number.isFinite(parsed) && parsed <= at + 5 * 60000;
    const records = data?.[field];
    const count = Array.isArray(records) ? records.length : records && typeof records === 'object' ? Object.keys(records).length : 0;
    const regional = Object.values(data?.sourceRefresh || {}).some(source => source?.success === false || ['deferred','degraded','failure'].includes(source?.status));
    const partial = data?.incompleteRefresh === true || data?.refresh?.complete === false || regional;
    const validEmpty=allowEmpty&&Array.isArray(records)&&data?.refresh?.complete===true;
    const status = !valid || !count&&!validEmpty ? 'missing' : at - parsed > maxHours * hour ? 'stale' : partial ? 'partial' : 'fresh';
    return {id,label,provider,interval,count,checkedAt:valid ? new Date(parsed).toISOString() : null,status};
  });
  return {checkedAt:now.toISOString(), healthy:sources.every(source => source.status === 'fresh'), sources};
}

export function readDataFreshness({directory = path.join(process.cwd(),'data'), now = new Date()} = {}) {
  const datasets = {};
  for (const source of DATA_SOURCES) {
    try { datasets[source.file] = JSON.parse(fs.readFileSync(path.join(directory,source.file),'utf8')); }
    catch { datasets[source.file] = null; }
  }
  return buildDataFreshness(datasets,now);
}
