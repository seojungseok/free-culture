import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {isEventPublished, liveEventDeadlines, expiredEventForPath, expiredEventSelectors} from '../lib/event-publication.mjs';
import {load as loadHtml} from 'cheerio';

const deadline = Date.parse('2026-11-08T18:00:00+09:00');
const event = {id:'seongdong-hanjang-20261108',title:'성동 한장',seoTitle:'성수 무료 체험 성동 한장',description:'엽서와 책갈피 체험',expiresAt:'2026-11-08T18:00:00+09:00',startDate:'20261108',endDate:'20261108',area:'서울',sigungu:'성동구',address:'서울 성동구 서울숲4길 20-1',place:'어바웃더챕터',priceType:'free',priceLabel:'무료',priceRaw:'무료',priceMin:0,priceMax:0,freeCondition:'',realmName:'체험',genreKey:'festival',imgUrl:'/event-posters/seongdong-hanjang-20261108.webp',gallery:[{src:'/event-posters/venue-without-event-id.webp'}],officialUrl:'https://ujuseon.mandeun.com/hanjang',contents:'공식 프로그램 안내',phone:'',gpsX:'127.043',gpsY:'37.546',featured:true,featuredScore:100,audiences:['kids'],sourceDetail:{status:'verified',title:'주최 측 안내',url:'https://ujuseon.mandeun.com/hanjang',checkedAt:'2026-11-06T13:00:00Z',eventTitle:'성동 한장',eventStartDate:'20261108',eventEndDate:'20261108',facts:[]}};

test('publication closes exactly at 18:00 KST without changing ordinary event URLs',()=>{
  assert.equal(isEventPublished(event,deadline-1),true);
  assert.equal(isEventPublished(event,deadline),false);
  assert.equal(isEventPublished(event,deadline+1),false);
  assert.equal(isEventPublished({endDate:'20200101'},deadline),true);
  assert.equal(isEventPublished({expiresAt:'2026-11-08T18:00:00'},deadline-1),false);
  assert.equal(isEventPublished({expiresAt:'invalid'},deadline-1),false);
});

test('only future verified deadlines need live server rendering and a client timer',()=>{
 const events=[event,{id:'ordinary'},{id:'invalid',expiresAt:'invalid'}];
 assert.deepEqual(liveEventDeadlines(events,deadline-1),[{id:event.id,expiresAt:event.expiresAt}]);
 assert.deepEqual(liveEventDeadlines(events,deadline),[]);
 assert.deepEqual(liveEventDeadlines(events,deadline+1),[]);
});

test('detail, aliases and public images share the removal deadline',()=>{
  for(const pathname of [`/event/${event.id}`,`/event/${event.id}/`,`/festivals/event-${event.id}`,`/kids/c/ev-${event.id}`,event.imgUrl,event.gallery[0].src]){
    assert.equal(expiredEventForPath([event],pathname,deadline-1),undefined);
    assert.equal(expiredEventForPath([event],pathname,deadline),event);
  }
  assert.equal(expiredEventForPath([event],'/event/another',deadline),undefined);
});

test('client hiding removes only expired cards or saved stops, never an unrelated detail article',()=>{
  const html=loadHtml(`<article id="other-detail"><h1>다른 정상 행사</h1><section><article id="expired-card"><a href="/event/${event.id}">종료 행사</a></article><article id="other-card"><a href="/event/another">정상 행사</a></article></section></article><article id="saved-trip"><ol><li id="expired-stop"><a href="/event/${event.id}">종료 일정</a></li><li id="other-stop"><a href="/places/123">계속 보존할 장소</a></li></ol></article>`);
  const hidden=html(expiredEventSelectors([event.id]).join(','));
  assert.equal(hidden.filter('#expired-card').length,1);
  assert.equal(hidden.filter('#expired-stop').length,1);
  for(const id of ['other-detail','other-card','saved-trip','other-stop'])assert.equal(hidden.filter('#'+id).length,0,id);
});

// Load the actual TypeScript modules once, then advance only the clock. This
// catches stale module-level indexes rather than merely testing a fresh import.
function sourceLoader(overrides={}){
  const cache=new Map(),nativeRequire=createRequire(import.meta.url);
  let noStoreCalls=0;
  function load(spec,from=path.join(process.cwd(),'entry.ts')){
    if(Object.hasOwn(overrides,spec))return overrides[spec];
    if(spec==='next/cache')return {unstable_noStore(){noStoreCalls++;}};
    if(!spec.startsWith('.')&&!spec.startsWith('@/'))return nativeRequire(spec);
    const bare=spec.startsWith('@/')?path.join(process.cwd(),spec.slice(2)):path.resolve(path.dirname(from),spec);
    if(bare.endsWith(path.join('data','curated-events.json')))return {generatedAt:'2026-11-06T13:00:00Z',events:[event]};
    const file=[bare,...['.ts','.tsx','.js','.mjs','.json'].map(ext=>bare+ext)].find(candidate=>fs.existsSync(candidate)&&fs.statSync(candidate).isFile());
    if(!file)throw Error('Cannot resolve '+spec+' from '+from);
    if(cache.has(file))return cache.get(file).exports;
    const module={exports:{}};cache.set(file,module);
    if(file.endsWith('.json')){module.exports=JSON.parse(fs.readFileSync(file,'utf8'));return module.exports;}
    const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText;
    vm.runInThisContext(`(function(require,module,exports){${compiled}\n})`,{filename:file})(child=>load(child,file),module,module.exports);
    return module.exports;
  }
  return {load,noStoreCalls:()=>noStoreCalls};
}

test('warm server data, search, nearby, festival and child-course caches drop the event at the deadline',()=>{
  const originalNow=Date.now;
  try{
    Date.now=()=>deadline-1;
    const loader=sourceLoader(),data=loader.load('@/lib/data'),search=loader.load('@/lib/search'),near=loader.load('@/lib/nearData'),nearSearch=loader.load('@/lib/nearSearch'),festivals=loader.load('@/lib/festivals'),kids=loader.load('@/lib/kidCourses');
    assert.equal(data.getEventById(event.id).sourceDetail.title,'주최 측 안내');
    assert.ok(data.getFree().some(item=>item.id===event.id));
    assert.ok(search.search('성동 한장').groups.flatMap(group=>group.items).some(item=>item.id===event.id));
    const nearPool=near.nearbyPool(),query={point:{lat:37.546,lng:127.043},kind:'event',radius:5,offset:0,limit:10000};
    assert.ok(nearSearch.queryNearby(nearPool,query,'20261108').items.some(item=>item.id==='event:'+event.id));
    assert.ok(festivals.getAllFestivals().some(item=>item.id==='event-'+event.id));
    const childBefore=kids.getKidCourses();
    assert.ok(childBefore.some(item=>item.id==='ev-'+event.id),'fixture should exercise the cached child-course branch');
    const beforeCacheCalls=loader.noStoreCalls();
    assert.ok(beforeCacheCalls>0,'pre-deadline readers prevent a response from being cached across expiry');
    Date.now=()=>deadline;
    assert.equal(data.getEventById(event.id),undefined);
    for(const items of [data.getAllEvents(),data.getFree(),data.getByRegion('서울'),data.getWeekend(),data.getFeatured(),data.getByAudience('kids')])assert.ok(!items.some(item=>item.id===event.id));
    assert.ok(!search.search('성동 한장').groups.flatMap(group=>group.items).some(item=>item.id===event.id));
    assert.ok(!nearSearch.queryNearby(nearPool,query,'20261108').items.some(item=>item.id==='event:'+event.id));
    assert.ok(!festivals.getAllFestivals().some(item=>item.id==='event-'+event.id));
    assert.equal(festivals.getFestivalById('event-'+event.id),undefined);
    assert.ok(!kids.getKidCourses().some(item=>item.id==='ev-'+event.id));
    assert.equal(kids.getKidCourse('ev-'+event.id),undefined);
    assert.equal(loader.noStoreCalls(),beforeCacheCalls,'only post-expiry content may resume caching once all deadlines passed');
  }finally{Date.now=originalNow;}
});

test('already expired server records cause no client HEAD requests or route refresh on a new visit',async()=>{
 const original={window:global.window,document:global.document,fetch:global.fetch};
 try{
  let effect,requests=0,refreshes=0;
  const hooks={useEffect:callback=>{effect=callback;},useRef:()=>({current:''}),useState:()=>[[],()=>{}]};
  const loader=sourceLoader({react:hooks,'next/navigation':{usePathname:()=>'/',useRouter:()=>({refresh(){refreshes++;}})}});
  global.window={addEventListener(){},removeEventListener(){},dispatchEvent(){}};
  global.document={addEventListener(){},removeEventListener(){}};
  global.fetch=async()=>{requests++;throw Error('unnecessary request');};
  loader.load('@/components/EventPublicationBoundary').default({deadlines:liveEventDeadlines([event],deadline)});
  const cleanup=effect();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(requests,0);assert.equal(refreshes,0);cleanup();
 }finally{global.window=original.window;global.document=original.document;global.fetch=original.fetch;}
});

test('middleware sends no-store before expiry and 410/noindex for HTML, RSC and image requests after expiry',()=>{
  const originalNow=Date.now;
  try{
    const {middleware}=sourceLoader().load('@/middleware');
    for(const resource of [`/event/${event.id}`,`/event/${event.id}?_rsc=prefetched`,event.imgUrl,event.gallery[0].src,`/_next/image?url=${encodeURIComponent(event.imgUrl)}&w=640&q=75`]){
      const request={nextUrl:new URL(resource,'https://mwohaji.kr')};
      Date.now=()=>deadline-1;
      assert.match(middleware(request).headers.get('cache-control'),/no-store/);
      Date.now=()=>deadline;
      const response=middleware(request);
      assert.equal(response.status,410);
      assert.match(response.headers.get('cache-control'),/no-store/);
      assert.match(response.headers.get('x-robots-tag'),/noindex/);
    }
    assert.equal(middleware({nextUrl:new URL('/event/existing-event','https://mwohaji.kr')}).status,200);
  }finally{Date.now=originalNow;}
});

test('a fast browser clock does not redirect until the server confirms 410',async()=>{
  const original={window:global.window,document:global.document,fetch:global.fetch,setTimeout:global.setTimeout,clearTimeout:global.clearTimeout,now:Date.now};
  try{
    for(const status of [200,410]){
      let effect,redirects=0,refreshes=0,expired=[],delay=0,request;
      const hooks={useEffect:callback=>{effect=callback;},useRef:()=>({current:''}),useState:()=>[[],value=>{expired=typeof value==='function'?value(expired):value;}]};
      const loader=sourceLoader({react:hooks,'next/navigation':{usePathname:()=>'/event/'+event.id,useRouter:()=>({refresh(){refreshes++;}})}});
      global.window={location:{href:'https://mwohaji.kr/event/'+event.id,replace(){redirects++;}},addEventListener(){},removeEventListener(){},dispatchEvent(){}};
      global.document={addEventListener(){},removeEventListener(){}};
      global.setTimeout=(_callback,ms)=>{delay=ms;return 1;};global.clearTimeout=()=>{};
      Date.now=()=>deadline+3600000;
      global.fetch=async(_url,options)=>{request=options;return {status,headers:new Headers({date:new Date(status===200?deadline-3600000:deadline).toUTCString()})};};
      loader.load('@/components/EventPublicationBoundary').default({deadlines:[{id:event.id,expiresAt:event.expiresAt}]});
      const cleanup=effect();
      await new Promise(resolve=>setImmediate(resolve));
      assert.equal(request.method,'HEAD');assert.equal(request.cache,'no-store');
      if(status===200){assert.equal(redirects,0);assert.equal(refreshes,0);assert.deepEqual(expired,[]);assert.ok(delay>0);}
      else assert.equal(redirects,1);
      cleanup();assert.equal(request.signal.aborted,true);
    }
  }finally{global.window=original.window;global.document=original.document;global.fetch=original.fetch;global.setTimeout=original.setTimeout;global.clearTimeout=original.clearTimeout;Date.now=original.now;}
});
