import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';import {load} from 'cheerio';
export function operationFingerprint(html,mode='page'){
 const $=load(html);$('script,style,header,footer,nav,form,#evaluation,.satisfaction_box').remove();
 const text=mode==='chuncheon-notices'?$('a[data-id] .tit').text():mode==='kimhae-notices'?$('a.a1').map((_,el)=>$(el).find('.h1,.tit,.t1').first().text()||$(el).text().split('조회수')[0]).get().join(' '):mode==='jeonbuk-notices'?$('a[href*=dataUid]').text():mode==='daejeon-notices'?$('tbody a[href*=fn_call]').text():$('body').text();
 const normalized=text.replace(/조회(?:수)?\s*:?\s*[\d,]+/g,'').replace(/\s+/g,' ').trim();if(normalized.length<30)throw Error('공식 운영안내 본문 미확인');
 return createHash('sha256').update(normalized).digest('hex');
}
export async function checkPlaygroundOperations(input,{fetchImpl=fetch,now=new Date(),initialize=false}={}){
 const result=structuredClone(input),at=now.toISOString();
 for(const review of Object.values(result.reviews)){
  let matched=true;
  for(const source of review.sources){try{const response=await fetchImpl(source.url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('공식 안내 HTTP 오류');const hash=operationFingerprint(await response.text(),source.mode);if(initialize){source.reviewedHash=hash;}else if(hash!==source.reviewedHash)matched=false;source.lastCheckedAt=at;}catch{matched=false;}}
  if(initialize&&matched){review.status='verified';review.reviewedAt=at;review.checkedAt=at;}
  else if(matched&&review.status==='verified'){review.checkedAt=at;}
  else{review.status='review-required';}
 }
 result.checkedAt=at;const complete=Object.values(result.reviews).every(r=>r.status==='verified');result.refresh={checkedAt:complete?at:input.refresh?.checkedAt||input.checkedAt,complete};return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const file='data/playground-operations.json';try{const result=await checkPlaygroundOperations(JSON.parse(fs.readFileSync(file,'utf8')),{initialize:process.argv.includes('--initialize-reviewed')});fs.writeFileSync(file+'.tmp',JSON.stringify(result,null,2));fs.renameSync(file+'.tmp',file);const reviews=Object.values(result.reviews);console.log(JSON.stringify({source:'playground-operations',checkedAt:result.checkedAt,verified:reviews.filter(r=>r.status==='verified').length,reviewRequired:reviews.filter(r=>r.status!=='verified').length}));if(reviews.some(r=>r.status!=='verified'))process.exitCode=1;}catch{console.error('공식 운영안내 확인 실패 — 기존 확인시각 보존');process.exitCode=1;}
}
