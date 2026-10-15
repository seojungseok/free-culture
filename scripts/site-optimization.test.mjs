import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeCollectedRecord} from './lib/collectorState.mjs';
import {homeCandidates} from '../lib/home-discovery.mjs';
import {latestContentDate,currentSearchRecord} from '../lib/content-updates.mjs';
import {collectDetails} from './collectPlaceDetails.mjs';
import {collectImages} from './collectPlaceImages.mjs';
const old='2026-08-01T00:00:00.000Z',fixed='2026-10-15T01:00:00.000Z';
test('unchanged facts and blank provider fields do not renew content modification dates',()=>{
 const previous={id:'one',title:'기존 제목',homepage:'https://official.example/',contentUpdatedAt:old};
 const retained=mergeCollectedRecord(previous,{id:'one',title:'기존 제목',homepage:''},fixed);
 assert.equal(retained.contentUpdatedAt,old);assert.equal(retained.homepage,previous.homepage);assert.equal(retained.checkedAt,fixed);
 const changed=mergeCollectedRecord(previous,{title:'수정 제목'},fixed);
 assert.equal(changed.contentUpdatedAt,fixed);assert.equal(changed.id,'one');assert.equal(changed.homepage,previous.homepage);
});
test('detail rechecks preserve lastmod; a changed official URL advances it',async()=>{
 const store={details:{one:{overview:'소개',homepage:'https://old.example/',contentUpdatedAt:old}}};
 const run=homepage=>collectDetails({items:[{id:'one'}],requested:['one'],store,overviews:{},max:1,now:()=>new Date(fixed),pause:async()=>{},fetchDetail:async()=>({overview:'소개',homepage})});
 await run('https://old.example/');assert.equal(store.details.one.contentUpdatedAt,old);
 await run('https://new.example/');assert.equal(store.details.one.contentUpdatedAt,fixed);assert.equal(store.details.one.overview,'소개');
});
test('seeing the same gallery image again is not a content change',async()=>{
 const image={full:'https://photo.example/one.jpg',thumb:'https://photo.example/one.jpg'};
 const store={details:{one:{images:[image],contentUpdatedAt:old}}};
 await collectImages({items:[{id:'one'}],requested:['one'],store,max:1,now:()=>new Date(fixed),pause:async()=>{},fetchImages:async()=>[{originimgurl:image.full}]});
 assert.equal(store.details.one.contentUpdatedAt,old);assert.equal(store.details.one.images.length,1);
});
test('lastmod excludes fabricated dates and does not invent one without evidence',()=>{
 assert.equal(latestContentDate(undefined,'invalid','2099-01-01T00:00:00Z'),undefined);
 assert.equal(latestContentDate(old,fixed)?.toISOString(),fixed);
});
test('ended search records disappear at the KST day boundary without deleting their URL',()=>{
 const doc={url:'/festivals/keep-this-id',endDate:'20261015'};
 assert.equal(currentSearchRecord(doc,'20261015'),true);assert.equal(currentSearchRecord(doc,'20261016'),false);assert.equal(doc.url,'/festivals/keep-this-id');
 assert.equal(currentSearchRecord({url:'/places/spot/one'},'20261016'),true);
});
test('regional filters use explicit family/free data and the actual weekend overlap',()=>{
 const items=[{id:'family',kids:true},{id:'unknown-price',start:'20261017',end:'20261018'},
 {id:'free',free:true,start:'20261017',end:'20261018'},{id:'ended',free:true,start:'20261001',end:'20261014'},
 {id:'future',start:'20261024',end:'20261025'}];
 const weekend={start:'20261017',end:'20261018'},pick=filter=>homeCandidates(items,filter,'20261015',weekend).map(i=>i.id);
 assert.deepEqual(pick('kids'),['family']);assert.deepEqual(pick('free'),['free']);assert.deepEqual(pick('weekend'),['unknown-price','free']);assert(!pick('all').includes('ended'));
 assert.equal(homeCandidates(Array.from({length:40},()=>({})), 'all','20261015',weekend).length,8);
});
