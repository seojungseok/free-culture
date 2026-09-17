import {createHash} from 'node:crypto';

export function courseFingerprint(c){
  return createHash('sha256').update(JSON.stringify([c.duration,c.themes,c.source,(c.stops||[]).map(s=>[s.placeId,s.name,s.mapx,s.mapy])])).digest('hex');
}
export function canRetryCourse(course,history,now=Date.now()){
  const previous=history[course.id];
  return !previous||previous.fingerprint!==courseFingerprint(course)||Date.parse(previous.retryAt)<=now;
}
export function holdCourse(history,course,reason,{now=Date.now(),transient=false}={}){
  history[course.id]={fingerprint:courseFingerprint(course),reason:String(reason).slice(0,400),checkedAt:new Date(now).toISOString(),retryAt:new Date(now+(transient?1:3)*86400000).toISOString()};
}
export function takeNextCourse(items,counts,target){
  const quota={'당일':Math.round(target*.5),'1박2일':Math.round(target*.3),'2박3일':target-Math.round(target*.5)-Math.round(target*.3)};
  const i=items.findIndex(c=>(counts[c.duration]||0)<(quota[c.duration]||0));
  return items.splice(i<0?0:i,1)[0];
}
// 여름·지방 우선 큐: 지금 여름휴가철 → 지방·바다피서부터 채워 시즌 검색 트래픽 흡수
const REGION_PRIORITY = {
  강원: 10, 제주: 10, 전남: 9, 전북: 9, 경남: 9, 경북: 9,
  충남: 7, 충북: 7, 부산: 6, 대구: 6, 광주: 6, 대전: 6, 울산: 6,
  인천: 4, 경기: 3, 세종: 3, 서울: 2,
};

// 실제 검색 의도가 강한 느린 가족 동선과 사찰·시장 코스를 우선 발행한다.
const courseNames = (c) => (c.stops || []).map((s) => String(s.name || "")).join(" ");
const isSeniorPlan = (c) => {
  const text = courseNames(c);
  return /(사찰|절(?=\s|$)|암자|향교|서원|고택|성당|성지)/.test(text) && /(시장|오일장|5일장|장터)/.test(text);
};
export const isImpossibleRoute = (c) => {
  const names = (c.stops || []).map((s) => String(s.name || ""));
  const ferryIsland = /(굴업|덕적|백령|대청|연평|울릉|거문|욕지|한산|사량|청산|보길|노화|소안|흑산|추자)/;
  return names.some((name) => ferryIsland.test(name)) && names.some((name) => !ferryIsland.test(name));
};
// 계절 자동 — 현재 달에 맞는 테마 우선(여름=바다, 가을=문화유적·축제, 겨울=실내)
function seasonTheme() {
  const m = new Date().getMonth() + 1;
  if (m >= 6 && m <= 8) return "바다피서";
  if (m >= 9 && m <= 11) return "문화유적";
  if (m === 12 || m <= 2) return "가족체험";
  return "가족체험"; // 봄
}

// 현재 계절(월 기준) — 코스의 계절 태그(seasons)와 매칭해 제철 코스 우선 발행.
function currentSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

export function pickQueue(courses, doneIds, n) {
  const seasonKey = seasonTheme();
  const curSeason = currentSeason();
  const cand = courses.filter((c) => ["당일","1박2일","2박3일"].includes(c.duration) && !doneIds.has(c.id) && !isImpossibleRoute(c) && (c.stops?.length || 0) >= 2);
  const prio = (a, b) => {
    // ① 제철 스팟(온천·꽃·단풍·물가 등)을 가진 코스를 최우선 — 계절별 다양화
    const na = a.seasons?.includes(curSeason) ? 1 : 0, nb = b.seasons?.includes(curSeason) ? 1 : 0;
    if (na !== nb) return nb - na;
    const sa = a.themes?.includes(seasonKey) ? 1 : 0, sb = b.themes?.includes(seasonKey) ? 1 : 0;
    if (sa !== sb) return sb - sa;                                  // 제철 테마 먼저
    const oa = a.source === "official" ? 1 : 0, ob = b.source === "official" ? 1 : 0;
    if (oa !== ob) return ob - oa;                                  // 공식 우선
    const ra = REGION_PRIORITY[a.area] || 1, rb = REGION_PRIORITY[b.area] || 1;
    if (ra !== rb) return rb - ra;                                  // 지방 우선
    return (b.stops?.length || 0) - (a.stops?.length || 0);
  };
  // 기간별 비율 배분: 당일 50% · 1박2일 30% · 2박3일 20% (예: 10개 → 5·3·2).
  //  베스트 목록은 예약 코스 비율에서 제외하며 수동 작업으로만 선택한다.
  const buckets = { "당일": [], "1박2일": [], "2박3일": [], "베스트": [] };
  for (const c of cand) (buckets[c.duration] || (buckets[c.duration] = [])).push(c);
  for (const k of Object.keys(buckets)) buckets[k].sort(prio);
  const quota = { "당일": Math.round(n * 0.5), "1박2일": Math.round(n * 0.3), "2박3일": n - Math.round(n * 0.5) - Math.round(n * 0.3) };
  const idx = { "당일": 0, "1박2일": 0, "2박3일": 0, "베스트": 0 };
  const out = [];
  const taken = new Set();
  const reserve = (predicate, count) => {
    for (const c of cand.filter(predicate).sort(prio)) {
      if (out.length >= n || taken.has(c.id) || count <= 0) continue;
      if (quota[c.duration]===undefined || out.filter(x=>x.duration===c.duration).length >= quota[c.duration]) continue;
      out.push(c); taken.add(c.id); count--;
    }
  };
  // 하루 10개 기준: 사찰·전통시장 동선 3개를 먼저 확보한다.
  reserve(isSeniorPlan, Math.min(3, n));
  // 1) 비율만큼 우선 채움
  for (const k of ["당일", "1박2일", "2박3일"]) {
    const b = buckets[k];
    let added = out.filter(c=>c.duration===k).length;
    while (out.length < n && added < (quota[k] || 0) && idx[k] < b.length) {
      const c = b[idx[k]++];
      if (taken.has(c.id)) continue;
      out.push(c); taken.add(c.id); added++;
    }
  }
  // 2) 부족분은 남은 코스(당일→1박2일→2박3일→베스트)에서 채워 목표 n 맞춤
  let progressed = true;
  while (out.length < n && progressed) {
    progressed = false;
    for (const k of ["당일", "1박2일", "2박3일", "베스트"]) {
      const b = buckets[k];
      if (b) {
        while (idx[k] < b.length && taken.has(b[idx[k]].id)) idx[k]++;
        if (idx[k] < b.length) { out.push(b[idx[k]]); taken.add(b[idx[k]].id); idx[k]++; progressed = true; if (out.length >= n) break; }
      }
    }
  }
  return out;
}
