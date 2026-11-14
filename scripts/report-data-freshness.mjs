import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readDataFreshness} from '../lib/data-freshness.mjs';
const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../data');
const report = readDataFreshness({directory});
const target = path.join(directory,'data-freshness.json');
fs.writeFileSync(target+'.tmp',JSON.stringify(report,null,2)+'\n');
fs.renameSync(target+'.tmp',target);
for (const source of report.sources) console.log(`${source.label}: ${source.status} / ${source.count}건 / ${source.checkedAt || '확인 기록 없음'}`);
const problems = report.sources.filter(source => source.status !== 'fresh');
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n### 공공자료 최신성 점검\n'+report.sources.map(source=>`- ${source.label}: ${source.status}, 마지막 목록 수집 ${source.checkedAt || '미확인'}, 저장 ${source.count}건`).join('\n')+'\n');
}
const overdue=problems.filter(source=>['stale','missing'].includes(source.status));
const partial=problems.filter(source=>source.status==='partial');
if (partial.length) console.warn('::warning::일부 공공자료 갱신 보류: '+partial.map(source=>source.label).join(', ')+'. 기존 정보와 실제 확인시각을 보존했습니다.');
if (overdue.length && process.argv.includes('--check')) {
  console.error('::error::공공자료 갱신 확인 필요: '+overdue.map(source=>`${source.label}(${source.status})`).join(', ')+'. 기존 자료와 URL을 보존했습니다.');
  process.exitCode=1;
}
