const norm=value=>String(value||'').normalize('NFKC').replace(/\s+/g,'').trim();
const clock=value=>{const date=value instanceof Date?value:typeof value==='string'?new Date(value.length===10?value+'T00:00:00+09:00':value):new Date();const iso=new Date(date.getTime()+9*3600000).toISOString();return {day:iso.slice(0,10),time:iso.slice(11,16),now:date.getTime()};};
const fresh=(value,at,hours)=>!!value&&Number.isFinite(Date.parse(value))&&at-Date.parse(value)<=hours*3600000;
const closed=/모집\s*마감|접수\s*마감|모집\s*완료|접수\s*종료|폐강|취소|\(마감\)|\[마감\]/;

/** One owner for list, related cards, sitemap, RSS and application buttons.
 * @param {Record<string,any>} item
 * @param {Date|string} [now]
 */
export function programmeAvailability(item,now=new Date()){
 const at=clock(now);
 if(item.sessions?.length){
  const states=item.sessions.map(session=>programmeAvailability(session,now));
  return ['open','inquiry','upcoming','unknown','stale','closed','ended','archived'].find(state=>states.includes(state))||'unknown';
 }
 if(item.active===false)return 'archived';
 if(item.end&&item.end<at.day||item.end===at.day&&/^\d{2}:\d{2}$/.test(item.endTime||'')&&item.endTime<at.time)return 'ended';
 if(item.publicRegistrationState==='closed'||closed.test([item.title,item.sourceStatus,item.registration].filter(Boolean).join(' ')))return 'closed';
 if(item.kind==='rural')return item.checkedAt&&!fresh(item.checkedAt,at.now,72)?'stale':'inquiry';
 if(item.checkedAt&&!fresh(item.checkedAt,at.now,48))return 'stale';
 if(item.kind==='family'){
  if(!fresh(item.listingCheckedAt,at.now,30))return 'unknown';
  if(!['open','dated'].includes(item.publicRegistrationState))return 'unknown';
 }
 if(item.registrationEnd&&item.registrationEnd<at.day||item.registrationEnd===at.day&&item.registrationEndTime&&item.registrationEndTime<at.time)return 'closed';
 if(item.registrationStart&&item.registrationStart>at.day)return 'upcoming';
 if(item.registrationStart===at.day&&item.registrationStartTime&&item.registrationStartTime>at.time)return 'upcoming';
 if(item.kind==='family'&&item.publicRegistrationState==='open')return 'open';
 if(item.registrationStart&&item.registrationEnd&&item.registrationStart<=at.day&&item.registrationEnd>=at.day&&(!item.end||item.end>=at.day))return 'open';
 return 'unknown';
}
/** @type {Record<string,string>} */
export const availabilityLabels={open:'접수기간 내',inquiry:'체험마을 · 예약 문의',upcoming:'접수예정',unknown:'모집 상태 확인 필요',stale:'최신 모집 안내 확인 필요',closed:'접수 마감',ended:'활동 종료',archived:'이전 등록자료'};
/** @param {Record<string,any>} item @param {Date|string} [now] @param {boolean} [upcoming] */
export function availableSessions(item,now=new Date(),upcoming=false){return (item.sessions?.length?item.sessions:[item]).filter(session=>programmeAvailability(session,now)===(upcoming?'upcoming':session.kind==='rural'?'inquiry':'open'));}
/** @param {Record<string,any>} item @param {Date|string} [now] @param {boolean} [upcoming] */
export function isAvailableProgramme(item,now=new Date(),upcoming=false){return availableSessions(item,now,upcoming).length>0;}

function groupKey(row,mode){
 const baseTitle=mode==='science'?row.title.split(/\s+\/\s+/)[0]:row.title;
 const institution=String(row.phone||'').replace(/\D/g,'')||norm(row.institution).replace(/전남광주통합특별시|전라남도/g,'전남');
 // Real venue, audience, fee and content distinguish different courses.
 // Time and weekday are options inside one course, not new article identities.
 return [norm(baseTitle),row.area,institution,norm(row.venue),norm(String(row.address||row.city||'').replace(/^\S+\s+/,'')),norm(row.audience),row.tuition??row.price??'',mode==='class'?norm(row.description)+'|'+norm(row.method):'',mode==='family'?row.start+'|'+row.end:''].join('|');
}

/** @template {Record<string,any>} T @param {T[]} records @param {string} mode */
export function groupProgrammeSessions(records,mode){
 const buckets=new Map();
 for(const row of records){const key=groupKey(row,mode);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(row);}
 return [...buckets.values()].map(rows=>{
  const aliases=rows.map(row=>row.id).sort(),latestReference=new Map();
  const activeWindows=new Set(rows.filter(row=>row.active!==false).map(row=>row.start+'|'+row.end));
  for(const row of rows){const window=row.start+'|'+row.end;if(activeWindows.has(window)&&row.active===false)continue;latestReference.set(window,[latestReference.get(window)||'',row.referenceDate||''].sort().at(-1));}
  // Keep only the newest version of a provider's same course. An old 14:30
  // registration must not become an extra session after a correction to 14:10.
  const latest=mode==='class'?rows.filter(row=>(!activeWindows.has(row.start+'|'+row.end)||row.active!==false)&&(!latestReference.get(row.start+'|'+row.end)||row.referenceDate===latestReference.get(row.start+'|'+row.end))):rows;
  const unique=new Map();for(const row of latest){const key=[row.start,row.end,row.startTime,row.endTime,row.weekdays,row.title].join('|');const previous=unique.get(key);if(!previous||row.active!==false)unique.set(key,row);}
  const sessions=[...unique.values()].sort((a,b)=>String(a.start).localeCompare(String(b.start))||String(a.startTime||a.period).localeCompare(String(b.startTime||b.period)));
  const eligible=sessions.filter(row=>['open','inquiry','upcoming'].includes(programmeAvailability(row))),shown=eligible.length?eligible:sessions;
  const rank=row=>({open:0,inquiry:1,upcoming:2})[programmeAvailability(row)]??3;
  const primary=[...shown].sort((a,b)=>rank(a)-rank(b)||Number(a.active===false)-Number(b.active===false)||String(b.checkedAt||b.referenceDate||'').localeCompare(String(a.checkedAt||a.referenceDate||'')))[0]||rows[0];
  return {...primary,id:aliases[0],title:mode==='science'&&rows.length>1?primary.title.split(/\s+\/\s+/)[0]:primary.title,aliases,sessions,active:sessions.some(row=>row.active!==false),start:shown.map(row=>row.start).filter(Boolean).sort()[0]||'',end:shown.map(row=>row.end).filter(Boolean).sort().at(-1)||'',sessionCount:sessions.length};
 });
}
