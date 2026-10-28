import { createHash } from 'node:crypto';

export const kstDay = (date = new Date()) => date.toLocaleDateString('sv-SE', {timeZone:'Asia/Seoul'});
export const clean = (value) => String(value || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const volatile = /\d|요금|가격|무료|유료|운영|영업|휴무|예약|주차|소요|시간|분|일정|매년|월요일|화요일|수요일|목요일|금요일|토요일|일요일|기온|날씨|눈꽃|적설|개장|폐장|숙박|할인|배달|권장|완공|준공|최초|최대|유일|체험|프로그램|제공|관람|공연|구입|판매/;
export function safeEvidence(raw) {
  return clean(raw).split(/(?<=[.!?。])\s+/u).map(clean).filter(s=>s.length>=25 && s.length<=100 && !volatile.test(s)).slice(0,2);
}
export function checkSummaries(raw, evidence) {
  let parsed; try {parsed=JSON.parse(raw);} catch {throw Error('SUMMARY_OUTPUT_INVALID');}
  if(!parsed || !Array.isArray(parsed.stops) || Object.keys(parsed).some(k=>k!=='stops'))throw Error('SUMMARY_OUTPUT_INVALID');
  const map=new Map();
  for(const row of parsed.stops) {
    const id=String(row?.placeId||''), q=clean(row?.quote), summary=clean(row?.summary);
    if(!evidence.has(id)||map.has(id)||!evidence.get(id).includes(q)||!q||(summary && (summary.length<15||summary.length>130||volatile.test(summary)||/[<>\r\n]/.test(summary))))throw Error('SUMMARY_UNVERIFIED');
    // A matching citation does not prove that a model's paraphrase is true.
    // Display only the exact short source excerpt until an editor verifies it.
    const provenance=evidence.provenance?.get(id)?.get(q) || null;
    map.set(id,{quote:q,summary:q,provenance});
  }
  return map;
}
const validName = (value) => /^[가-힣a-zA-Z0-9\s·()\-]{2,80}$/.test(value);
const nonVisitor = /초등학교|중학교|고등학교|대학교|대학병원|주민센터|구청|시청|군청|읍사무소|면사무소|웰컴센터|관광안내소|스키용품|스키대여|렌탈샵|스키샵/;
// Confirmed outdated identities or destinations requiring separate winter/ferry review.
const reviewedHoldIds = new Set(['2472824','2553685','3066924','126890','579637']);
const riskyRoute = /섬|등산|산행|산악|적대봉|상화도/;
function particle(value, consonant, vowel) {
  const code=String(value).replace(/[^가-힣0-9a-zA-Z]+$/g,'').charCodeAt(String(value).replace(/[^가-힣0-9a-zA-Z]+$/g,'').length-1);
  const final=code>=0xac00&&code<=0xd7a3?(code-0xac00)%28:0;
  return final!==0 && !(consonant==='으로' && final===8) ? consonant : vowel;
}
function km(a,b) {
  const rad = Math.PI / 180, lat1 = Number(a.mapy)*rad, lat2 = Number(b.mapy)*rad;
  const dlat = lat2-lat1, dlng = (Number(b.mapx)-Number(a.mapx))*rad;
  const x = Math.sin(dlat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dlng/2)**2;
  return 12742*Math.asin(Math.min(1, Math.sqrt(x)));
}
function coordinate(p) { const x=Number(p.mapx), y=Number(p.mapy); return x>=124 && x<=132 && y>=33 && y<=39; }
const kinds = {'12':'관광지','14':'문화시설','28':'레포츠 시설'};
export function candidate(course, places) {
  if (course?.source !== 'auto' || !['당일','1박2일'].includes(course.duration) || !course.seasons?.includes('winter') || !validName(clean(course.area)) || !Array.isArray(course.stops)) return null;
  const max=course.duration==='당일'?3:6, min=course.duration==='당일'?2:4;
  const raw=course.stops.slice(0,max), result=[];
  if(raw.length<min)return null;
  for (const s of raw) {
    const p=places.get(String(s.placeId));
    if(!p || reviewedHoldIds.has(String(p.id)) || !kinds[String(p.type)] || !validName(clean(p.title)) || nonVisitor.test(clean(p.title)) || riskyRoute.test(clean(p.title)) || (/스키/.test(clean(p.title)) && !/스키장|스키리조트/.test(clean(p.title))) || clean(s.name)!==clean(p.title) || clean(s.addr)!==clean(p.addr) || !clean(p.addr) || !coordinate(p) || !coordinate(s) || km(p,s)>0.1 || result.some(x=>x.placeId===String(p.id))) return null;
    result.push({placeId:String(p.id),name:clean(p.title),addr:clean(p.addr),mapx:String(p.mapx),mapy:String(p.mapy),image:p.image||'',kind:kinds[String(p.type)],day:1});
  }
  if(course.duration==='1박2일')for(let i=Math.ceil(result.length/2);i<result.length;i++)result[i].day=2;
  for(let i=1;i<result.length;i++) if(km(result[i-1],result[i])>35) return null;
  return {sourceCourseId:String(course.id),duration:course.duration,area:clean(course.area),stops:result};
}
export function dailyRemaining(rows, policy, now = new Date()) {
  const day=kstDay(now), result={};
  for (const duration of ['당일','1박2일']) {
    const n=rows.filter(row=>['draft','held','published'].includes(row.status) && row.duration===duration && (row.createdAt||row.publishedAt) && kstDay(new Date(row.createdAt||row.publishedAt))===day).length;
    result[duration]=Math.max(0,Math.min(duration==='당일'?3:2, Number(policy?.daily?.[duration])||0)-n);
  }
  return result;
}
export function chooseAllowed(raw, pools, remaining) {
  let parsed;
  try { parsed=JSON.parse(raw); } catch { throw Error('MODEL_OUTPUT_INVALID'); }
  if(!parsed || !Array.isArray(parsed.day) || !Array.isArray(parsed.overnight) || Object.keys(parsed).some(k=>!['day','overnight'].includes(k)))throw Error('MODEL_OUTPUT_INVALID');
  const all=[];
  for(const [key,duration] of [['day','당일'],['overnight','1박2일']]) {
    if(parsed[key].length!==remaining[duration])throw Error('MODEL_COUNT_INVALID');
    for(const id of parsed[key]) {
      const item=pools.find(c=>c.sourceCourseId===id && c.duration===duration);
      if(!item || all.some(c=>c.sourceCourseId===id))throw Error('MODEL_CANDIDATE_INVALID');
      const ids=new Set(item.stops.map(s=>s.placeId));
      if(all.some(prev=>prev.stops.filter(s=>ids.has(s.placeId)).length/Math.min(prev.stops.length,item.stops.length)>=0.67))throw Error('ROUTE_DUPLICATE');
      all.push(item);
    }
  }
  return all;
}
export function buildCourse(c, now = new Date(), summaries = new Map()) {
  const at=now.toISOString(), slug='winter-'+createHash('sha256').update(c.sourceCourseId).digest('hex').slice(0,14);
  const title=`${c.area} 겨울 여행코스 ${c.duration==='당일'?'당일치기':'1박 2일'} · ${c.stops[0].name}부터`;
  const sections=[];
  for(const day of [...new Set(c.stops.map(s=>s.day))]) {
    const stops=c.stops.filter(s=>s.day===day);
    const legs=stops.slice(1).map((s,i)=>`${stops[i].name} → ${s.name}: 직선거리 약 ${Math.round(km(stops[i],s)*10)/10}km`);
    sections.push({heading:c.duration==='당일'?'방문 순서':`${day}일 차 방문 순서`,paragraphs:[`${stops.map(s=>s.name).join(' → ')} 순서로 둘러보는 일정입니다.`,...legs,'직선거리는 실제 도로 이동거리나 이동시간이 아닙니다. 출발 전에 교통편과 경로를 확인하세요.']});
    for(let i=0;i<stops.length;i++) {
      const stop=stops[i];
      const reason=i===0?'이날의 첫 방문 후보로 잡고 이후 장소까지의 경로를 살펴보세요.':`앞선 ${stops[i-1].name}에서 이동할 다음 후보입니다. 실제 이동 경로와 교통편을 확인해 주세요.`;
      sections.push({heading:`${stop.name} · ${stop.kind}`,paragraphs:[`${stop.name}${particle(stop.name,'은','는')} 관광정보에 ${stop.kind}${particle(stop.kind,'으로','로')} 분류된 곳입니다. ${reason}`,`${stop.addr}에 있으며, 실제 운영일과 입장·예약 조건은 방문 전 공식 안내를 확인하세요.`]});
      if(summaries.has(stop.placeId)) {
        const value=summaries.get(stop.placeId);
        sections.at(-1).paragraphs.splice(1,0,`관광자료 발췌: “${value.quote}”`);
        sections.at(-1).sourceQuote=value.quote;
        if(value.provenance) sections.at(-1).sourceEvidence=value.provenance;
      }
    }
  }
  if(c.duration==='1박2일')sections.push({heading:'숙박 위치 고르기',paragraphs:['첫날 마지막 장소와 둘째 날 첫 장소 사이에서 이동 경로와 예산에 맞는 숙소를 비교해 보세요.']});
  sections.push({heading:'겨울 방문 전 확인',paragraphs:['운영일과 휴무, 예약, 요금 및 겨울철 안전 안내는 각 장소의 공식 안내를 확인하세요. 날씨와 도로 상황에 맞춰 방문 순서를 조정하세요.']});
  return {id:slug,slug,title,duration:c.duration,area:c.area,sourceCourseId:c.sourceCourseId,stops:c.stops,intro:`${c.area}에서 ${c.stops.map(s=>s.name).join(', ')}을 연결한 겨울 여행 후보입니다.`,sections,status:'draft',createdAt:at,validation:{version:1,checkedAt:at,sourceKind:'cached-tour-data',checks:['identity','coordinates','route'],needsEditorialReview:true},sources:[{title:'한국관광공사 관광정보',url:'https://api.visitkorea.or.kr/'}]};
}
