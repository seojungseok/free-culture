import fs from 'node:fs';
import {fetchJson,createBudget,arr,sleep,safeApiError,tourArea} from './lib/tourClient.mjs';
// Credentials remain in the existing local environment and never enter reports.
const envFile=process.env.WINTER_ENV_FILE;
if(envFile) for(const line of fs.readFileSync(envFile,'utf8').split(/\r?\n/)){
 const m=line.match(/^(TOUR_API_KEY|DATA_GO_KR_KEY)=(.*)$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].trim().replace(/^['"]|['"]$/g,'');
}
const file='data/winter-api-place-search.json';
const data=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{checkedAt:null,queries:[]};
const plans=JSON.parse(fs.readFileSync('data/winter-place-candidates.json'));
const budget=createBudget(90);
const replacements={'서울시립미술관':'서울시립미술관','해운대시장':'해운대전통시장','유성온천':'유성온천','조세박물관':'국립조세박물관','수원화성':'수원 화성','공방거리':'공방거리','오두산':'오두산통일전망대','오죽헌':'오죽헌','의림지':'제천 의림지','통영중앙':'통영중앙전통시장','통제영':'통영 삼도수군통제영'};
for(const plan of plans)for(const stop of plan.stops){
 const query=replacements[stop.query]||stop.query;
 if(data.queries.some(x=>x.city===plan.city&&x.query===query&&x.status==='ok'))continue;
 try{
  const j=await fetchJson('searchKeyword2',{keyword:query,numOfRows:30,pageNo:1,arrange:'A'},budget);
  const items=arr(j.response.body.items?.item);
  const results=items.map(p=>({id:String(p.contentid),title:p.title,addr:p.addr1,area:tourArea(p),mapx:p.mapx,mapy:p.mapy,image:String(p.firstimage||'').replace(/^http:/,'https:'),type:p.contenttypeid,sourceModifiedAt:p.modifiedtime,copyrightType:p.cpyrhtDivCd}));
  data.queries.push({city:plan.city,area:plan.area,query,checkedAt:new Date().toISOString(),status:'ok',total:j.response.body.totalCount,results});
  console.log(JSON.stringify({city:plan.city,query,results:results.map(p=>({id:p.id,title:p.title,area:p.area,photo:!!p.image}))}));
 }catch(e){console.log(JSON.stringify({city:plan.city,query,error:safeApiError(e)}));if(budget.stopped)break;}
 data.checkedAt=new Date().toISOString();data.requests=budget.used;fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
 await sleep(350);
}
