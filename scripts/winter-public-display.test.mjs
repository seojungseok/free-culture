import test from 'node:test';
import assert from 'node:assert/strict';
import { isPublicWinterCourse } from '../lib/winter-course-validation.mjs';

const now = new Date('2026-10-28T12:00:00Z');
const base = {
  id: 'winter-a', slug: 'winter-a', title: '겨울 여행', area: '서울', duration: '1박2일', intro: '겨울 일정', sourceCourseId: 'course-1',
  status: 'published', publishedAt: '2026-10-28T11:00:00Z',
  validation: { version: 1, checkedAt: '2026-10-28T11:00:00Z', sourceKind: 'cached-tour-data', checks: ['identity', 'coordinates', 'route', 'text'] },
  stops: [{ placeId: '101', name: '첫 장소', mapx: 127, mapy: 37, day: 1 }, { placeId: '102', name: '둘째 장소', mapx: 127.1, mapy: 37.1, day: 2 }],
  sections: [{ heading: '겨울 여행', paragraphs: ['방문 전 확인합니다.'] }],
};
test('only a dated, validated published course with two itinerary days is visible', () => {
  assert.equal(isPublicWinterCourse(base, now), true);
  assert.equal(isPublicWinterCourse({ ...base, status: 'draft' }, now), false);
  assert.equal(isPublicWinterCourse({ ...base, publishedAt: '2026-10-29T00:00:00Z' }, now), false);
  assert.equal(isPublicWinterCourse({ ...base, validation: { ...base.validation, checks: ['identity'] } }, now), false);
  assert.equal(isPublicWinterCourse({ ...base, stops: base.stops.map((stop) => ({ ...stop, day: 1 })) }, now), false);
  assert.equal(isPublicWinterCourse({ ...base, stops: [base.stops[0], { ...base.stops[1], placeId: '101' }] }, now), false);
});
test('malformed unpublished data cannot crash or appear in the public list', () => {
  for (const value of [null, {}, { ...base, title: 4 }, { ...base, stops: [null, null] }, { ...base, sections: [null] }, { ...base, slug: '../unsafe' }]) {
    assert.equal(isPublicWinterCourse(value, now), false);
  }
});
