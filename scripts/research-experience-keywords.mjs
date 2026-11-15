// Manual, read-only keyword research. Never imported by visitor rendering or daily collection.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

export function parseResearchCredentials(text) {
 const lines=String(text).split(/\r?\n/).filter(line=>line.trim());
 const tokenFor=pattern=>{const candidates=lines.filter(line=>pattern.test(line));if(candidates.length!==1)throw new Error('Credential labels are ambiguous');const tokens=candidates[0].match(/[A-Za-z0-9+\/_=-]{16,}/g)||[];if(tokens.length!==1)throw new Error('Credential value is ambiguous');return tokens[0];};
 const customerLine=lines.filter(line=>/customer/i.test(line));
 const customer=customerLine.length===1?customerLine[0].match(/\d{5,12}/)?.[0]:'';
 if(!customer)throw new Error('Customer identifier missing');
 return {api:tokenFor(/api|access|라이선스|license|액세스/i),secret:tokenFor(/secret|시크릿|비밀/i),customer};
}
export function searchBounds(value) {
 if(typeof value==='number'&&Number.isFinite(value))return {min:value,max:value};
 if(/^<\s*10$/.test(String(value)))return {min:0,max:9};
 return {min:null,max:null};
}
export function publicKeyword(row) {
 const pc=searchBounds(row.monthlyPcQcCnt),mobile=searchBounds(row.monthlyMobileQcCnt);
 return {keyword:row.relKeyword,pc:row.monthlyPcQcCnt,mobile:row.monthlyMobileQcCnt,total:pc.min!==null&&mobile.min!==null&&pc.min===pc.max&&mobile.min===mobile.max?pc.min+mobile.min:null,totalMin:pc.min===null||mobile.min===null?null:pc.min+mobile.min,totalMax:pc.max===null||mobile.max===null?null:pc.max+mobile.max,adCompetition:row.compIdx,adDepth:row.plAvgDepth};
}

async function main() {
 const credentialsFile=process.env.SEARCHAD_CREDENTIAL_FILE;
 if(!credentialsFile)throw new Error('SEARCHAD_CREDENTIAL_FILE is required');
 const credentials=parseResearchCredentials(fs.readFileSync(credentialsFile,'utf8'));
 const read=name=>JSON.parse(fs.readFileSync('data/'+name+'.json','utf8'));
 const areas={서울:'서울',부산:'부산',대구:'대구',인천:'인천',광주:'광주',대전:'대전',울산:'울산',세종:'세종',경기:'경기도',강원:'강원도',충북:'충북',충남:'충남',전북:'전북',전남:'전남',경북:'경북',경남:'경남',제주:'제주'};
 const general=['겨울방학체험','겨울방학프로그램','겨울방학캠프','초등겨울방학','방학체험','어린이체험','초등학생체험','초등체험학습','청소년체험','청소년진로체험','가족체험','무료체험','실내체험','체험학습','체험학습장소','원데이클래스','키즈클래스','문화강좌','문화센터강좌','평생학습강좌','무료강좌','주말체험','과학체험','과학관체험','과학교실','천문체험','농촌체험','농촌체험마을','어촌체험','갯벌체험','딸기따기체험','딸기체험','김장체험','두부만들기체험','도자기체험','목공체험','공예체험','요리체험','쿠킹클래스','영어회화강좌','미술강좌','사진강좌','악기강좌','캘리그라피강좌','스마트폰교육','학습멘토링','코딩체험','생태체험','농장체험'];
 const regional=Object.values(areas).flatMap(area=>[area+'체험',area+'어린이체험',area+'겨울방학체험']);
 const villages=read('rural-experiences').records;
 const cities=[...new Set(villages.map(row=>row.city).filter(Boolean))];
 const local=cities.map(city=>city.replace(/(?:시|군)$/,'')+'농촌체험');
 const seeds=[...new Set([...general,...regional,...local])].filter(word=>word.length<=30);
 const directory='.cache/keyword-research';fs.mkdirSync(directory,{recursive:true});
 const checkpointFile=path.join(directory,'keyword-snapshot.json');
 const snapshot=fs.existsSync(checkpointFile)?JSON.parse(fs.readFileSync(checkpointFile,'utf8')):{source:'Naver Search Ads GET /keywordstool',sourceUrl:'https://naver.github.io/searchad-apidoc/',checkedAt:new Date().toISOString(),period:'provider monthly search counts, PC and mobile; not Google volume',competitionDefinition:'adCompetition is advertising competition, not organic SEO difficulty',requested:seeds,requests:[],keywords:[]};
 const byKeyword=new Map(snapshot.keywords.map(row=>[row.keyword,row]));
 const already=new Set(snapshot.requests.flatMap(row=>row.seeds));
 const firstFile=path.join(directory,'first.json');
 if(fs.existsSync(firstFile)){const first=JSON.parse(fs.readFileSync(firstFile,'utf8'));for(const row of first.rows){const item=publicKeyword({relKeyword:row.keyword,monthlyPcQcCnt:row.pc,monthlyMobileQcCnt:row.mobile,compIdx:row.adCompetition,plAvgDepth:row.adDepth});byKeyword.set(item.keyword,item);}for(const seed of first.seeds)already.add(seed);}
 const pending=seeds.filter(seed=>!already.has(seed)&&!byKeyword.has(seed));
 for(let offset=0;offset<pending.length;offset+=5) {
  const batch=pending.slice(offset,offset+5),uri='/keywordstool',timestamp=String(Date.now());
  const url=new URL(uri,'https://api.searchad.naver.com');url.search=new URLSearchParams({hintKeywords:batch.join(','),showDetail:'1'}).toString();
  const signature=crypto.createHmac('sha256',credentials.secret).update(timestamp+'.GET.'+uri).digest('base64');
  const response=await fetch(url,{headers:{'X-Timestamp':timestamp,'X-API-KEY':credentials.api,'X-Customer':credentials.customer,'X-Signature':signature},signal:AbortSignal.timeout(25000)});
  if(!response.ok)throw new Error('Keyword provider returned HTTP '+response.status);
  const data=await response.json();
  if(!Array.isArray(data.keywordList))throw new Error('Keyword provider returned an unexpected response');
  for(const row of data.keywordList){const item=publicKeyword(row);byKeyword.set(item.keyword,item);}
  snapshot.requests.push({seeds:batch,checkedAt:new Date().toISOString(),returned:data.keywordList.length});snapshot.keywords=[...byKeyword.values()];snapshot.checkedAt=new Date().toISOString();
  fs.writeFileSync(checkpointFile,JSON.stringify(snapshot,null,2));
  console.log(JSON.stringify({completed:Math.min(offset+5,pending.length),requested:pending.length,availableKeywords:byKeyword.size}));
  if(offset+5<pending.length)await new Promise(resolve=>setTimeout(resolve,2100));
 }
 snapshot.keywords=[...byKeyword.values()];snapshot.requested=seeds;
 snapshot.exact=seeds.map(keyword=>byKeyword.get(keyword)||{keyword,unavailable:true});
 fs.writeFileSync(checkpointFile,JSON.stringify(snapshot,null,2));
 fs.writeFileSync('data/experience-keyword-research-20261115.json',JSON.stringify({...snapshot,keywords:undefined},null,2)+'\n');
 console.log(JSON.stringify({requested:seeds.length,exact:snapshot.exact.filter(row=>!row.unavailable).length,unavailable:snapshot.exact.filter(row=>row.unavailable).length}));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
