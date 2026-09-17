import test from 'node:test';
import assert from 'node:assert/strict';
import {pickQueue,holdCourse,canRetryCourse,takeNextCourse} from './lib/course-generation-queue.mjs';
import {checkCourseComposition,selectCourseStops} from './lib/articleGen.mjs';
import {splitCourseDays} from '../lib/courseSelect.js';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const course=(id,duration='당일')=>({id,duration,source:'auto',area:'강원',themes:['문화유적'],seasons:['autumn'],stops:[{name:'박물관',placeId:'1',addr:'강원도',mapx:128,mapy:37},{name:'정원',placeId:'2',addr:'강원도',mapx:128.01,mapy:37.01}]});
test('Scheduled generator replaces a rejected candidate, publishes 5/3/2, then reruns without more generation',()=>{
 // Run the actual generator in an isolated fixture checkout. Only the paid
 // model boundary is replaced; no production content or APIs are touched.
 fs.mkdirSync('.cache',{recursive:true});
 const root=fs.mkdtempSync(path.resolve('.cache/course-generation-test-'));
 for(const dir of ['scripts/lib','data'])fs.mkdirSync(path.join(root,dir),{recursive:true});
 for(const file of ['scripts/generateCourses.mjs','scripts/lib/course-generation-queue.mjs','scripts/lib/publication-budget.mjs'])fs.copyFileSync(file,path.join(root,file));
 fs.writeFileSync(path.join(root,'scripts/lib/articleGen.mjs'),`
export const COURSE_CAP_VERSION=3,COURSE_ATT_CAP={'당일':3,'1박2일':6,'2박3일':7},COURSE_THEME_LABEL={},usageTotal={in:0,out:0,calls:0};
export const selectCourseStops=c=>c.stops,usageCost=()=>0,rampCourses=()=>10;
export const buildCoursePrompt=JSON.stringify,buildListPrompt=JSON.stringify,courseSourceFacts=()=>'';
export const courseQualityCheck=t=>({ok:true,len:t.length}),patternCheck=()=>({ok:true}),courseGeoFeasible=()=>({ok:true}),courseStopsCheck=()=>({ok:true});
export const sanitizeUnsupported=t=>({text:t,removed:0});
export async function callOpenAI(prompt){const c=JSON.parse(prompt);return {text:'# '+c.id+'\\n'+'검증된 내용 '.repeat(120)};}
export async function checkCourseComposition(c){return c.id==='bad'?{ok:false,reason:'fixture rejected route'}:{ok:true};}
`);
 const input=['당일','1박2일','2박3일'].flatMap(d=>Array.from({length:12},(_,i)=>({...course(d+i,d),title:d+i,stops:course(d+i,d).stops.map(s=>({...s,overview:'검증 자료'}))})));
 input[0].id='bad';
 fs.writeFileSync(path.join(root,'data/courses-auto.json'),JSON.stringify({courses:input}));
 fs.writeFileSync(path.join(root,'data/course-articles.json'),JSON.stringify({articles:{}}));
 const env={...process.env,OPENAI_API_KEY:'fixture',GEMINI_API_KEY:'fixture',DATA_GO_KR_KEY:'',TOUR_API_KEY:'',COURSE_CHECK_ONLY:'',COURSE_IDS:'',FORCE_COUNT:'',COURSE_DAILY:'10',COURSE_REBUILD_MAX:'0'};
 const run=()=>execFileSync(process.execPath,['scripts/generateCourses.mjs'],{cwd:root,env,stdio:'pipe',timeout:30000});
 const read=()=>JSON.parse(fs.readFileSync(path.join(root,'data/course-articles.json'),'utf8'));
 run();const first=read();assert.equal(Object.keys(first.articles).length,10);assert(!first.articles.bad);
 assert.deepEqual(['당일','1박2일','2박3일'].map(d=>Object.values(first.articles).filter(a=>a.duration===d).length),[5,3,2]);
 assert.equal(first._generationBudget.newDrafts,10);assert.equal(first._generationBudget.compositionChecks,11);
 run();const second=read();assert.deepEqual(second.articles,first.articles);assert.deepEqual(second._generationBudget,first._generationBudget);
});
test('Senior reservations count inside 5/3/2 slots, never above ten; daily queue excludes best-list articles',()=>{
 const input=['당일','1박2일','2박3일'].flatMap(d=>Array.from({length:15},(_,i)=>({...course(d+i,d),stops:[{name:'사찰'},{name:'전통시장'},{name:'정원'}]})));
 input.push(course('best','베스트'));
 const chosen=pickQueue(input,new Set(),10);
 assert.equal(chosen.length,10);assert.equal(new Set(chosen.map(c=>c.id)).size,10);
 assert.deepEqual(['당일','1박2일','2박3일'].map(d=>chosen.filter(c=>c.duration===d).length),[5,3,2]);
 assert(!chosen.some(c=>c.id==='best'));
});
test('Held candidates wait, changed route material permits retry, and successful duration slots remain balanced',()=>{
 const a=course('bad'),history={},now=Date.parse('2026-09-18T00:00:00Z');
 holdCourse(history,a,'검증 실패',{now});assert(!canRetryCourse(a,history,now+86400000));
 assert(canRetryCourse({...a,stops:[...a.stops,{name:'새 장소'}]},history,now));
 assert(canRetryCourse(a,history,now+3*86400000));
 const items=[course('day','당일'),course('overnight','1박2일'),course('three','2박3일')];
 assert.equal(takeNextCourse(items,{'당일':5,'1박2일':3},10).id,'three');
});
test('Composition review sees the actual three-day plan and facts, and errors never approve publication',async()=>{
 const c={...course('three','2박3일'),stops:Array.from({length:7},(_,i)=>({name:'장소'+i,addr:'강원 '+i,mapx:128+i*.01,mapy:37,overview:'공식 자료'}))};
 assert.deepEqual(splitCourseDays(selectCourseStops(c),c.duration).map(s=>s.length),[3,2,2]);
 const ok=await checkCourseComposition(c,{apiKey:'fixture',request:async prompt=>{
   for(const value of ['1일차','2일차','3일차','강원 0','128','공식 자료'])assert(prompt.includes(value));
   return {text:'{"result":"OK","reason":"일차별 동선 확인"}'};
 }});assert.equal(ok.ok,true);
 for(const request of [async()=>({text:'{"result":"unknown"}'}),async()=>{throw Error('unavailable');}]){
   const result=await checkCourseComposition(c,{apiKey:'fixture',request});assert.equal(result.ok,false);assert.equal(result.retryable,true);
 }
 const held=await checkCourseComposition(c,{apiKey:'fixture',request:async()=>({text:'{"result":"NG","reason":"배편 근거 부족"}'})});assert.equal(held.ok,false);
});
