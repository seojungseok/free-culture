import assert from 'node:assert/strict';
import fs from 'node:fs';
import {load} from 'cheerio';

const origin=process.env.TEST_BASE_URL||'http://127.0.0.1:3036';
const events=JSON.parse(fs.readFileSync('data/events.json','utf8')).events;
const archive=JSON.parse(fs.readFileSync('data/events-archive.json','utf8')).events;
const sources=JSON.parse(fs.readFileSync('data/event-source-details.json','utf8')).events;
const today=new Date(Date.now()+9*3600000).toISOString().slice(0,10).replace(/-/g,'');
const selected=[
  events.find(e=>e.id==='405781'),
  ...['exhibition','theater','musical','dance','edu'].map(genre=>events.find(e=>e.genreKey===genre&&e.endDate>=today)),
  events.find(e=>e.endDate>=today&&e.priceType==='unknown'),
  events.find(e=>e.endDate>=today&&e.priceType==='partial_free'),
  archive.find(e=>e.endDate<today),
].filter(Boolean);
const results=[];
for(const event of selected){
  const response=await fetch(`${origin}/event/${event.id}`,{signal:AbortSignal.timeout(60000)});
  assert.equal(response.status,200,event.id);
  const $=load(await response.text());
  assert.equal($('h1').length,1,event.id+' single H1');
  assert.equal($('link[rel="canonical"]').attr('href'),`https://mwohaji.kr/event/${event.id}`);
  const description=$('meta[name="description"]').attr('content');
  assert(description&&description.length<=80,event.id+' compact description');
  assert.equal(description,$('meta[property="og:description"]').attr('content'));
  assert.equal(description,$('meta[name="twitter:description"]').attr('content'));
  const essential=$('#event-essential-info');
  assert(essential.text().includes(event.place),event.id+' essential venue');
  assert(essential.text().includes('관람료')||essential.text().includes('당시 요금'));
  assert.equal(essential.find('[aria-label="토스쇼핑 오늘의 먹거리 하루특가"]').length,0,'Ad must not be inside the right-hand summary');
  assert($('#event-guide').length&&$('#event-questions').length&&$('#event-sources').length);
  const graph=$('script[type="application/ld+json"]').toArray().flatMap(node=>JSON.parse($(node).text()));
  const schema=graph.find(row=>row['@type']==='Event');
  assert.equal(schema.name,event.title);
  assert.equal(schema.url,`https://mwohaji.kr/event/${event.id}`);
  assert(graph.some(row=>row['@type']==='BreadcrumbList'));
  if(event.priceType==='unknown'||event.priceType==='partial_free')assert.equal(schema.offers,undefined);
  if(schema.offers)assert(!('availability' in schema.offers),'No inferred ticket inventory');
  if(event.endDate<today){assert(/noindex/.test($('meta[name="robots"]').attr('content')));assert.equal(schema.offers,undefined);}
  const stored=sources[event.id]?.sourceDetail;
  if(event.id==='405781'){
    assert(essential.text().includes('19:30'));assert(essential.text().includes('만 5세 이상'));
    assert.equal(schema.startDate,'2026-11-17T19:30:00+09:00');
    assert($('#event-programme').text().includes('바흐 작은 푸가'));
    assert(stored?.sources.length>=2,'Example checked against venue and Culture Portal');
  }
  results.push({id:event.id,status:response.status,title:$('title').text(),descriptionLength:description.length,ended:event.endDate<today});
}
for(const path of ['/events','/genre/concert','/genre/exhibition','/free','/cheap','/ending-soon']){
  const response=await fetch(origin+path,{signal:AbortSignal.timeout(60000)});assert.equal(response.status,200,path);
  const $=load(await response.text());assert.equal($('h1').length,1,path);assert($('a[href^="/event/"]').length>0,path+' crawlable event links');
  for(const node of $('a[href^="/event/"]').toArray()){
    const linked=events.find(e=>`/event/${e.id}`===$(node).attr('href'));
    if(linked)assert(linked.endDate>=today,path+' must not recommend an ended event');
  }
  const schemas=$('script[type="application/ld+json"]').toArray();for(const node of schemas)JSON.parse($(node).text());
  results.push({path,status:response.status,eventLinks:$('a[href^="/event/"]').length});
}
const missing=await fetch(origin+'/event/nonexistent-culture-upgrade',{signal:AbortSignal.timeout(60000)});assert.equal(missing.status,404);
fs.mkdirSync('.cache/culture-upgrade-sources',{recursive:true});
fs.writeFileSync('.cache/culture-upgrade-sources/http-results.json',JSON.stringify({origin,checkedAt:new Date().toISOString(),results},null,2));
console.log(JSON.stringify({passed:true,checks:results.length+1,results}));
