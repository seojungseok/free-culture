import fs from 'node:fs';import assert from 'node:assert/strict';import sharp from 'sharp';
import {readiness} from './core.mjs';import {publicationBudget} from '../lib/publication-budget.mjs';
const c=JSON.parse(fs.readFileSync('data/waug/catalog.json')), e=JSON.parse(fs.readFileSync('data/waug/editorial.json')), q=JSON.parse(fs.readFileSync('data/waug/queue.json')), source=JSON.parse(fs.readFileSync('data/waug/imports/yeongnam-2026-09-11.json'));
assert.equal(source.records.length,106);for(const r of source.records){const p=c.products.find(p=>p.id===r.affiliateCode);assert.equal(p?.affiliateUrl,r.affiliateUrl);assert.equal(p?.sourceNumber,r.number);assert.ok(p.productId);}
assert.equal(new Set(q.jobs.map(j=>j.placeId)).size,q.jobs.length);
for(const day of new Set(q.jobs.map(j=>j.publicationDay).filter(Boolean)))assert.ok(q.jobs.filter(j=>j.publicationDay===day&&!['published','held','excluded'].includes(j.status)).length+e.history.filter(h=>h.day===day).length<=20,day);
assert.equal(c.products.find(p=>p.sourceNumber===98).area,'부산');assert.equal(c.products.find(p=>p.sourceNumber===133).duplicateOf,'KTz8pE8w');assert.equal(c.products.find(p=>p.sourceNumber===163).eligibility,'excluded');
for(const n of [190,189,122,111,107])assert.ok(c.products.find(p=>p.sourceNumber===n).queueHoldReason);
assert.equal(new Set(c.products.filter(p=>[95,106,120].includes(p.sourceNumber)).map(p=>p.placeId)).size,1);
await sharp({create:{width:1200,height:630,channels:3,background:'#fff'}}).jpeg().toBuffer();
const output={checkedAt:new Date().toISOString(),sourceCount:106,queue:q.jobs.length,budget:publicationBudget(),prepared:e.articles.filter(a=>!a.publishedAt).map(a=>({slug:a.slug,issues:readiness(a,c.products)})),generationCalls:0};
if(process.env.GITHUB_ACTIONS==='true'){
 const key=process.env.OPENAI_API_KEY;if(!key)throw Error('GitHub OPENAI_API_KEY 누락');output.models={};
 for(const model of ['gpt-image-2','gpt-5.6-luna']){const r=await fetch('https://api.openai.com/v1/models/'+model,{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(30000)});output.models[model]={http:r.status,accessible:r.ok};if(!r.ok)throw Error(model+' 모델 조회 실패 HTTP '+r.status);}
}
fs.mkdirSync('.cache/waug',{recursive:true});fs.writeFileSync('.cache/waug/preflight.json',JSON.stringify(output,null,2));console.log(JSON.stringify(output,null,2));
