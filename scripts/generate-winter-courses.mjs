// Winter drafts use saved TourAPI data only. Publication is intentionally disabled.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { candidate, dailyRemaining, chooseAllowed, buildCourse, kstDay } from './lib/winter-course.mjs';
import { collectEvidence, summarizeEvidence } from './lib/winter-enrichment.mjs';

const read = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const policy=read('data/winter-policy.json');
const store=read('data/winter-courses.json');
if(!Array.isArray(store.courses))throw Error('WINTER_STORE_INVALID');
if(policy.newPublicationEnabled!==false)throw Error('PUBLICATION_REVIEW_REQUIRED');
const remaining=dailyRemaining(store.courses,policy);
if(!remaining['당일']&&!remaining['1박2일']) { console.log('오늘의 겨울 코스 초안 목표 달성'); process.exit(0); }
const key=process.env.OPENAI_API_KEY;
if(!key){console.error('OpenAI 키 없음: 겨울 원고 생성 보류');process.exit(1);}
const budget=read('data/winter-budget.json');
if(budget.version!==1 || !Number.isInteger(budget.attempts) || budget.attempts<0 || (budget.day!==null && !/^\d{4}-\d{2}-\d{2}$/.test(budget.day)))throw Error('WINTER_BUDGET_INVALID');
const day=kstDay();
if(budget.day!==day){budget.day=day;budget.attempts=0;}
if(budget.attempts>=1)throw Error('WINTER_DAILY_ATTEMPT_LIMIT');
const places=new Map(read('data/places.json').spots.map(p=>[String(p.id),p]));
const saved=new Set(store.courses.map(c=>c.sourceCourseId));
const previous=store.courses.map(c=>new Set((c.stops||[]).map(s=>s.placeId)));
const rawCourses=read('data/courses-auto.json').courses;
const eligible=rawCourses.map(c=>candidate(c,places)).filter(Boolean).filter(c=>!saved.has(c.sourceCourseId)).filter(c=>!previous.some(ids=>c.stops.filter(s=>ids.has(s.placeId)).length/Math.min(ids.size,c.stops.length)>=0.67));
const rotate=(a)=>[...a].sort((x,y)=>createHash('sha256').update(`${kstDay()}:${x.sourceCourseId}`).digest('hex').localeCompare(createHash('sha256').update(`${kstDay()}:${y.sourceCourseId}`).digest('hex'))).slice(0,30);
const pool=[...rotate(eligible.filter(c=>c.duration==='당일')),...rotate(eligible.filter(c=>c.duration==='1박2일'))];
if(pool.filter(x=>x.duration==='당일').length<remaining['당일']||pool.filter(x=>x.duration==='1박2일').length<remaining['1박2일'])throw Error('INSUFFICIENT_ELIGIBLE_CANDIDATES');
// Persist before API use. The serialized workflow commits this even on API failure.
budget.attempts++;fs.writeFileSync('data/winter-budget.json',JSON.stringify(budget)+'\n');
const choices=pool.map(c=>({id:c.sourceCourseId,duration:c.duration,area:c.area,stops:c.stops.map(s=>s.name)}));
const prompt=`겨울 여행 계획 후보를 지역과 목적지가 다양하도록 선택하세요. 날짜별 일정·거리·운영 여부는 추측하지 마세요. 정해진 후보 ID만 골라 중복 없이 정확히 당일 ${remaining['당일']}개와 1박2일 ${remaining['1박2일']}개를 반환하세요. 같은 장소가 대부분 겹치는 코스는 고르지 마세요. JSON 객체 형식: {"day":["id"],"overnight":["id"]}. 후보: ${JSON.stringify(choices)}`;
if(prompt.length>24000)throw Error('WINTER_INPUT_LIMIT');
const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model:process.env.WINTER_OPENAI_MODEL||'gpt-6-luna',response_format:{type:'json_object'},messages:[{role:'system',content:'Return only the requested JSON, selecting IDs exclusively from the supplied data.'},{role:'user',content:prompt}],max_completion_tokens:2000}),signal:AbortSignal.timeout(90000)});
if(!response.ok)throw Error(`WINTER_MODEL_HTTP_${response.status}`);
const json=await response.json(), text=json.choices?.[0]?.message?.content;
const selected=chooseAllowed(text,pool,remaining);
const now=new Date();
const evidence=collectEvidence(selected,rawCourses,read('data/place-overviews.json'),read('data/place-details.json').details,read('data/course-place-details.json').places);
const summaries=await summarizeEvidence(evidence,key,process.env.WINTER_OPENAI_MODEL||'gpt-6-luna');
const drafts=selected.map(x=>buildCourse(x,now,summaries));
// Keep every draft held until a separate editorial freshness review is available.
store.courses.push(...drafts);store.updatedAt=now.toISOString();
fs.writeFileSync('data/winter-courses.json',JSON.stringify(store,null,2)+'\n');
console.log(JSON.stringify({day:kstDay(now),created:drafts.length,dayTrips:drafts.filter(x=>x.duration==='당일').length,overnight:drafts.filter(x=>x.duration==='1박2일').length,sourceSummaries:summaries.size,status:'draft',selectionUsage:json.usage||null}));
