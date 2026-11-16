const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const cache=new Map();
function load(file){
  file=path.resolve(file);
  if(!path.extname(file))file+='.ts';
  if(cache.has(file))return cache.get(file).exports;
  const module={exports:{}};cache.set(file,module);
  const requireLocal=name=>name.startsWith('@/')?load(name.slice(2)):name.startsWith('.')?load(path.join(path.dirname(file),name)):require(name);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  new Function('exports','module','require',code)(module.exports,module,requireLocal);return module.exports;
}
const {cultureGuide,eventStartIso,verifiedEventDetail,publicEventLink}=load('lib/cultureGuide.ts');
const {hasSubstantiveEventInfo}=load('lib/eventQuality.ts');
const event={id:'1',title:'리코더 정기연주회',startDate:'20261117',endDate:'20261117',area:'경기',sigungu:'성남시',place:'성남아트센터 콘서트홀',address:'경기도 성남시 성남대로 808',realmName:'음악/콘서트',genreKey:'concert',priceType:'free',priceRaw:'전석무료',priceLabel:'무료',contents:'',officialUrl:'https://example.org/events/1'};
const detail={status:'verified',title:event.title,url:event.officialUrl,eventTitle:event.title,eventStartDate:event.startDate,eventEndDate:event.endDate,checkedAt:'2026-11-16T12:00:00Z',facts:[{label:'행사시간',value:'19:30'},{label:'관람연령',value:'만 5세 이상'},{label:'소요시간',value:'1시간 20분'}]};
test('only identity and edition matched facts enrich the visible guide',()=>{
  const guide=cultureGuide({...event,sourceDetail:detail});assert.equal(guide.time,'19:30');assert.equal(guide.duration,'1시간 20분');assert.equal(guide.age,'만 5세 이상');
  for(const replacement of [{status:'identity-unconfirmed'},{eventTitle:'다른 공연'},{eventEndDate:'20251117'}]){
    const invalid={...event,sourceDetail:{...detail,...replacement}};assert.equal(verifiedEventDetail(invalid),undefined);assert.equal(cultureGuide(invalid).time,'');
  }
});
test('a single verified session uses Korean time; multiple sessions never invent a starting hour',()=>{
  assert.equal(eventStartIso(event,'19:30'),'2026-11-17T19:30:00+09:00');
  assert.equal(eventStartIso(event,'오후 5:00'),'2026-11-17T17:00:00+09:00');
  assert.equal(eventStartIso(event,'오전 12:30'),'2026-11-17T00:30:00+09:00');
  for(const time of ['', '14:00 / 19:30', '10:00~18:00', '오전 10시'])assert.equal(eventStartIso(event,time),'2026-11-17');
  assert.equal(eventStartIso({...event,endDate:'20261118'},'19:30'),'2026-11-17');
});
test('unknown entry conditions stay unknown, and free admission does not imply booking availability',()=>{
  const guide=cultureGuide({...event,priceType:'unknown',priceRaw:'',priceLabel:'요금 정보 확인 필요'});
  assert(!guide.age);assert(!guide.duration);assert(guide.faq.some(item=>item.answer.includes('확정된 요금 안내가 없습니다')));
  assert(cultureGuide(event).faq.find(item=>item.question.includes('무료')).answer.includes('사전 신청이 필요할 수'));
});
test('genuine independent visit facts can qualify an event while an empty template cannot',()=>{
  assert.equal(hasSubstantiveEventInfo(event),false);
  assert.equal(hasSubstantiveEventInfo({...event,sourceDetail:detail}),true);
  assert.equal(hasSubstantiveEventInfo({...event,addressConflict:true,sourceDetail:detail}),false);
});
test('navigation cannot expose credentials or execute source-provided code',()=>{
  for(const value of ['javascript:alert(1)','https://u:p@example.org/','https://example.org/?access_token=value','http://127.0.0.1/'])assert.equal(publicEventLink(value),'');
  assert.equal(publicEventLink(event.officialUrl),event.officialUrl);
});
test('all current event descriptions remain compact and contain no source markup',()=>{
  const events=JSON.parse(fs.readFileSync('data/events.json','utf8')).events;
  const records=JSON.parse(fs.readFileSync('data/event-source-details.json','utf8')).events;
  for(const row of events){const guide=cultureGuide({...row,sourceDetail:records[row.id]?.sourceDetail});assert(guide.description.length<=80,row.id);assert(!/<\/?(?:script|iframe|div|span|p|br)(?:\s|>)/i.test(guide.description),row.id);assert(!guide.description.includes('undefined'),row.id);}
  assert(cultureGuide({...event,title:'클라리넷 리사이틀 <Sentimental>'}).description.includes('<Sentimental>'));
});
