import test from 'node:test';
import assert from 'node:assert/strict';
import {publicIds,compare,groups} from './report-daily-publication.mjs';

test('Counts only public due records, excluding drafts, future posts and unreviewed city tours',()=>{
  const now=Date.parse('2026-09-18T00:00:00Z');
  const past='2026-09-17T00:00:00Z';
  const articles={old:{status:'published',publishedAt:past},draft:{status:'draft',publishedAt:past},future:{status:'published',publishedAt:'2026-09-19T00:00:00Z'}};
  assert.deepEqual(publicIds({articles},groups[0],now),['old']);
  assert.deepEqual(publicIds({articles:[{id:'yes',reviewed:true,publishedAt:past},{id:'no',reviewed:false,publishedAt:past}]},groups[2],now),['yes']);
});
test('Existing article rewrites do not count; a previously unpublished ID becoming public does',()=>{
  const before=Object.fromEntries(groups.map(g=>[g.file,['existing']]));
  const after=Object.fromEntries(groups.map(g=>[g.file,['existing','newly-published']]));
  assert(compare(before,after).every(r=>r.count===1&&r.ids[0]==='newly-published'));
  assert(compare(before,before).every(r=>r.count===0));
});
