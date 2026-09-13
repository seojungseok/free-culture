import {planDaily,koreaDate} from './schedule.mjs';
import {publicationErrors,checkLinks} from './content.mjs';

// Pure batch operation: store and receipts are committed together by daily.yml.
// CI concurrency serializes writers; a fresh checkout/re-run sees the receipts.
export async function publishDaily(store,config,now=new Date(),{validate=publicationErrors,links=checkLinks}={}){
 const next=structuredClone(store),date=koreaDate(now),slots=planDaily(config,now);
 const report={date,target:5,published:[],held:[],missing:[],alreadyProcessed:[]};
 if(!config.publisherEnabled)return {store:next,report:{...report,disabled:true},changed:false};
 next.dailyReceipts??=[];
 if(!Array.isArray(next.dailyReceipts)||next.dailyReceipts.some(r=>!r||!/^daily:\d{4}-\d{2}-\d{2}:[1-5]$/.test(r.id)||!['published','held'].includes(r.status))||new Set(next.dailyReceipts.map(r=>r.id)).size!==next.dailyReceipts.length)throw Error('일일 발행 기록 오류: 중복 방지를 위해 발행 보류');
 const before=JSON.stringify(next);
 for(const slot of slots){
  if(next.dailyReceipts.some(r=>r.id===slot.id)||next.articles.some(a=>a.dailySlotId===slot.id&&a.status==='published')){report.alreadyProcessed.push(slot.id);continue;}
  const candidates=next.articles.filter(a=>a.dailySlotId===slot.id&&a.status==='scheduled');
  // Empty slots aren't a paid attempt. They may be prepared later the same day.
  if(!candidates.length){report.missing.push(slot.id);continue;}
  try{
   if(candidates.length!==1)throw Error('예약 슬롯 중복');
   const a=candidates[0];
   if(a.category!==slot.category||a.contentStyle!=='shoppable-scene-v2'||Date.parse(a.publishAt)!==Date.parse(slot.publishAt))throw Error('분류·예약일·새 콘텐츠 형식 불일치');
   const errors=validate(a,next);if(errors.length)throw Error(errors.join(' / '));
   if(a.productIds.some(id=>next.articles.some(other=>other.slug!==a.slug&&['published','scheduled'].includes(other.status)&&other.productIds.includes(id))))throw Error('다른 글과 상품 중복');
   if((await links(a,next)).length)throw Error('제휴링크 확인 실패');
   a.status='published';a.updatedAt=new Date(now).toISOString();
   next.dailyReceipts.push({id:slot.id,date,status:'published',slug:a.slug,at:a.updatedAt});
   report.published.push(a.slug);
  }catch{
   // No untrusted response bodies, URLs, or credentials in the operation log.
   next.dailyReceipts.push({id:slot.id,date,status:'held',slug:candidates[0]?.slug,at:new Date(now).toISOString()});
   report.held.push(slot.id);
  }
 }
 return {store:next,report,changed:before!==JSON.stringify(next)};
}
