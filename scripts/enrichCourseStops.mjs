import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSourceEnv } from './lib/sourceEnv.mjs';
import { readCache, writeCache, fetchJson, arr, createBudget, cleanText, sleep, QuotaError, safeApiError, hasKey } from './lib/tourClient.mjs';
const fullCourseStops=async(id,type,budget)=>arr((await fetchJson('detailInfo2',{contentId:id,contentTypeId:type,numOfRows:100,pageNo:1},budget))?.response?.body?.items?.item);
export const stopName = value => cleanText(value).replace(/\s+/g,'');
export function mergeCourseStopIds(course, rows, checkedAt) {
  const updates=[];
  course.stops = course.stops.map(stop=>{
    const named=rows.filter(row=>String(row.contentid)===String(course.id) && stopName(row.subname)===stopName(stop.name));
    const matches=named.length===1?named:named.filter(row=>Number(row.subnum)===stop.num);
    if(matches.length!==1 || !/^[1-9]\d*$/.test(String(matches[0].subcontentid||''))) return stop;
    const row=matches[0], placeId=String(row.subcontentid);
    if(stop.placeId && stop.placeId!==placeId) { updates.push({num:stop.num,name:stop.name,status:'conflict',existing:stop.placeId,official:placeId}); return stop; }
    updates.push({num:stop.num,name:stop.name,status:'verified',placeId});
    return {...stop,placeId,sourceOverview:cleanText(row.subdetailoverview),placeIdSource:{provider:'한국관광공사',courseId:course.id,subnum:Number(row.subnum),subname:cleanText(row.subname),subcontentid:placeId,endpoint:'detailInfo2',checkedAt}};
  });
  return updates;
}
export async function enrichCourseStops({courses,state,max=20,fetchStops=fullCourseStops,now=()=>new Date(),pause=sleep}) {
  state.courses ||= {};
  const targets=courses.filter(c=>c.source==='official'&&(!state.courses[c.id]?.checkedAt || now().getTime()-Date.parse(state.courses[c.id].checkedAt)>30*86400000 || (process.env.COURSE_RECHECK_UNMATCHED==='1'&&c.stops.some(s=>!s.placeIdSource)))).sort((a,b)=>String(state.courses[a.id]?.checkedAt||'').localeCompare(String(state.courses[b.id]?.checkedAt||'')));
  const budget=createBudget(max); let checked=0,linked=0,conflicts=0,failures=0,deferred=0;
  for(const course of targets) {
    if(budget.used>=max) break;
    try {
      const rows=await fetchStops(course.id,'25',budget);
      const checkedAt=now().toISOString();
      const updates=mergeCourseStopIds(course,rows,checkedAt);
      state.courses[course.id]={checkedAt,returned:rows.length,rows:rows.map(r=>({contentid:String(r.contentid||''),subnum:Number(r.subnum),subcontentid:String(r.subcontentid||''),subname:cleanText(r.subname),subdetailoverview:cleanText(r.subdetailoverview)})),updates};
      linked+=updates.filter(u=>u.status==='verified').length; conflicts+=updates.filter(u=>u.status==='conflict').length; checked++;
    } catch(error) { console.error(`코스 ${course.id}: ${safeApiError(error)}`); if(error instanceof QuotaError && error.reason==='provider') deferred++;else failures++; if(error instanceof QuotaError) break; }
    await pause(300);
  }
  return {targets:targets.length,checked,linked,conflicts,failures,deferred,requests:budget.used,exitCode:failures?1:deferred?75:0};
}
async function main() {
  loadSourceEnv();
  if(!hasKey()) throw new Error('공공 API 인증키 없음');
  const max=Math.min(60,Math.max(1,Number(process.env.COURSE_STOP_DAILY||20)));
  const data=readCache('courses.json',{courses:[]}),state=readCache('course-stop-checks.json',{courses:{}});
  const result=await enrichCourseStops({courses:data.courses,state,max});
  if(result.checked) { writeCache('courses.json',data);writeCache('course-stop-checks.json',state); }
  console.log(JSON.stringify(result));process.exitCode=result.exitCode;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) main().catch(error=>{console.error(safeApiError(error));process.exitCode=1;});
