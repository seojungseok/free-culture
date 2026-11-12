// Read-only release check: no hotel searches, affiliate follows, or provider API calls.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
import {isPublicWinterCourse} from '../lib/winter-course-validation.mjs';
const base=new URL(process.argv[2]||'http://127.0.0.1:3188');
assert(['localhost','127.0.0.1','mwohaji.kr','www.mwohaji.kr'].includes(base.hostname));
const courses=['winter-courses','winter-overnight-courses','winter-metropolitan-daytrips','winter-metropolitan-overnights'].flatMap(file=>JSON.parse(fs.readFileSync('data/'+file+'.json','utf8')).courses).filter(course=>isPublicWinterCourse(course));
const result=[];
const lodging=JSON.parse(fs.readFileSync('data/winter-stay-affiliates.json','utf8'));
assert.equal(lodging.stays.length,30);
assert.equal(new Set(lodging.stays.map(stay=>stay.affiliateUrl)).size,30);
for(const course of courses){
 const route='/winter-travel/'+course.slug,response=await fetch(new URL(route,base));
 assert.equal(response.status,200,course.slug);
 const $=load(await response.text()),article=$('article').first(),overnight=course.duration==='1박2일';
 assert.equal($('h1').length,1);assert.equal($('h1').text(),course.title);
 assert.equal($('link[rel=canonical]').attr('href'),'https://mwohaji.kr'+route);
 for(const stop of course.stops){if(stop.description)assert(article.text().includes(stop.description),course.slug+' keeps the reviewed place description');if(stop.officialUrl){const expected=new URL(stop.officialUrl).href;assert(article.find('a[href]').toArray().some(a=>$(a).attr('href')===expected),course.slug+' keeps the official destination');}}
 for(const section of course.sections)for(const paragraph of section.paragraphs)assert(article.text().includes(paragraph),course.slug+' keeps the original paragraphs');
 assert(article.text().includes(overnight?'이틀을 여유 있게 쓰는 관람·식사 계획':'관람과 식사, 이렇게 나눠보세요'));
 assert(article.text().includes(overnight?'숙소를 예약하기 전에 비교할 것':'출발 전에 정해두면 편한 세 가지'));
 const baseline=[course.intro,...course.stops.map(s=>s.description),...course.sections.flatMap(s=>s.paragraphs)].join('').length;
 const paragraphs=article.find('p').toArray().map(p=>$(p).text()).join('').length;
 assert(paragraphs>baseline+500,course.slug+' must gain substantive planning advice');
 const booking=article.find('#winter-stay a');assert.equal(booking.length,overnight?1:0);
 if(overnight){const stay=lodging.stays.find(stay=>stay.slug===course.slug);assert(stay,course.slug+' has a matched accommodation');assert.equal(booking.attr('href'),stay.affiliateUrl);assert.match(booking.attr('rel'),/sponsored/);assert(article.find('#winter-stay').text().includes(course.overnightArea));assert(article.find('#winter-stay').text().includes(stay.name));}
 const schemas=$('script[type="application/ld+json"]').toArray().flatMap(s=>JSON.parse($(s).text()));
 const schema=schemas.find(s=>s['@type']==='Article');assert(schema);assert.equal(schema.headline,course.title);assert.equal(schema.url,'https://mwohaji.kr'+route);assert.equal(schema.dateModified,'2026-11-12T00:00:00+09:00');
 result.push({slug:course.slug,originalCharacters:baseline,paragraphCharacters:paragraphs,overnight});
}
const sitemap=await(await fetch(new URL('/sitemap.xml',base))).text();
for(const course of courses)assert(sitemap.includes('https://mwohaji.kr/winter-travel/'+course.slug));
console.log(JSON.stringify({passed:true,pages:result.length,overnightBookingRoutes:result.filter(v=>v.overnight).length,minParagraphCharacters:Math.min(...result.map(v=>v.paragraphCharacters)),maxParagraphCharacters:Math.max(...result.map(v=>v.paragraphCharacters)),minAddedParagraphCharacters:Math.min(...result.map(v=>v.paragraphCharacters-v.originalCharacters)),originalTitlesSourcesAndRoutesPreserved:true,affiliateDestinationsFollowed:0}));
