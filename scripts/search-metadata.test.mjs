import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {XMLParser,XMLValidator} from 'fast-xml-parser';
import {placeRouteIds} from './build-place-route-index.mjs';
import {experienceEditorial} from '../lib/programmeEditorial.mjs';

const SITE={name:'주말에 뭐하지?',url:'https://mwohaji.kr'};
const topics={family:{short:'가족·청소년 체험'},science:{short:'과학관 교육·행사'},rural:{short:'농촌·어촌 체험'}};
const experienceHref=item=>`/experiences/${item.kind}/${item.id}`;
function compile(file){
 const source=fs.readFileSync(file,'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const sandbox={exports:{},URL,require:name=>name==='./site'?{SITE}:name==='./experienceData'?{experienceHref,experienceTopics:topics}:name==='./programmeEditorial.mjs'?{experienceEditorial}:(()=>{throw Error(name)})()};
 vm.runInNewContext(compiled,sandbox);return sandbox.exports;
}
const {withSearchMetadata}=compile('lib/searchMetadata.ts');
const {renderExperienceFeed,experienceFeedBody}=compile('lib/experienceFeed.ts');
const json=value=>JSON.parse(JSON.stringify(value));

test('preview defaults use the exact page copy and canonical without changing indexing',()=>{
 const input={title:'서울 과학 체험',description:'초등학생 실험 프로그램과 접수 일정을 확인하세요.',alternates:{canonical:'/experiences/science'},robots:{index:false,follow:true}};
 const result=withSearchMetadata(input);
 assert.equal(result.title,input.title);assert.equal(result.description,input.description);
 assert.deepEqual(json(result.robots),input.robots);assert.equal(result.alternates.canonical,input.alternates.canonical);
 assert.equal(result.openGraph.url,'https://mwohaji.kr/experiences/science');
 assert.equal(result.openGraph.description,input.description);assert.equal(result.twitter.description,input.description);
 assert.equal(result.openGraph.images[0].url,'https://mwohaji.kr/opengraph-image');
 assert.equal(result.alternates.types['application/rss+xml'],'https://mwohaji.kr/rss.xml');
 assert.equal(input.openGraph,undefined);
});
test('real photographs and custom metadata survive normalization',()=>{
 const input={title:'원래 제목',description:'실제 페이지 설명',alternates:{canonical:{url:'/event/1'},languages:{ko:'/event/1'},types:{'application/atom+xml':'/atom'}},openGraph:{type:'article',title:'기존 공유 제목',description:'오래된 설명',images:[{url:'https://official.example/photo.jpg',alt:'행사 공식 사진'}]},twitter:{card:'summary',images:['https://official.example/poster.jpg']}};
 const result=withSearchMetadata(input);
 assert.equal(result.openGraph.type,'article');assert.equal(result.openGraph.title,'기존 공유 제목');
 assert.deepEqual(json(result.openGraph.images),input.openGraph.images);assert.deepEqual(json(result.twitter.images),input.twitter.images);
 assert.equal(result.openGraph.description,input.description);assert.equal(result.twitter.description,input.description);
 assert.equal(result.alternates.types['application/atom+xml'],'/atom');assert.equal(result.alternates.languages.ko,'/event/1');
});
test('a missing canonical is not replaced with the homepage',()=>{
 const input={title:'찾을 수 없습니다',robots:{index:false}};
 assert.equal(withSearchMetadata(input),input);
 const urlResult=withSearchMetadata({alternates:{canonical:new URL('/classes','https://mwohaji.kr')}});
 assert.equal(urlResult.openGraph.url,'https://mwohaji.kr/classes');
});
const sample={id:'test-1',kind:'family',title:'실험 & 만들기 <체험>',area:'서울',city:'종로구',summary:'짧은 소개',content:['첫 번째 실제 활동 내용을 모두 제공합니다.','두 번째 활동 설명 & 준비 안내'],activities:['상세 활동 항목'],programs:[],institution:'공공기관',address:'서울 종로구 1',phone:'02-123-4567',audience:'초등학생',price:'무료',period:'2026-11-20 ~ 2026-11-21',start:'2026-11-20',end:'2026-11-21',registration:'기관에서 확인',facilities:'교실',referenceDate:'2026-11-15',officialUrl:'https://official.example/apply?a=1&b=2',source:'https://data.go.kr/example',checkedAt:'2026-11-15T00:00:00Z',detailCheckedAt:'2026-11-14',venueOverview:'장소에 대한 실제 공개 소개',venueSource:'https://official.example/venue',imageAlt:'공식 사진 & 설명'};
test('RSS is valid XML with full detail and stable internal permalink identifiers',()=>{
 const xml=renderExperienceFeed([sample],new Date('2026-11-15T00:00:00Z'));
 assert.equal(XMLValidator.validate(xml),true);
 const channel=new XMLParser({ignoreAttributes:false}).parse(xml).rss.channel,item=channel.item;
 assert.equal(item.title,experienceEditorial(sample).title);assert.equal(item.link,'https://mwohaji.kr/experiences/family/test-1');
 assert.equal(item.guid['#text'],item.link);assert.equal(item.guid['@_isPermaLink'],'true');
 assert.equal(item.description,item['content:encoded']);
 for(const text of [...sample.content,sample.audience,sample.address,sample.phone])assert(item.description.includes(text.replaceAll('&','&amp;')));
 assert(item.description.includes('https://official.example/apply?a=1&amp;b=2'));
 assert.equal(item.pubDate,undefined);assert(!xml.includes('<pubDate>'));
 assert(!item.description.includes('<img'));
});
test('rural RSS includes every program, seasonal conditions and public source credit',()=>{
 const item={...sample,kind:'rural',programs:['두부 만들기','벼 수확','공예 체험'],content:[],price:'',image:{src:'/experience-images/village.webp'},imageAlt:'체험마을 공식 전경'};
 const body=experienceFeedBody(item);
 for(const program of item.programs)assert(body.includes(program));
 assert(body.includes('수확 시기와 작황'));assert(body.includes('체험별 비용은 공개자료에 미기재'));
 assert(body.includes('한국농어촌공사·한국어촌어항공단'));assert(body.includes('한국관광공사'));
 assert(body.includes('https://mwohaji.kr/experience-images/village.webp'));
});
test('public data containing markup stays text instead of executable markup',()=>{
 const xml=renderExperienceFeed([{...sample,title:'</title><script>alert(1)</script>',content:['<script>alert(2)</script> & 사실']}]);
 assert.equal(XMLValidator.validate(xml),true);assert(!xml.includes('<script>'));
 const item=new XMLParser().parse(xml).rss.channel.item;
 assert(item.description.includes('&lt;script&gt;'));assert(!item.description.includes('<script>'));
});

test('the compact route guard retains all live places and moved restaurant/camping URLs',()=>{
 const places=JSON.parse(fs.readFileSync('data/places.json','utf8'));
 const restaurants=JSON.parse(fs.readFileSync('data/restaurants.json','utf8'));
 const duplicates=JSON.parse(fs.readFileSync('data/camping-dupe-ids.json','utf8'));
 const ids=placeRouteIds(places,restaurants,duplicates),allowed=new Set(ids);
 for(const item of [...places.spots,...restaurants.restaurants])assert(allowed.has(item.id));
 for(const id of Object.keys(duplicates.ids))assert(allowed.has(id));
 assert(!allowed.has('missing-place-for-test'));
 assert.throws(()=>placeRouteIds({spots:[]},restaurants,duplicates),/incomplete route index/);
 const index=JSON.parse(fs.readFileSync('data/place-route-ids.json','utf8'));
 assert.deepEqual(ids,index.ids);
 const live=new Set(places.spots.map(item=>item.id));
 for(const [id,destination] of Object.entries(index.redirects)){
  assert.notEqual(destination,'/places/spot/'+id);
  assert(destination.startsWith('/food/spot/')||destination.startsWith('/camping'));
  if(destination.startsWith('/food/spot/'))assert(!live.has(id));
 }
});
