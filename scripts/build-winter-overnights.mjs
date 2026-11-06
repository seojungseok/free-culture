import fs from 'node:fs';
import {isPublicWinterCourse} from '../lib/winter-course-validation.mjs';
import {winterCourseImage} from '../lib/winterCourseImage.mjs';

const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
if(!process.argv.includes('--reviewed'))throw Error('Editorial, route and photo review must be completed before publication.');
const editorials=[...read('data/winter-overnight-editorial-a.json'),...read('data/winter-overnight-editorial-b.json')];
const evidence=read('data/winter-overnight-places.json');
const existing=read('data/winter-courses.json').courses;
if(editorials.length!==20 || new Set(editorials.map(c=>c.slug)).size!==20 || new Set(editorials.map(c=>c.area)).size!==17)throw Error('Twenty unique articles covering seventeen regions are required.');
const now=new Date().toISOString();
const distance=(a,b)=>{const rad=Math.PI/180,lat=(Number(b.mapy)-Number(a.mapy))*rad,lon=(Number(b.mapx)-Number(a.mapx))*rad;return 12742*Math.asin(Math.sqrt(Math.sin(lat/2)**2+Math.cos(Number(a.mapy)*rad)*Math.cos(Number(b.mapy)*rad)*Math.sin(lon/2)**2));};
const courses=editorials.map(text=>{
 if(existing.some(c=>c.slug===text.slug))throw Error(`Existing URL cannot be replaced: ${text.slug}`);
 const plan=evidence.plans.find(p=>p.slug===text.slug);
 if(!plan || plan.stops.length!==text.stops.length)throw Error(`Missing route evidence: ${text.slug}`);
 const stops=text.stops.map((stop,index)=>{
  const match=plan.stops[index],place=evidence.places[match.id];
  if(!place || match.matchReviewed!==true || match.day!==stop.day || match.query!==stop.query || place.area!==text.area)throw Error(`Place or day mismatch: ${text.slug}/${stop.name}`);
  for(const photo of [place.photo,...(place.gallery||[])].filter(Boolean))if(!winterCourseImage({image:photo}) || String(photo.placeId)!==String(place.id) || !fs.existsSync('public'+photo.src))throw Error(`Unreviewed or mismatched photo: ${stop.name}`);
  return {...stop,placeId:String(place.id),sourceTitle:place.title,addr:place.addr,mapx:place.mapx,mapy:place.mapy,sourceCheckedAt:place.checkedAt,sourceModifiedAt:place.sourceModifiedAt,...(place.photo?{image:place.photo.src,photo:place.photo}:{}),...(place.gallery?.length?{gallery:place.gallery}:{})};
 });
 const legs=stops.slice(1).map((stop,index)=>Number(distance(stops[index],stop).toFixed(2)));
 if(legs.some(km=>!Number.isFinite(km)||km>90))throw Error(`Route needs further review: ${text.slug}`);
 const image=stops.find(stop=>stop.photo)?.photo;
 const course={...text,id:`winter-editorial-${text.slug}`,duration:'1박2일',status:'published',publishedAt:now,updatedAt:now,lastReviewedAt:now,sourceCourseId:`editorial-20261107-${text.slug}`,stops,image,validation:{version:3,sourceKind:'naver-official-tour-api',checkedAt:now,checks:['identity','coordinates','route','text','official-sources','photos','overnight','day-plan'],straightLineLegsKm:legs}};
 if(!isPublicWinterCourse(course))throw Error(`Publication validation: ${text.slug}`);
 return course;
});
fs.writeFileSync('data/winter-overnight-courses.json',JSON.stringify({version:3,updatedAt:now,collection:'winter-overnights-20261107',courses},null,2)+'\n');
console.log(JSON.stringify({articles:courses.length,regions:new Set(courses.map(c=>c.area)).size,photos:new Set(courses.flatMap(c=>c.stops.flatMap(s=>[s.photo,...(s.gallery||[])]).filter(Boolean).map(p=>p.src))).size,maxLegKm:Math.max(...courses.flatMap(c=>c.validation.straightLineLegsKm))}));
