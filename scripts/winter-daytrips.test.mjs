import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {isPublicWinterCourse} from '../lib/winter-course-validation.mjs';
import {winterCourseImage} from '../lib/winterCourseImage.mjs';
const read=file=>JSON.parse(fs.readFileSync(file));
const data=read('data/winter-courses.json'),courses=data.courses;
test('the collection has twenty distinct day trips across all seventeen regions',()=>{
 assert.equal(courses.length,20);assert.equal(new Set(courses.map(c=>c.slug)).size,20);assert.equal(new Set(courses.map(c=>c.title)).size,20);
 assert.deepEqual(new Set(courses.map(c=>c.area)),new Set(['서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주']));
 for(const c of courses){assert(isPublicWinterCourse(c),c.slug);assert.equal(c.duration,'당일');assert.equal(c.stops.length,3);assert(c.startPoint&&c.transport&&c.durationLabel);assert.equal(new Set(c.stops.map(s=>s.placeId)).size,3);assert(c.validation.straightLineLegsKm.every(km=>km<10));assert(c.intro.length>=100);assert(c.sections.length>=2);}
});
test('sixty reviewed pictures resolve to local files and attributed API originals',()=>{
 const photos=courses.flatMap(c=>c.stops.map(s=>s.photo));assert.equal(new Set(photos.map(p=>p.src)).size,60);
 for(const p of photos){assert(winterCourseImage({image:p}));assert(fs.existsSync('public'+p.src),p.src);assert.equal(new URL(p.sourceUrl).hostname,'tong.visitkorea.or.kr');assert(p.width>300&&p.height>300);}
 assert.equal(winterCourseImage({image:{...photos[0],sourceUrl:'https://unknown.example/image.webp'}}),null);
 assert.equal(winterCourseImage({image:{...photos[0],reviewed:false}}),null);
});
test('retired articles and automatic overnight additions cannot reappear',()=>{
 const retired=read('data/winter-retired-slugs.json');assert.equal(retired.slugs.length,17);
 assert(retired.slugs.every(slug=>!courses.some(c=>c.slug===slug)));
 assert.equal(read('data/winter-policy.json').newPublicationEnabled,false);
 assert(!fs.readFileSync('.github/workflows/daily.yml','utf8').includes('node scripts/generate-winter-courses.mjs'));
});
test('official sources, Naver discovery and original API addresses are present',()=>{
 const searches=read('data/winter-naver-research.json').queries;assert.equal(searches.length,20);assert(searches.every(q=>q.status===200&&q.results.length>0));
 const originals=new Map(read('data/winter-daytrip-places.json').flatMap(c=>c.stops).map(p=>[p.id,p.addr]));
 for(const c of courses){assert(c.sources.length>=2);assert(c.sources.every(s=>s.checkedAt==='2026-11-06'&&s.url.startsWith('https://')));assert(c.stops.every(s=>s.description.length>80));for(const s of c.stops)assert.equal(s.addr,originals.get(s.placeId));}
});
