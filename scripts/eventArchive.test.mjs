import assert from 'node:assert/strict';
import test from 'node:test';
import {mergeEventArchive} from './eventArchive.mjs';

test('archives ended outgoing events without restoring missing future events', () => {
  const old={id:'a',title:'지난 행사',endDate:'20260923',place:'updated'};
  const future={id:'b',title:'미래 행사',endDate:'20261001'};
  const active={id:'c',title:'진행 행사',endDate:'20261002'};
  const prior={id:'d',title:'이전 행사',endDate:'20260920'};
  const result=mergeEventArchive([prior,{...old,place:'stale'},active],[old,future,active],[active],'20260924');
  assert.deepEqual(result.map(event=>event.id),['a','d']);
  assert.equal(result[0].place,'updated');
});
