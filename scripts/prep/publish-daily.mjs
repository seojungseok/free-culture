import fs from 'node:fs';
import {readStore,saveStore} from './store.mjs';
import {publishDaily} from './daily-publisher.mjs';
const config=JSON.parse(fs.readFileSync('data/weekend-prep-schedule.json','utf8'));
const current=readStore();
const result=await publishDaily(current,config);
if(process.env.PREP_CHECK_ONLY!=='true'){
 if(result.changed)saveStore(result.store,current.version);
 fs.writeFileSync('data/weekend-prep-daily-report.json',JSON.stringify(result.report,null,2)+'\n');
}
console.log(JSON.stringify(result.report));
if(result.report.held.length||result.report.missing.length)console.warn('::warning::주말 준비물 일부 슬롯 보류/준비물량 부족. 준비된 다른 글과 기존 자동글은 계속 발행합니다.');
