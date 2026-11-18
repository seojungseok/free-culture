import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {programmeAvailability,isAvailableProgramme,groupProgrammeSessions,availableSessions} from '../lib/programmeAvailability.mjs';
import {youthRegistrationDates,parseYouthListing,youthPosterUrl} from './lib/youthPhotos.mjs';
const at=new Date('2026-11-16T12:00:00+09:00');
const base={id:'a',title:'도예 체험',area:'서울',city:'종로구',venue:'공방',address:'서울특별시 종로구 체험로 1',institution:'문화센터',phone:'02-123-4567',description:'컵 만들기',audience:'초등학생',tuition:0,start:'2026-11-21',end:'2026-11-21',registrationStart:'2026-11-10',registrationEnd:'2026-11-20',active:true,checkedAt:'2026-11-16T00:00:00Z'};
test('activity end, registration end, explicit closures and unknown dates share one strict rule',()=>{
 assert.equal(programmeAvailability(base,at),'open');
 for(const changed of [{end:'2026-11-15'},{registrationEnd:'2026-11-15'},{title:'도예 체험(마감)'},{publicRegistrationState:'closed'},{active:false},{registrationStart:'',registrationEnd:''},{checkedAt:'2026-11-01T00:00:00Z'}])assert(!isAvailableProgramme({...base,...changed},at));
 assert.equal(programmeAvailability({...base,start:'2026-11-16',end:'2026-11-16',endTime:'11:59'},at),'ended');
 assert.equal(programmeAvailability({...base,registrationEnd:'2026-11-16',registrationEndTime:'11:59'},at),'closed');
 assert.equal(programmeAvailability({...base,registrationStart:'2026-11-17'},at),'upcoming');
 assert(!isAvailableProgramme({...base,registrationStart:'2026-11-17'},at));
 assert(isAvailableProgramme({...base,registrationStart:'2026-11-17'},at,true));
});
test('youth programmes require a recent matching official listing, not only an API activity end date',()=>{
 const item={...base,kind:'family',publicRegistrationState:'dated',listingCheckedAt:'2026-11-16T00:00:00Z'};
 assert(isAvailableProgramme(item,at));
 assert(!isAvailableProgramme({...item,listingCheckedAt:''},at));
 assert(!isAvailableProgramme({...item,publicRegistrationState:'unverified'},at));
 assert(!isAvailableProgramme({...item,listingCheckedAt:'2026-11-13T00:00:00Z'},at));
 assert.equal(programmeAvailability({...item,publicRegistrationState:'open',registrationStart:'',registrationEnd:''},at),'open');
 assert.equal(programmeAvailability({...item,publicRegistrationState:'open',registrationEnd:'2026-11-15'},at),'closed');
});
test('same programme time options become one article while different sites remain separate',t=>{
 t.mock.timers.enable({apis:['Date'],now:at.getTime()});
 const morning={...base,startTime:'10:00',endTime:'11:00',referenceDate:'2026-11-01'},afternoon={...base,id:'b',startTime:'14:00',endTime:'15:00',referenceDate:'2026-11-01'};
 const grouped=groupProgrammeSessions([morning,afternoon],'class');
 assert.equal(grouped.length,1);assert.deepEqual(grouped[0].aliases,['a','b']);assert.equal(availableSessions(grouped[0],at).length,2);
 assert.equal(groupProgrammeSessions([morning,{...afternoon,address:'서울특별시 종로구 다른길 2'}],'class').length,2);
 const old={...morning,id:'old',startTime:'09:00',referenceDate:'2026-06-01'};
 const corrected=groupProgrammeSessions([old,morning,afternoon],'class')[0];assert.equal(corrected.sessions.length,2);assert(corrected.aliases.includes('old'));assert(!corrected.sessions.some(row=>row.startTime==='09:00'));
 const withdrawn={...old,active:false,referenceDate:'2026-11-10'};
 assert.equal(groupProgrammeSessions([withdrawn,morning],'class')[0].sessions[0].id,'a');
 const future={...afternoon,id:'future',start:'2026-12-10',end:'2026-12-10',registrationStart:'2026-12-01',registrationEnd:'2026-12-09',checkedAt:'2026-11-16T01:00:00Z'};
 const combined=groupProgrammeSessions([morning,future],'class')[0];assert.equal(combined.sessions.length,2);assert.equal(combined.registrationStart,morning.registrationStart);
});
test('science activities at different times stay attached to one workshop, without merging ages',()=>{
 const first={...base,kind:'science',title:'우주탐험 교실(40분) / 행성 만들기'},second={...first,id:'b',title:'우주탐험 교실(40분) / 로켓 만들기',period:'[1회] 13:30 [2회] 14:30'};
 const grouped=groupProgrammeSessions([first,second],'science');assert.equal(grouped.length,1);assert.equal(grouped[0].title,'우주탐험 교실(40분)');assert.equal(grouped[0].sessions.length,2);
 assert.equal(groupProgrammeSessions([first,{...second,audience:'고등학생'}],'science').length,2);
});
test('abbreviated recruitment dates and full-resolution attachments are preserved accurately',()=>{
 assert.deepEqual(youthRegistrationDates('2026-12-15 ~ 28'),{start:'2026-12-15',end:'2026-12-28'});
 assert.deepEqual(youthRegistrationDates('2026-11-20 ~ 12-26'),{start:'2026-11-20',end:'2026-12-26'});
 assert.deepEqual(youthRegistrationDates('2026-12-20 ~ 01-05'),{start:'2026-12-20',end:'2027-01-05'});
 assert.deepEqual(youthRegistrationDates('모집마감'),{start:'',end:''});
 assert.deepEqual(youthRegistrationDates('2026-11-20부터'),{start:'2026-11-20',end:''});
 assert(!youthPosterUrl('/youth/cmm/imgView/imgView.do?atchmnflId=00000000000008210961&thumbTySn=10').includes('thumbTySn'));
 const stored=JSON.parse(fs.readFileSync('data/youth-experiences.json','utf8')).records;
 assert.equal(stored.filter(row=>row.active!==false&&row.end>='2026-11-16').every(row=>row.listingCheckedAt),true);
 const closed=stored.find(row=>row.id==='384587');assert.equal(closed.publicRegistrationState,'closed');assert(!isAvailableProgramme({...closed,kind:'family'},at));
});
test('all local theme photos have actual source credit and usable image files',()=>{
 const d=JSON.parse(fs.readFileSync('data/programme-theme-media.json','utf8'));for(const row of Object.values(d.images)){assert(row.kind==='topic');assert(row.photographer&&row.title&&row.source);assert(fs.statSync('public'+row.src).size>1000);assert(row.width>=400&&row.height>=250);}
});
