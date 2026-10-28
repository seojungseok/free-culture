// Revise held drafts only; never publish or rewrite an existing public article.
import fs from 'node:fs';
import {buildCourse,candidate,kstDay} from './lib/winter-course.mjs';
import {collectEvidence,summarizeEvidence} from './lib/winter-enrichment.mjs';
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const store=read('data/winter-courses.json');
const rawCourses=read('data/courses-auto.json').courses;
const originals=new Map(rawCourses.map(c=>[String(c.id),c]));
const places=new Map(read('data/places.json').spots.map(p=>[String(p.id),p]));
const drafts=store.courses.filter(c=>c.status==='draft'&&c.validation?.sourceKind==='cached-tour-data');
if(!drafts.length){console.log('보류된 초안 없음');process.exit(0);}
const key=process.env.OPENAI_API_KEY;if(!key)throw Error('OPENAI_KEY_MISSING');
const budget=read('data/winter-budget.json'),day=kstDay();
if(budget.version!==1||!Number.isInteger(budget.attempts)||budget.attempts<0||(budget.day!==null&&!/^\d{4}-\d{2}-\d{2}$/.test(budget.day)))throw Error('WINTER_BUDGET_INVALID');
if(budget.day!==day){budget.day=day;budget.attempts=0;}
if(budget.attempts>=1)throw Error('WINTER_DAILY_ATTEMPT_LIMIT');
budget.attempts++;fs.writeFileSync('data/winter-budget.json',JSON.stringify(budget)+'\n');
const usable=drafts.filter(d=>candidate(originals.get(String(d.sourceCourseId)),places));
const evidence=collectEvidence(usable,rawCourses,read('data/place-overviews.json'),read('data/place-details.json').details,read('data/course-place-details.json').places);
const summaries=await summarizeEvidence(evidence,key,process.env.WINTER_OPENAI_MODEL||'gpt-6-luna');
for(const draft of drafts){if(!usable.includes(draft)){draft.status='held';draft.holdReason='방문 적합성 추가 확인 필요';continue;}const next=buildCourse(draft,new Date(draft.createdAt),summaries);draft.sections=next.sections;draft.validation=next.validation;}
fs.writeFileSync('data/winter-courses.json',JSON.stringify(store,null,2)+'\n');
console.log(JSON.stringify({drafts:drafts.length,sourceSummaries:summaries.size,status:'draft'}));
