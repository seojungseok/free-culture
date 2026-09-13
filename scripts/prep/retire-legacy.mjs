import fs from 'node:fs';
import path from 'node:path';
import {readStore,saveStore} from './store.mjs';
const store=readStore();
const config=JSON.parse(fs.readFileSync('data/weekend-prep-schedule.json','utf8'));
const initial=new Set(config.initialTopics.map(a=>a.slug));
const retiring=store.articles.filter(a=>initial.has(a.slug)&&a.contentStyle!=='shoppable-scene-v2');
const remaining=store.articles.filter(a=>!retiring.includes(a));
const images=a=>[a.cover,...a.sections.map(s=>s.image).filter(Boolean)].map(p=>p.url);
const used=new Set(remaining.flatMap(images));
const removedImages=[...new Set(retiring.flatMap(images))].filter(url=>!used.has(url));
const base=path.resolve('public/prep-images');
for(const url of removedImages){
 if(!/^\/prep-images\/[a-zA-Z0-9_-]+\.(webp|png|jpg)$/.test(url))throw Error('삭제 이미지 경로 범위 오류');
 const absolute=path.resolve('public'+url);
 if(path.dirname(absolute)!==base)throw Error('삭제 범위 밖 경로');
}
const prior=fs.existsSync('data/weekend-prep-retirement-report.json')?JSON.parse(fs.readFileSync('data/weekend-prep-retirement-report.json','utf8')):{};
const report={retiredSlugs:[...new Set([...(prior.retiredSlugs||[]),...retiring.map(a=>a.slug)])],removedImages:[...new Set([...(prior.removedImages||[]),...removedImages])],remainingPublished:remaining.filter(a=>a.status==='published').length,authorization:'2026-09-13 사용자 재확인: 기존 글은 모두 잘못된 글이므로 삭제, 새로 검증된 콘텐츠만 유지'};
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--apply')&&retiring.length){
 saveStore({...store,articles:remaining},store.version);
 // Exact individually checked targets; never recursive or workspace-wide deletion.
 for(const url of removedImages)if(fs.existsSync('public'+url))fs.unlinkSync('public'+url);
 fs.writeFileSync('data/weekend-prep-retirement-report.json',JSON.stringify({...report,at:new Date().toISOString(),replacementComplete:false},null,2)+'\n');
}
