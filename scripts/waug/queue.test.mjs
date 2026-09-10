import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {publicationBudget} from '../lib/publication-budget.mjs';
test('site-wide count includes three publishers and deduplicates ticket reservations',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'waug-budget-'));fs.mkdirSync(path.join(root,'data/waug'),{recursive:true});const save=(name,data)=>fs.writeFileSync(path.join(root,'data',name+'.json'),JSON.stringify(data));
 save('place-articles',{articles:{a:{publishedAt:'2026-09-10T15:00:00Z'},draft:{status:'draft',publishedAt:'2026-09-10T15:00:00Z'}}});save('course-articles',{articles:{b:{publishedAt:'2026-09-11T01:00:00Z'}}});save('city-tour-articles',{articles:[{id:'c',publishedAt:'2026-09-11T02:00:00Z'}]});
 save('waug/editorial',{history:[{slug:'x',day:'2026-09-11'}],articles:[{placeId:'ready',status:'scheduled',scheduledAt:'2026-09-11T06:00:00+09:00'}]});save('waug/queue',{jobs:[{placeId:'ready',status:'scheduled',publicationDay:'2026-09-11'},{placeId:'new',status:'queued',publicationDay:'2026-09-11'},{placeId:'held',status:'held',publicationDay:'2026-09-11'}]});
 assert.deepEqual(publicationBudget(root,new Date('2026-09-11T03:00:00Z')),{day:'2026-09-11',published:4,reserved:2,remaining:19,unreserved:27,categories:{'place-articles':1,'course-articles':1,'city-tour-articles':1},waugPublished:1,otherPublished:3});
});
test('106 original affiliate codes and special conditions survive import',()=>{
 const read=p=>JSON.parse(fs.readFileSync('data/waug/'+p+'.json'));const c=read('catalog'),source=read('imports/yeongnam-2026-09-11'),q=read('queue');assert.equal(source.records.length,106);
 for(const r of source.records)assert.equal(c.products.find(p=>p.id===r.affiliateCode)?.affiliateUrl,r.affiliateUrl);
 assert.equal(c.products.find(p=>p.sourceNumber===98).area,'부산');assert.equal(c.products.find(p=>p.sourceNumber===133).duplicateOf,'KTz8pE8w');
 for(const n of [190,189,122,111,107])assert.ok(c.products.find(p=>p.sourceNumber===n).queueHoldReason);
 assert.equal(new Set(q.jobs.map(j=>j.placeId)).size,q.jobs.length);
 for(const day of new Set(q.jobs.map(j=>j.publicationDay).filter(Boolean)))assert.ok(q.jobs.filter(j=>j.publicationDay===day).length<=20);
});

test('general 30 and tickets 20 are independent daily buckets',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'separate-50-'));fs.mkdirSync(path.join(root,'data/waug'),{recursive:true});const save=(name,data)=>fs.writeFileSync(path.join(root,'data',name+'.json'),JSON.stringify(data));
 for(const name of ['place-articles','course-articles','city-tour-articles'])save(name,{articles:Array.from({length:10},(_,i)=>({id:i,publishedAt:'2026-09-11T01:00:00Z'}))});
 save('waug/editorial',{articles:[],history:[]});let b=publicationBudget(root,new Date('2026-09-11T03:00:00Z'));assert.equal(b.unreserved,0);assert.equal(b.remaining,20);
 save('waug/editorial',{articles:[],history:Array.from({length:20},(_,i)=>({slug:'t'+i,day:'2026-09-11'}))});b=publicationBudget(root,new Date('2026-09-11T03:00:00Z'));assert.equal(b.published,50);assert.equal(b.remaining,0);assert.equal(b.unreserved,0);
});
