import fs from 'node:fs';
import {fetchSourcePage} from './lib/cultureSource.mjs';
import {parseCentralScience,parseIncheonScience} from './lib/sciencePrograms.mjs';
const file='data/science-experiences.json';
const previous=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{sources:{}};
const sources={...previous.sources},now=new Date().toISOString(),today=new Date(Date.now()+9*3600000).toISOString().slice(0,10);let failures=0,successes=0;
for(const [id,url,parse]of [['central','https://www.science.go.kr/mps/1092/allEduPrograms.do',parseCentralScience],['incheon','https://aicei.ice.go.kr/science/cm/cntnts/cntntsView.do?cntntsId=1047&mi=1112',parseIncheonScience]]){
 try{const response=await fetchSourcePage(url),records=parse(response.html,{url,now});sources[id]={checkedAt:now,success:true,url,records};successes++;}
 catch{failures++;sources[id]={...sources[id],success:false};console.error(id+': 공식 과학관 일정 확인 실패 — 기존 자료 보존');}
}
if(successes){const records=Object.values(sources).flatMap(source=>source.records||[]).filter(record=>record.end>=today);const snapshot={generatedAt:now,refresh:{checkedAt:now,complete:!failures,calls:2},sources,records};fs.writeFileSync(file+'.tmp',JSON.stringify(snapshot));fs.renameSync(file+'.tmp',file);console.log(JSON.stringify({sciencePrograms:records.length,successes,failures}));}
if(failures||!successes)process.exitCode=1;
