const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const mod={exports:{}};new Function('exports','module',ts.transpileModule(fs.readFileSync('lib/parkingRules.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(mod.exports,mod);const p=mod.exports;
const row=(patch={})=>({prk_center_id:'12345-11191-00001-00-1',prk_plce_nm:'검증 주차장',prk_plce_adres:'서울특별시 종로구 사직로 1',prk_plce_adres_sido:'서울특별시',prk_plce_entrc_la:'37.57',prk_plce_entrc_lo:'126.98',prk_cmprt_co:'50',...patch});
assert.equal(p.facility(row({prk_plce_entrc_la:''})),null);assert.equal(p.facility(row({prk_plce_adres_sido:'부산광역시'})),null);assert.equal(p.facility(row({prk_plce_entrc_lo:'37',prk_plce_entrc_la:'127'})),null);
assert.equal(p.numberOrMissing(''),undefined);assert.equal(p.numberOrMissing('0'),0);
assert.deepEqual(p.operation({Sunday:{opertn_start_time:'000000',opertn_end_time:'000000'}}).hours,{});
assert.equal(p.operation({Sunday:{opertn_start_time:'000000',opertn_end_time:'240000'}}).hours.Sunday,'00:00–24:00');
const base=p.facility(row());assert.equal(p.nearbyParking([base],{lon:126.98,lat:37.57,area:'서울'}).length,1);assert.equal(p.nearbyParking([base],{lon:129.07,lat:35.18,area:'부산'}).length,0);assert.equal(p.nearbyParking([base],{lon:126.98,lat:37.57,area:'경기'}).length,0);assert.equal(p.nearbyParking([base],{lon:126.98,lat:37.59,area:'서울'}).length,0);
assert.equal(p.mergeParking([row(),row({prk_plce_entrc_la:'37.7'})],[],[]).lots.length,0);
const op={prk_center_id:base.id,basic_info:{parking_chrge_bs_time:'30',parking_chrge_bs_chrge:'1200'}};
assert.equal(p.mergeParking([row()],[op],[]).lots[0].basicWon,1200);
assert.equal(p.mergeParking([row()],[op,{...op,basic_info:{parking_chrge_bs_chrge:'2000'}}],[]).lots[0].basicWon,undefined);
const rt={prk_center_id:base.id,pkfc_Available_ParkingLots_total:'0',pkfc_ParkingLots_total:'50'};
assert.deepEqual(p.realtimeValue([rt],base.id),{available:0,total:50});assert.equal(p.realtimeValue([],base.id),null);assert.equal(p.realtimeValue([{...rt,pkfc_Available_ParkingLots_total:'51'}],base.id),null);assert.equal(p.realtimeValue([rt,{...rt,pkfc_Available_ParkingLots_total:'4'}],base.id),null);assert.equal(p.realtimeValue([rt],'other'),null);
const data=JSON.parse(fs.readFileSync('data/parking.json','utf8'));assert.equal(new Set(data.lots.map(x=>x.id)).size,data.lots.length);assert(data.lots.every(x=>p.validPoint(x.lon,x.lat)&&p.areaName(x.address)===x.area));assert(data.realtimePages.every(x=>x>=1&&x<=3));
for(const [name,file,field] of [['places','places','spots'],['events','events','events']]){const items=JSON.parse(fs.readFileSync('data/'+file+'.json','utf8'))[field];const matches=[];for(const s of items){const lots=p.nearbyParking(data.lots,{lon:Number(s.mapx||s.gpsX),lat:Number(s.mapy||s.gpsY),area:s.area,address:s.addr||s.address});if(lots.length)matches.push({id:s.id,title:s.title,area:s.area,parking:lots[0].name,parkingAddress:lots[0].address,distanceM:Math.round(lots[0].distanceKm*1000)});assert(lots.every(x=>x.area===p.areaName(s.area)&&x.distanceKm<=.7));}const areas=[...new Set(matches.map(x=>x.area))];console.log(JSON.stringify({type:name,matched:matches.length,areas,samples:areas.slice(0,8).map(a=>matches.find(x=>x.area===a))}));}
assert(data.lots.length > 0, 'Collected snapshot must not be empty');
const courses=[...JSON.parse(fs.readFileSync('data/courses.json','utf8')).courses,...JSON.parse(fs.readFileSync('data/courses-auto.json','utf8')).courses];
const {selectCourseStops}=require('../lib/courseSelect.js');
let courseMatches=0;
for(const c of courses){if(c.format==='list')continue;const first=selectCourseStops(c).filter(s=>s.name)[0];if(!first)continue;const lots=p.nearbyParking(data.lots,{lon:Number(first.mapx),lat:Number(first.mapy),area:c.area,address:first.addr});if(lots.length)courseMatches++;assert(lots.every(x=>x.area===p.areaName(c.area)&&x.distanceKm<=.7));}
console.log(JSON.stringify({type:'raw-course-first-stops',matched:courseMatches}));
console.log('PASS: invalid coordinates, region isolation, distance cap, ID conflicts, operation join, ambiguous hours, zero vs missing, realtime absence/conflicts, snapshot integrity');
