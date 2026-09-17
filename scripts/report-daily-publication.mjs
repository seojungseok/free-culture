// Read-only publication accounting. A green workflow is not a publication count.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export const groups=[
  {name:'관광지',file:'place-articles.json',target:10,status:true},
  {name:'여행코스',file:'course-articles.json',target:10,status:true},
  {name:'시티투어',file:'city-tour-articles.json',target:10,review:true},
  {name:'입장권·체험',file:'waug/published.json',target:20},
  {name:'주말 준비물 (별도)',file:'weekend-prep.json',target:5,status:true},
];
export function publicIds(store,group,now=Date.now()){
  return Object.entries(store.articles).filter(([,a])=>{
    if(group.status&&a.status!=='published')return false;
    if(group.review&&!a.reviewed)return false;
    const date=Date.parse(a.publishAt||a.publishedAt);
    return Number.isFinite(date)&&date<=now;
  }).map(([key,a])=>String(a.slug||a.id||key)).sort();
}
export function compare(before,after){
  return groups.map(g=>{
    const old=new Set(before[g.file]);
    const ids=after[g.file].filter(id=>!old.has(id));
    return {name:g.name,target:g.target,count:ids.length,ids};
  });
}
function snapshot(){return Object.fromEntries(groups.map(g=>[g.file,publicIds(JSON.parse(fs.readFileSync('data/'+g.file,'utf8')),g)]));}
function main(){
  const file='.cache/daily-publication-before.json';
  if(process.argv[2]==='snapshot'){
    fs.mkdirSync('.cache',{recursive:true});
    fs.writeFileSync(file,JSON.stringify(snapshot()));
    return;
  }
  if(!fs.existsSync(file))throw Error('발행 전 기록 없음: 신규 발행 수를 확인할 수 없습니다.');
  const rows=compare(JSON.parse(fs.readFileSync(file,'utf8')),snapshot());
  const lines=['## 자동 글 실제 발행 결과','','공개 데이터의 작업 전후 차이입니다. 기존 글 수정은 신규 글로 세지 않습니다. 운영 반영은 커밋·배포 성공 여부를 함께 확인하세요.','','| 구분 | 이번 실행 신규 공개 | 일일 목표/상한 |','| --- | ---: | ---: |',...rows.map(r=>`| ${r.name} | ${r.count} | ${r.target} |`),''];
  for(const r of rows)if(r.count<r.target)console.log(`::warning::${r.name}: 신규 공개 ${r.count}/${r.target}. 후보 부족·검수 보류·작성 실패 여부를 해당 단계에서 확인하세요.`);
  console.log(lines.join('\n'));
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines.join('\n'));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
