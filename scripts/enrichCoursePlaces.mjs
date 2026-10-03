import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {loadSourceEnv} from './lib/sourceEnv.mjs';
import {readCache,writeCache,fetchJson,detailIntroRaw,detailInfoRaw,normalizeIntro,normalizeInfo,createBudget,arr,cleanText,extractUrl,sleep,QuotaError,safeApiError} from './lib/tourClient.mjs';
export async function enrichCoursePlaces({courses,existingIds,store,max=100,common=async(id,budget)=>arr((await fetchJson('detailCommon2',{contentId:id},budget))?.response?.body?.items?.item)[0],intro=detailIntroRaw,info=detailInfoRaw,pause=sleep,now=()=>new Date()}) {
  store.places ||= {};
  store.emptyCommonChecks ||= {};
  const ids=[...new Set(courses.flatMap(c=>c.stops||[]).filter(s=>s.placeIdSource&&s.placeIdSource.subcontentid===s.placeId&&!existingIds.has(s.placeId)).map(s=>s.placeId))];
  const stale=at=>{const timestamp=Date.parse(at),age=now().getTime()-timestamp;return !Number.isFinite(timestamp)||age<0||age>=30*86400000;};
  const targets=ids.filter(id=>{const r=store.places[id]||{};if(store.emptyCommonChecks[id]&&!stale(store.emptyCommonChecks[id]))return false;return stale(r.commonCheckedAt)||stale(r.introAttemptCheckedAt||r.introCheckedAt)||stale(r.infoCheckedAt);}).sort((a,b)=>String(store.emptyCommonChecks[a]||store.places[a]?.commonCheckedAt||'').localeCompare(String(store.emptyCommonChecks[b]||store.places[b]?.commonCheckedAt||'')));
  const budget=createBudget(max);let commonSaved=0,commonEmpty=0,factsSaved=0,infoSaved=0,attemptsSaved=0,failures=0,deferred=0;
  for(const id of targets) {
    if(budget.used>=max)break;
    try {
      let record=store.places[id];
      if(stale(record?.commonCheckedAt)) {
        const raw=await common(id,budget);
        // A successful empty API result is not an identity or transport error.
        // Retain established facts and their timestamps; retry this ID after 30 days.
        if(raw==null) {
          store.emptyCommonChecks[id]=now().toISOString();
          commonEmpty++;attemptsSaved++;
          await pause(300);
          continue;
        }
        if(String(raw.contentid)!==id||!cleanText(raw.title))throw new Error('Invalid place identity');
        record={...record,id,title:cleanText(raw.title),type:String(raw.contenttypeid||record?.type||''),addr:cleanText(raw.addr1)||record?.addr||'',mapx:String(raw.mapx||record?.mapx||''),mapy:String(raw.mapy||record?.mapy||''),tel:cleanText(raw.tel)||record?.tel||'',homepage:extractUrl(raw.homepage)||record?.homepage||'',overview:cleanText(raw.overview)||record?.overview||'',commonCheckedAt:now().toISOString()};
        delete store.emptyCommonChecks[id];
        store.places[id]=record;commonSaved++;
      }
      if(budget.used>=max)break;
      if(stale(record.introAttemptCheckedAt||record.introCheckedAt)) {
        const rawIntro=await intro(id,record.type,budget);
        if(rawIntro&&String(rawIntro.contentid)!==id)throw new Error('Invalid intro identity');
        record.introAttemptCheckedAt=now().toISOString();attemptsSaved++;
        if(rawIntro&&String(rawIntro.contentid)===id){record.intro=normalizeIntro(record.type,rawIntro);record.introCheckedAt=now().toISOString();factsSaved++;}
      }
      if(budget.used>=max)break;
      if(stale(record.infoCheckedAt)){record.info=normalizeInfo(await info(id,record.type,budget));record.infoCheckedAt=now().toISOString();infoSaved++;}
    }catch(error){console.error(`코스 장소 ${id}: ${safeApiError(error)}`);if(error instanceof QuotaError&&error.reason==='provider')deferred++;else failures++;if(error instanceof QuotaError)break;}
    await pause(300);
  }
  return {targets:targets.length,commonSaved,commonEmpty,factsSaved,infoSaved,attemptsSaved,failures,deferred,requests:budget.used,exitCode:failures?1:deferred?75:0};
}
async function main(){
  loadSourceEnv();const data=readCache('courses.json',{courses:[]}),store=readCache('course-place-details.json',{places:{}});
  const existingIds=new Set([...readCache('places.json',{spots:[]}).spots,...readCache('restaurants.json',{restaurants:[]}).restaurants].map(p=>p.id));
  const max=Math.min(300,Math.max(1,Number(process.env.COURSE_PLACE_DAILY||100)));
  const result=await enrichCoursePlaces({courses:data.courses,existingIds,store,max});
  if(result.commonSaved||result.factsSaved||result.infoSaved||result.attemptsSaved)writeCache('course-place-details.json',store);
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`- 코스 장소: 기본정보 ${result.commonSaved}건, 정상 빈 결과 ${result.commonEmpty}건 (기존 정보 보존·30일 후 재확인), 실패 ${result.failures}건, 한도 연기 ${result.deferred}건\n`);
  console.log(JSON.stringify(result));process.exitCode=result.exitCode;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(safeApiError(error));process.exitCode=1;});
