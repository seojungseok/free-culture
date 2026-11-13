import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {selectSeasonalProducts} from '../../lib/seasonal-shopping.mjs';
import {freshnessMs} from '../../lib/sharelink-policy.mjs';
import {normalizeAffiliateEvent} from '../../lib/affiliate-events.mjs';
const require=createRequire(import.meta.url),catalogue=require('../../data/seasonal-shopping.json');
const now=Date.parse('2026-11-14T03:00:00Z');
const collection=catalogue.collections.find(c=>c.slug==='winter-warmers');
const reviewed=catalogue.reviewedProducts.filter(p=>collection.productIds.includes(p.id)).map(p=>({...p,checkedAt:new Date(now-3600000).toISOString()}));
const feed=(products,checked=now)=>({version:1,seasonalCampaignVersion:1,checkedAt:new Date(checked).toISOString(),products});
test('new collection snapshots bridge only an older collector and preserve original links and photos',()=>{
 const selected=selectSeasonalProducts(feed([],now-7200000),collection,reviewed,now);
 assert.equal(selected.length,3);
 assert.deepEqual(selected.map(p=>p.links.home),reviewed.map(p=>p.links.home));
 assert.deepEqual(selected.map(p=>p.image),reviewed.map(p=>p.image));
 assert.equal(selectSeasonalProducts(feed([],now),collection,reviewed,now).length,0);
 assert.equal(selectSeasonalProducts({...feed([],now),seasonalCampaignVersion:undefined},collection,reviewed,now).length,3);
 assert.equal(selectSeasonalProducts(feed([],now-7200000),collection,reviewed,now+freshnessMs).length,0);
});
test('live price, identity, stock, freshness and original provider destination govern collection cards',()=>{
 const p=reviewed[0];
 for(const patch of [{price:30000},{price:0},{price:Infinity},{isSoldOut:true},{name:'다른 구성'},{image:'https://example.com/other.jpg'},{links:{home:'https://example.com/checkout'}},{endAt:new Date(now).toISOString()}]){
  assert.equal(selectSeasonalProducts(feed([{...p,...patch}]),collection,reviewed,now).length,0);
 }
 assert.equal(selectSeasonalProducts(feed([{...p,price:29999}]),collection,reviewed,now)[0].price,29999);
 const expiredReview=reviewed.map(p=>({...p,checkedAt:new Date(now-freshnessMs).toISOString()}));
 assert.equal(selectSeasonalProducts(feed([p],now-freshnessMs),collection,expiredReview,now).length,0);
 assert.equal(selectSeasonalProducts(feed([p],now+1000),collection,reviewed,now).length,0);
});
test('all four collections use verified sub-30000 products and support circulation within the site',()=>{
 assert.equal(catalogue.collections.length,4);
 for(const c of catalogue.collections){
  assert.ok(c.productIds.length>0);
  assert.ok(c.productIds.every(id=>catalogue.reviewedProducts.some(p=>p.id===id&&p.price>0&&p.price<30000)));
 }
 for(const event of ['collection_click','collection_impression']){
  assert.ok(normalizeAffiliateEvent({event,provider:'toss',placement:'home_seasonal_hero',page:'/'}));
 }
 assert.ok(normalizeAffiliateEvent({event:'affiliate_click',provider:'toss',placement:'seasonal_product_list',page:'/shopping/kimjang',productId:166148191}));
});

test('winter drink launch snapshots stop bridging once collector version 2 records an omission',()=>{
 const drinks=catalogue.collections.find(c=>c.slug==='winter-drinks');
 const snapshots=catalogue.reviewedProducts.filter(p=>drinks.productIds.includes(p.id)).map(p=>({...p,checkedAt:new Date(now-3600000).toISOString()}));
 assert.equal(selectSeasonalProducts(feed([],now),drinks,snapshots,now).length,3);
 assert.equal(selectSeasonalProducts({...feed([],now),seasonalCampaignVersion:2},drinks,snapshots,now).length,0);
 assert.equal(selectSeasonalProducts({...feed([],now),seasonalCampaignVersion:2},collection,reviewed,now).length,0);
});
