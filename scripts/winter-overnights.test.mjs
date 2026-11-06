import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {isPublicWinterCourse} from '../lib/winter-course-validation.mjs';
import {winterCourseImage} from '../lib/winterCourseImage.mjs';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const courses=read('data/winter-overnight-courses.json').courses;
const existing=read('data/winter-courses.json').courses;
const evidence=read('data/winter-overnight-places.json');
const photos=course=>course.stops.flatMap(stop=>[stop.photo,...(stop.gallery||[])]).filter(Boolean);

test('twenty additional overnight articles cover seventeen regions without replacing day trips',()=>{
 assert.equal(courses.length,20);assert.equal(existing.length,20);
 const combined=[...existing,...courses];
 assert.equal(new Set(combined.map(c=>c.slug)).size,40);
 assert.equal(new Set(combined.map(c=>c.title)).size,40);
 assert.deepEqual(new Set(courses.map(c=>c.area)),new Set(['서울','인천','경기','강원','충북','충남','대전','세종','전북','광주','전남','대구','경북','부산','울산','경남','제주']));
 for(const course of courses){
  assert(isPublicWinterCourse(course),course.slug);
  assert.equal(course.duration,'1박2일');assert(course.overnightArea);
  assert(course.startPoint&&course.transport&&course.durationLabel);
  for(const day of [1,2])assert(course.stops.filter(s=>s.day===day).length>=2,course.slug);
  assert(course.validation.straightLineLegsKm.every(km=>km>=0&&km<=90));
 }
});
test('API identities and addresses match the reviewed route and photos resolve locally',()=>{
 for(const course of courses){
  const plan=evidence.plans.find(p=>p.slug===course.slug);assert(plan,course.slug);
  course.stops.forEach((stop,index)=>{
   assert.equal(stop.placeId,plan.stops[index].id);
   assert.equal(stop.day,plan.stops[index].day);
   assert.equal(stop.addr,evidence.places[stop.placeId].addr);
   for(const photo of [stop.photo,...(stop.gallery||[])].filter(Boolean))assert.equal(String(photo.placeId),stop.placeId);
  });
  assert(new Set(photos(course).map(p=>p.src)).size>=3,course.slug);
  assert(new Set(photos(course).map(p=>p.sourceUrl)).size>=3,course.slug);
  for(const photo of photos(course)){
   assert(winterCourseImage({image:photo}));assert(fs.existsSync('public'+photo.src),photo.src);
   assert.equal(new URL(photo.sourceUrl).hostname,'tong.visitkorea.or.kr');
   assert(photo.width>300&&photo.height>300);
  }
 }
});
test('overnight publication rejects a missing second day, unreviewed photo, duplicate identity and missing lodging area',()=>{
 assert(courses.length>0);const original=courses[0];
 const mutate=fn=>{const copy=structuredClone(original);fn(copy);assert.equal(isPublicWinterCourse(copy),false);};
 mutate(c=>c.stops.forEach(s=>s.day=1));
 mutate(c=>c.stops[1].placeId=c.stops[0].placeId);
 mutate(c=>c.overnightArea='');
 mutate(c=>c.stops.find(s=>s.photo).photo.reviewed=false);
 mutate(c=>c.stops.find(s=>s.photo).photo.sourceUrl='https://unknown.example/photo.webp');
 mutate(c=>c.stops[0].gallery=[{reviewed:false}]);
 mutate(c=>c.sources[0].checkedAt='2099-01-01');
 mutate(c=>c.status='draft');
});
