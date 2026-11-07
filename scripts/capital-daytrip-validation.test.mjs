import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {isPublicWinterCourse} from '../lib/winter-course-validation.mjs';
const existing=JSON.parse(fs.readFileSync('data/winter-courses.json','utf8')).courses[0];
function sample(){
 const c=structuredClone(existing);c.validation.version=4;c.validation.sourceKind='official-tour-api';
 c.stops.forEach((s,i)=>{s.officialUrl=c.sources[i%c.sources.length].url;s.stay||='60분 제안';s.timeLabel||='낮';s.photo.placeId=String(s.placeId);s.photo.copyrightType='Type1';});
 delete c.stops[2].photo;c.image=c.stops[0].photo;return c;
}
test('v4 allows two reviewed place photos and a third stop without a photo',()=>assert.equal(isPublicWinterCourse(sample()),true));
test('v4 rejects insufficient or mismatched rights, identity, location, sources and dates',()=>{
 const bad=fn=>{const c=sample();fn(c);assert.equal(isPublicWinterCourse(c),false);};
 bad(c=>delete c.stops[1].photo);
 bad(c=>c.stops[1].photo.placeId='999999');
 bad(c=>c.stops[1].photo.copyrightType='Type3');
 bad(c=>c.stops[1].photo.reviewed=false);
 bad(c=>c.image={...c.image,src:'/winter-photos/missing.webp'});
 bad(c=>c.stops[1].mapx='');
 bad(c=>c.stops[1].officialUrl='https://example.com/unverified');
 bad(c=>c.sources[0].checkedAt='2099-01-01');
 bad(c=>c.stops[0].description='짧은 글');
 bad(c=>c.stops[0].timeLabel='');
 bad(c=>c.stops[0].photo.kind='ai');
 bad(c=>c.stops[1].photo.sourceUrl=c.stops[0].photo.sourceUrl);
 bad(c=>c.duration='1박2일');
});
test('existing day and overnight rules still require their original photo coverage',()=>{
 const day=structuredClone(existing);day.stops[0].photo.reviewed=false;assert.equal(isPublicWinterCourse(day),false);
 const night=JSON.parse(fs.readFileSync('data/winter-overnight-courses.json','utf8')).courses[0];const c=structuredClone(night);c.stops.find(s=>s.photo).photo.reviewed=false;assert.equal(isPublicWinterCourse(c),false);
});
