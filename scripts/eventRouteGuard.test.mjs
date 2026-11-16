import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {eventRouteIds,buildEventRouteIndex} from './build-event-route-index.mjs';

test('current, archived and curated IDs all retain their existing detail route',()=>{
  assert.deepEqual(eventRouteIds({events:[{id:'2'}]},{events:[{id:'1'},{id:'2'}]},{events:[{id:'editorial'}]}),['1','2','editorial']);
  assert.throws(()=>eventRouteIds({events:[]},{events:[]}),/incomplete/);
  assert.throws(()=>eventRouteIds({}),/missing/);
});
test('the compact middleware index covers every existing event URL',()=>{
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');buildEventRouteIndex(root);
  const ids=new Set(JSON.parse(fs.readFileSync(path.join(root,'data/event-route-ids.json'),'utf8')).ids);
  for(const file of ['events.json','events-archive.json','curated-events.json'])for(const event of JSON.parse(fs.readFileSync(path.join(root,'data',file),'utf8')).events)assert(ids.has(String(event.id)),event.id);
  assert(!ids.has('nonexistent-culture-upgrade'));
});
