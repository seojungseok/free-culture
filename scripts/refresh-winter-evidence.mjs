// Review saved public tourism sources against a limited set of official sites.
// Failures never turn a candidate into a verified or public place.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { candidate, kstDay } from './lib/winter-course.mjs';
import { inspectOfficialPlace, OFFICIAL_HOSTS } from './lib/winter-official-evidence.mjs';
const read = path => JSON.parse(fs.readFileSync(path,'utf8'));
const path='data/winter-place-verifications.json';
const registry=read(path);
if(registry.version!==1 || !registry.places || Array.isArray(registry.places))throw Error('WINTER_VERIFICATION_STORE_INVALID');
const places=new Map(read('data/places.json').spots.map(place=>[String(place.id),place]));
const details=read('data/place-details.json').details || {};
const courses=read('data/courses-auto.json').courses;
const ids=[...new Set(courses.map(course=>candidate(course,places)).filter(Boolean).flatMap(course=>course.stops.map(stop=>stop.placeId)))];
const rank=id=>createHash('sha256').update(`${kstDay()}:${id}`).digest('hex');
ids.sort((a,b)=>rank(a).localeCompare(rank(b)));
let visited=0, added=0;
for(const id of ids) {
  if(visited>=12)break;
  const p=places.get(id), d=details[id];
  if(!p || !d?.homepage || !/박물관|미술관|전시관|과학관/.test(p.title))continue;
  try { const url=new URL(d.homepage);if(url.protocol!=='https:' || !OFFICIAL_HOSTS.has(url.hostname) || url.pathname==='/')continue; } catch { continue; }
  if(registry.places[id] && Date.now()-Date.parse(registry.places[id].verifiedAt || '')<90*86400000)continue;
  visited++;
  const evidence=await inspectOfficialPlace(p,d);
  if(evidence){registry.places[id]=evidence; added++;}
}
if(added)fs.writeFileSync(path,JSON.stringify(registry,null,2)+'\n');
console.log(JSON.stringify({inspected:visited,verified:added}));
