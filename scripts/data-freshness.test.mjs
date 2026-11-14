import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildDataFreshness,DATA_SOURCES} from '../lib/data-freshness.mjs';

const now=new Date('2026-11-14T11:00:00Z');
function snapshot(age=1) {
  return Object.fromEntries(DATA_SOURCES.map(source=>[source.file,{
    generatedAt:new Date(now.getTime()-age*3600000).toISOString(),
    [source.field]:source.id==='pet-travel'?{'123':{id:'123'}}:[{id:'123'}],
  }]));
}
test('daily and weekly collections have separate expiry windows',()=>{
 const report=buildDataFreshness(snapshot(48),now);
 assert(report.sources.filter(source=>['events','festivals','pet-travel'].includes(source.id)).every(source=>source.status==='stale'));
 assert(report.sources.filter(source=>['places','restaurants','camping'].includes(source.id)).every(source=>source.status==='fresh'));
 assert.equal(report.healthy,false);
});
test('partial refreshes and regional failures never appear fully refreshed',()=>{
 const data=snapshot();
 data['events.json'].incompleteRefresh=true;
 data['festivals.json'].sourceRefresh={부산:{success:false,status:'deferred'}};
 data['pet-travel.json'].refresh={checkedAt:data['pet-travel.json'].generatedAt,complete:false};
 assert(buildDataFreshness(data,now).sources.slice(0,3).every(source=>source.status==='partial'));
});
test('missing, future, empty and invalid records cannot pass freshness checks',()=>{
 const data=snapshot(); delete data['events.json'];
 data['festivals.json'].generatedAt='not-a-date';
 data['places.json'].generatedAt='2026-11-15T11:00:00Z';
 data['camping.json'].camps=[];
 const report=buildDataFreshness(data,now);
 for(const id of ['events','festivals','places','camping'])assert.equal(report.sources.find(source=>source.id===id).status,'missing');
});
test('refresh confirmation wins over a later generated file and retains the real age',()=>{
 const data=snapshot();
 data['festivals.json'].refresh={checkedAt:'2026-11-01T00:00:00Z',complete:false};
 const report=buildDataFreshness(data,now);
 assert.equal(report.sources[1].status,'stale');
 assert.equal(report.sources[1].checkedAt,'2026-11-01T00:00:00.000Z');
 assert.equal(report.sources[2].count,1);
 assert(!JSON.stringify(report).includes('serviceKey'));
});
test('both schedules record freshness before committing and include it in their failure summary',()=>{
 for(const name of ['daily','weekly']){
  const text=fs.readFileSync(`.github/workflows/${name}.yml`,'utf8');
  assert(text.indexOf('id: freshness')<text.indexOf('git add data/'));
  assert.match(text,/node scripts\/report-data-freshness\.mjs --check/);
  assert.match(text,/FRESHNESS: \$\{\{ steps.freshness.outcome \}\}/);
  assert.match(text,/for name in [^\n]+ FRESHNESS; do/);
  assert.match(text,/git add data\/data-freshness.json/);
 }
});
