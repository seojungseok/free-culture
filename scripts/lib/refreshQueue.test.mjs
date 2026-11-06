import test from 'node:test';
import assert from 'node:assert/strict';
import { refreshQueue, needsRefresh } from './refreshQueue.mjs';
import { publicImageUrl } from '../../lib/publicImage.mjs';

const now = Date.parse('2026-11-06T00:00:00Z');
test('populated operating-info caches return to the queue after 30 days', () => {
  assert(needsRefresh({usetime:'09:00'}, '2026-10-07T00:00:00Z', now));
  assert(!needsRefresh({usetime:'09:00'}, '2026-10-08T00:00:00Z', now));
  assert(needsRefresh({usetime:'09:00'}, undefined, now));
  assert(needsRefresh({usetime:'09:00'}, '2026-11-07T00:00:00Z', now));
});
test('oldest records rotate ahead of recent records without dropping existing data', () => {
  const records = {a:{checkedAt:'2026-10-06T00:00:00Z'},b:{checkedAt:'2026-10-01T00:00:00Z'},c:{checkedAt:'2026-11-01T00:00:00Z'}};
  assert.deepEqual(refreshQueue([{id:'a'},{id:'b'},{id:'c'},{id:'d'}], records, {}, now).map(r=>r.id), ['d','b','a']);
  assert.equal(records.b.checkedAt, '2026-10-01T00:00:00Z');
});
test('successful empty responses can defer retry without asserting old fields were reverified', () => {
  const record={a:{usetime:'old',checkedAt:'2026-01-01T00:00:00Z'}};
  assert.deepEqual(refreshQueue([{id:'a'}], record, {a:'2026-11-05T00:00:00Z'}, now), []);
  assert.equal(record.a.checkedAt, '2026-01-01T00:00:00Z');
});
test('provider image fields reject document attachments and unsafe URLs', () => {
  assert.equal(publicImageUrl('https://gocamping.or.kr/upload/camp/7942/photo.pptx'), '');
  assert.equal(publicImageUrl('javascript:alert(1)'), '');
  assert.equal(publicImageUrl('https://user:secret@example.com/photo.jpg'), '');
  assert.equal(publicImageUrl('http://gocamping.or.kr/photo.JPG?size=400'), 'https://gocamping.or.kr/photo.JPG?size=400');
});
