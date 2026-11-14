import fs from 'node:fs';
import {matchExperienceVenue,venueName} from '../lib/experienceVenue.mjs';
const read=(file,fallback)=>fs.existsSync('data/'+file)?JSON.parse(fs.readFileSync('data/'+file,'utf8')):fallback;
const rural=read('rural-experiences.json',{records:[]}),science=read('science-experiences.json',{records:[]});
const places=read('places.json',{spots:[]}).spots,details=read('place-details.json',{details:{}}).details;
const extras=read('experience-venue-extras.json',{venues:[]}).venues;
const index=new Map();for(const place of [...places,...extras]){const key=venueName(place.title);if(!index.has(key))index.set(key,[]);index.get(key).push(place);}
const venues={};
const store=(key,place)=>{const info=details[place.id]||place;venues[key]={id:place.id,title:place.title,address:place.addr,phone:place.tel||'',imageSource:place.image||'',overview:info.overview||'',homepage:info.homepage||'',checkedAt:info.overviewCheckedAt||info.checkedAt||'',latitude:Number(place.mapy)||0,longitude:Number(place.mapx)||0,source:'https://api.visitkorea.or.kr/'};};
for(const record of rural.records){const match=matchExperienceVenue(record,index.get(venueName(record.title))||[]);if(match)store('rural/'+record.id,match);}
for(const record of science.records){const candidates=(index.get(venueName(record.institution))||[]).filter(place=>place.area===record.area);if(candidates.length===1)store('science/'+record.id,candidates[0]);}
const file='data/experience-venues.json';fs.writeFileSync(file+'.tmp',JSON.stringify({generatedAt:new Date().toISOString(),venues}));fs.renameSync(file+'.tmp',file);
console.log(JSON.stringify({matchedRural:Object.keys(venues).filter(key=>key.startsWith('rural/')).length,matchedScience:Object.keys(venues).filter(key=>key.startsWith('science/')).length,photos:Object.values(venues).filter(venue=>venue.imageSource).length}));
