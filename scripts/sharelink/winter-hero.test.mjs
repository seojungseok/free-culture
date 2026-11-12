import test from 'node:test';
import assert from 'node:assert/strict';
import {selectWinterTossHero,winterTossCampaign} from '../../lib/toss-winter-hero.mjs';
import {reviewedWinterTossFeed,winterTossCampaigns,winterCampaignVersion} from '../../data/toss-winter-reviewed.mjs';
import {freshnessMs} from '../../lib/sharelink-policy.mjs';

const now=Date.parse('2026-11-05T03:00:00Z');
const p=(id,name,overrides={})=>({id,name,image:'https://shopping.toss.im/example.jpg',price:12000,discountRate:25,links:{home:'https://toss.shopping/example'},...overrides});
const feed=(products,checkedAt=new Date(now).toISOString())=>({version:1,winterCampaignVersion,checkedAt,products});
const products=winterTossCampaigns.map(c=>p(c.id,c.name));
const hoppang=products[0];

test('the fixed winter campaign contains the six reviewed food products, without substituting daily deals',()=>{
 const selected=selectWinterTossHero(feed([...products,p(6,'김치만두')]),now);
 assert.deepEqual(selected.map(x=>x.id),[2702896485,524308317,3483345,2181746213,1029151217,123678795]);
 assert.ok(selected.every(x=>x.image==='https://shopping.toss.im/example.jpg'));
 assert.ok(selected.every(x=>winterTossCampaign(x)?.art?.endsWith('-20261112-v5.webp')));
 assert.equal(winterTossCampaign(selected[0]).label,'호빵');
});
test('expired, sold-out, renamed, stale and off-site products are excluded',()=>{
 for(const patch of [{endAt:new Date(now).toISOString()},{isSoldOut:true},{name:'다른 구성'},{links:{home:'https://example.com/test'}}]){
  assert.equal(selectWinterTossHero(feed([{...hoppang,...patch}]),now).length,0);
 }
 assert.equal(selectWinterTossHero(feed([hoppang],new Date(now-freshnessMs).toISOString()),now).length,0);
});
test('an authoritative collector omission does not resurrect a launch product',()=>{
 const time=Date.parse(reviewedWinterTossFeed.checkedAt)+3600000;
 const updated=feed([{...hoppang,price:9900}],new Date(time).toISOString());
 assert.deepEqual(selectWinterTossHero(updated,time).map(x=>x.id),[hoppang.id]);
 assert.equal(selectWinterTossHero(updated,time)[0].price,9900);
 assert.equal(selectWinterTossHero(feed([],new Date(time).toISOString()),time).length,0);
});
test('the dated launch snapshot bridges only the old collector and expires without extending its timestamp',()=>{
 const time=Math.max(...reviewedWinterTossFeed.products.map(p=>Date.parse(p.verifiedAt)))+1000;
 const oldFeed={version:1,checkedAt:new Date(time).toISOString(),products:[]};
 const selected=selectWinterTossHero(oldFeed,time);
 assert.equal(selected.length,6);
 assert.equal(selected[0].links.home,reviewedWinterTossFeed.products[0].links.home);
 assert.equal(selected[0].verifiedAt,reviewedWinterTossFeed.products[0].verifiedAt);
 assert.equal(selectWinterTossHero(oldFeed,Date.parse(reviewedWinterTossFeed.checkedAt)+freshnessMs).length,0);
});
