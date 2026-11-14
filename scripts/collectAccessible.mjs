import {readCache,writeCache,createBudget,fetchJson,arr,sleep,safeApiError,QuotaError} from './lib/tourClient.mjs';
import {loadSourceEnv} from './lib/sourceEnv.mjs';
import {normalizeAccessible} from '../lib/accessible.mjs';
loadSourceEnv();
const base='https://apis.data.go.kr/B551011/KorWithService2';
const max=Math.max(0,Math.min(60,Number(process.env.ACCESSIBLE_DAILY||60)));
if(!max){console.log('월요일 통합 예산 예약 — 무장애 정보는 다음 수집일에 확인');process.exit(0);}
const budget=createBudget(max),previous=readCache('accessible-travel.json',{places:{}}),now=new Date().toISOString();
try{
 const lists=[];
 for(const contentTypeId of [12,14]){
  const first=await fetchJson('areaBasedList2',{contentTypeId,numOfRows:1000,pageNo:1,arrange:'A'},budget,base);
  const total=Number(first.response.body.totalCount);let received=0;
  if(!Number.isInteger(total)||total<0||total>20000)throw new Error('API JSON 응답 형식 오류');
  for(let pageNo=1;pageNo<=Math.max(1,Math.ceil(total/1000));pageNo++){
   const page=pageNo===1?first:await fetchJson('areaBasedList2',{contentTypeId,numOfRows:1000,pageNo,arrange:'A'},budget,base);
   const items=arr(page.response.body.items?.item);received+=items.length;lists.push(...items);
   await sleep(250);
  }
  if(received!==total)throw new Error('API JSON 응답 형식 오류');
 }
 const listed=new Map(lists.map(row=>[String(row.contentid),row]));
 const places=Object.fromEntries(Object.entries(previous.places||{}).filter(([id])=>listed.has(id)));
 const grouped=new Map();
 const {addressArea}=await import('../lib/learning.mjs');
 for(const row of lists){const area=addressArea(row.addr1);if(area==='지역 확인')continue;if(!grouped.has(area))grouped.set(area,[]);grouped.get(area).push(row);}
 for(const rows of grouped.values())rows.sort((a,b)=>(Date.parse(places[a.contentid]?.checkedAt)||0)-(Date.parse(places[b.contentid]?.checkedAt)||0)||Number(b.contenttypeid)-Number(a.contenttypeid)||String(b.modifiedtime).localeCompare(String(a.modifiedtime)));
 const queue=[];while([...grouped.values()].some(rows=>rows.length)){for(const rows of grouped.values())if(rows.length)queue.push(rows.shift());}
 let checked=0,failures=0;
 for(const row of queue){
  if(budget.used>=max)break;
  const old=places[row.contentid];
  if(old&&Date.parse(now)-Date.parse(old.checkedAt)<7*86400000&&old.modifiedAt===String(row.modifiedtime))continue;
  try{
   const response=await fetchJson('detailWithTour2',{contentId:row.contentid,numOfRows:1,pageNo:1},budget,base);
   const detail=arr(response.response.body.items?.item)[0];
   if(!detail)throw new Error('API JSON 응답 형식 오류');
   const place=normalizeAccessible(row,detail,now);
   if(place)places[place.id]=place;else delete places[row.contentid];
   checked++;
  }catch(error){if(error instanceof QuotaError)throw error;failures++;console.warn('무장애 상세: '+safeApiError(error));if(failures>=3)break;}
  await sleep(250);
 }
 if(!Object.keys(places).length)throw new Error('API JSON 응답 형식 오류');
 const archivedPlaces={...(previous.archivedPlaces||{})};for(const [id,place]of Object.entries(previous.places||{}))if(!places[id])archivedPlaces[id]=place;for(const id of Object.keys(places))delete archivedPlaces[id];
 writeCache('accessible-travel.json',{generatedAt:now,sourceUrl:'https://www.data.go.kr/data/15101897/openapi.do',refresh:{checkedAt:now,complete:failures===0,calls:budget.used,listed:lists.length,checked},coverage:'전국 관광지·문화시설 목록을 확인하고 상세 편의정보를 순차 보강합니다. 현재 수록된 장소만 보여줍니다.',places,archivedPlaces});
 console.log(JSON.stringify({places:Object.keys(places).length,checked,failures,calls:budget.used,listed:lists.length}));
 if(failures)process.exitCode=1;
}catch(error){console.error('무장애 수집: '+safeApiError(error)+' — 기존 자료 보존');process.exitCode=error instanceof QuotaError&&error.reason==='provider'?75:1;}
