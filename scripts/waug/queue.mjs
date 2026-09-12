import fs from 'node:fs';
import {publicationBudget} from '../lib/publication-budget.mjs';
import {kstDay,nextDay} from './core.mjs';
const root='data/waug/';const read=n=>JSON.parse(fs.readFileSync(root+n+'.json','utf8'));const write=(n,x)=>fs.writeFileSync(root+n+'.json',JSON.stringify(x,null,2)+'\n');
const db=read('catalog'),state=read('editorial'),places=read('places');
const previous=fs.existsSync(root+'queue.json')?read('queue'):{jobs:[]};
const command=process.argv[2]||'status',today=kstDay();
if(command==='plan'){
 const groups=new Map();for(const p of db.products)if(!p.duplicateOf&&p.eligibility!=='excluded'&&p.placeId){if(!groups.has(p.placeId))groups.set(p.placeId,[]);groups.get(p.placeId).push(p);}
 const jobs=[];
 for(const [placeId,products]of groups){const article=state.articles.find(a=>a.placeId===placeId),old=previous.jobs.find(j=>j.placeId===placeId),place=places.places.find(p=>p.id===placeId);if(article?.publishedAt)continue;
 const eligible=products.filter(p=>!p.queueHoldReason),held=products.filter(p=>p.queueHoldReason);
 jobs.push({...old,placeId,name:place?.name||products[0].actualName,area:article?.area||eligible[0]?.area||products[0].area||'확인 대기',theme:article?.theme||(/키즈|어린이|플레이|뽀로로|바운스/.test(place?.name||'')?'아이와':/스파|온천|사우나|찜질/.test(place?.name||'')?'휴식':/전시|뮤지엄|박물관|미술/.test(place?.name||'')?'전시':'체험'),productIds:products.map(p=>p.id),heldProductIds:held.map(p=>p.id),sourceBatches:[...new Set(products.map(p=>p.sourceBatch||'initial'))],createdAt:old?.createdAt||products.map(p=>p.createdAt).filter(Boolean).sort()[0]||new Date().toISOString(),articleSlug:article?.slug||null,status:article?(article.status==='held'?'held':article.status==='scheduled'?'scheduled':'queued'):!eligible.length?'held':old?.status||'queued',writingStatus:article?'complete':old?.writingStatus||'not_started',imageStatus:article?article.thumbnail.status:old?.imageStatus||'not_started',publicationDay:article?.scheduledAt?.slice(0,10)||old?.publicationDay||null,scheduledAt:article?.scheduledAt||old?.scheduledAt||null,holdReasons:held.map(p=>({id:p.id,reason:p.queueHoldReason})),attempts:old?.attempts||0,stages:old?.stages||{},notBefore:eligible.map(p=>p.validFrom).filter(Boolean).sort().at(-1)||null,validUntil:eligible.map(p=>p.validUntil).filter(Boolean).sort()[0]||null});
 }
 // Repack only untouched queued work after a capacity change; keep active drafts intact.
 for(const j of jobs)if(j.status==='queued'&&!j.articleSlug&&!j.writingDay){j.publicationDay=null;j.scheduledAt=null;}
 let day=today;const todo=jobs.filter(j=>j.status==='queued'&&!j.publicationDay);let guard=0;
 while(todo.length&&guard++<365){const fixed=jobs.filter(j=>j.publicationDay===day).length;const actual=day===today?publicationBudget().waugPublished:state.history.filter(h=>h.day===day).length;let slots=Math.max(0,30-fixed-actual);const areas={},themes={};for(const j of jobs.filter(j=>j.publicationDay===day)){areas[j.area]=(areas[j.area]||0)+1;themes[j.theme]=(themes[j.theme]||0)+1;}
 while(slots>0){const available=todo.filter(j=>!j.notBefore||j.notBefore<=day);if(!available.length)break;
 const score=j=>(j.sourceBatches.includes('initial')?25:0)-(areas[j.area]||0)*30-(themes[j.theme]||0)*10+(j.validUntil?Math.max(0,20-(Date.parse(j.validUntil)-Date.parse(day))/86400000):0);
 available.sort((a,b)=>score(b)-score(a)||a.createdAt.localeCompare(b.createdAt)||a.placeId.localeCompare(b.placeId));const j=available[0];todo.splice(todo.indexOf(j),1);if(j.validUntil&&j.validUntil<day){j.status='held';j.holdReasons.push({reason:'배정 가능일 이전 이용기간 종료'});continue;}
 j.publicationDay=day;j.scheduledAt=`${day}T06:00:00+09:00`;j.writingAt=`${day}T05:00:00+09:00`;areas[j.area]=(areas[j.area]||0)+1;themes[j.theme]=(themes[j.theme]||0)+1;slots--;}
 day=nextDay(day);}
 const queue={version:1,timezone:'Asia/Seoul',dailyPublicationLimit:30,dailyNewWritingLimit:30,updatedAt:new Date().toISOString(),jobs};write('queue',queue);
 for(const j of jobs)for(const id of j.productIds){const p=db.products.find(p=>p.id===id);if(!p.articleSlug){p.plannedPublicationDay=j.heldProductIds.includes(id)?null:j.publicationDay;p.plannedWritingAt=j.heldProductIds.includes(id)?null:j.writingAt||null;}}write('catalog',db);
 console.log(JSON.stringify({jobs:jobs.length,queued:jobs.filter(j=>j.status==='queued').length,held:jobs.filter(j=>j.status==='held').length,scheduled:jobs.filter(j=>j.status==='scheduled').length,days:Object.fromEntries([...new Set(jobs.map(j=>j.publicationDay).filter(Boolean))].sort().map(d=>[d,{total:jobs.filter(j=>j.publicationDay===d).length,areas:jobs.filter(j=>j.publicationDay===d).reduce((m,j)=>(m[j.area]=(m[j.area]||0)+1,m),{})}]))},null,2));
}else if(command==='due'){
 console.log(JSON.stringify(previous.jobs.filter(j=>j.publicationDay&&j.publicationDay<=today&&!['published','excluded','held'].includes(j.status)&&j.attempts<3),null,2));
}else if(command==='claim'){
 if(process.env.WAUG_SERVER_EXECUTION!=='1')throw Error('예약 서버 실행에서만 작성 시작 가능');
 const started=previous.jobs.filter(j=>j.writingDay===today).length;const j=previous.jobs.find(j=>j.placeId===process.argv[3]);if(!j||!j.publicationDay||j.publicationDay>today||j.attempts>=3||['held','excluded','published'].includes(j.status))throw Error('실행 가능한 예약이 아님');
 const hasDraft=state.articles.some(a=>a.placeId===j.placeId);
 if(!hasDraft&&j.writingDay!==today){if(started>=30)throw Error('일일 신규 작성 상한');j.writingDay=today;}
 j.attempts++;j.startedDay||=today;j.status='working';j.lastAttemptAt=new Date().toISOString();write('queue',previous);console.log(JSON.stringify(j));
}else if(command==='status'){console.log(JSON.stringify({budget:publicationBudget(),jobs:previous.jobs.length,statuses:previous.jobs.reduce((m,j)=>(m[j.status]=(m[j.status]||0)+1,m),{})},null,2));}
else throw Error('plan | due | claim placeId | status');
