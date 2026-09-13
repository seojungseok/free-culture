import {categories} from './content.mjs';

// A plan is not a publication record. The publisher must persist its result
// before starting another slot, and must still run all publication checks.
export function koreaDate(now) {
  return new Date(new Date(now).getTime()+9*3600000).toISOString().slice(0,10);
}
export function planDaily(config,now) {
  if(config.timezone!=='Asia/Seoul'||config.dailyTotal!==5||config.publishHour!==5)
    throw Error('한국시간 05시 / 전체 합계 5개 운영 규칙 위반');
  const date=koreaDate(now);
  const day=Math.floor((Date.parse(date+'T00:00:00Z')-Date.parse(config.dailyStartDate+'T00:00:00Z'))/86400000);
  const due=`${date}T05:00:00+09:00`;
  if(!Number.isFinite(day))throw Error('시작 날짜 오류');
  if(day<0||new Date(now).getTime()<Date.parse(due))return [];
  // Calendar-based rotation is stable across retries/restarts; missed dates
  // are never caught up as an extra batch on the next day.
  return Array.from({length:5},(_,i)=>({
    id:`daily:${date}:${i+1}`,date,category:categories[(day*5+i)%categories.length],publishAt:due
  }));
}
export function planInitial(config) {
  if(config.initialPerCategory!==3||config.initialTopics.length!==18)throw Error('초기 18개 규칙 위반');
  if(new Set(config.initialTopics.map(t=>t.slug)).size!==18)throw Error('초기 주제 중복');
  for(const category of categories)if(config.initialTopics.filter(t=>t.category===category).length!==3)throw Error('분류별 초기 3개 필요');
  return config.initialTopics.map(t=>({...t,id:`${config.initialBatchId}:${t.slug}`}));
}
export function remainingSlots(slots,receipts) {
  // Failed and in-flight slots also count as attempts. No automatic paid
  // retries or replacement articles after an ambiguous request/restart.
  const attempted=new Set(receipts.map(r=>r.id));
  return slots.filter(s=>!attempted.has(s.id));
}
export async function runSlots(slots,receipts,{reserve,execute,complete}) {
  for(const slot of remainingSlots(slots,receipts)) {
    // Reservation must be durable/atomic. If that fails, stop rather than
    // risking duplicates. An individual content failure does not stop peers.
    await reserve(slot);
    let result;
    try{result={status:'complete',result:await execute(slot)};}
    catch{result={status:'held',reason:'글별 생성·검토 실패: 안전한 수동 확인 필요'};}
    await complete(slot,result);
  }
}
