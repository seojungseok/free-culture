import test from 'node:test';
import assert from 'node:assert/strict';
import {selectTopDeals,topDealGroup,topDealOption,topDealPreparation} from '../../lib/toss-top-deals.mjs';
import {winterCampaignVersion} from '../../data/toss-winter-reviewed.mjs';
import {homeDealGroup} from './home-deals.mjs';

const now=Date.parse('2026-11-05T03:00:00Z');
const deal={id:1,name:'어묵 확인된 하루특가',image:'https://example.com/image',price:1000,discountRate:15,links:{home:'https://toss.shopping/example'},endAt:new Date(now+1000).toISOString()};
const feed={version:1,checkedAt:new Date(now).toISOString(),products:[deal]};

test('confirmed daily deal disappears at its expiry boundary',()=>{
 assert.equal(selectTopDeals(feed,now).length,1);
 assert.equal(selectTopDeals(feed,now+1000).length,0);
});
test('ordinary items and items without an original link are excluded',()=>{
 assert.equal(selectTopDeals({...feed,products:[{...deal,endAt:undefined},{...deal,links:{}},{...deal,links:{home:'https://toss.shopping.example.com/link'}}]},now).length,0);
});
test('discount and food identity are required',()=>{
 assert.equal(selectTopDeals({...feed,products:[{...deal,discountRate:0},{...deal,discountRate:undefined},{...deal,name:'피크닉매트'},{...deal,name:'김치냉장고'},{...deal,name:'커피잔 세트'},{...deal,name:'호빵 찜기'}]},now).length,0);
});
test('겨울 완제품은 허용하되 붕어빵 조리도구와 재료는 제외한다',()=>{
 const products=['단팥 호빵','냉동 붕어빵','붕어빵 기계','붕어빵 팥앙금'].map((name,index)=>({...deal,id:index+1,name}));
 assert.deepEqual(selectTopDeals({...feed,products},now).map(p=>p.name),['단팥 호빵','냉동 붕어빵']);
});

test('라면 용기와 과일 도구는 음식 단어가 있어도 특가에서 제외한다',()=>{
 const products=['맥스 앤 맥스 전자레인지 라면 용기, 1L, 2개','키위 과일칼, 1개','냉동 붕어빵, 1kg, 1개'].map((name,index)=>({...deal,id:index+1,name}));
 assert.deepEqual(selectTopDeals({...feed,products},now).map(p=>p.id),[3]);
});
test('먹거리 특가에는 라면포트와 전기포트를 넣지 않고 실제 라면은 유지한다',()=>{
 const names=['키친플라워 쿠킨 돌핀 멀티 라면포트, 1.8L, 1개','무선 전기포트, 1.5L, 1개','라면 멀티포트, 1개','농심 신라면, 120g, 20개'];
 const products=names.map((name,index)=>({...deal,id:index+1,name}));
 assert.deepEqual(selectTopDeals({...feed,products},now).map(p=>p.id),[4]);
 for(const name of names.slice(0,3))assert.equal(homeDealGroup(name),null);
 assert.equal(homeDealGroup(names[3]),'camp');
});

test('조리가 필요한 음식은 음료 단어가 섞여도 간식·음료로 분류하지 않는다',()=>{
 for(const name of ['우유 떡볶이','냉동 붕어빵','삼겹살','묵은지삼겹살 볶음밥'])assert.equal(topDealGroup({...deal,name}),'meal');
 const kiwi={...deal,name:'제스프리 썬골드키위, 점보, 20과, 3.1kg, 1박스'};
 assert.equal(selectTopDeals({...feed,products:[kiwi]},now).length,1);
 assert.equal(topDealGroup(kiwi),'snack');
 assert.match(topDealPreparation(kiwi),/손질/);
 assert.match(topDealPreparation({...deal,name:'냉동 붕어빵'}),/냉동/);
});

test('종류별 편성은 처음 여섯 상품을 다양하게 하고 나머지도 보존한다',()=>{
 const products=[
  {...deal,id:1,name:'삼겹살, 1kg, 4팩',price:33900},
  {...deal,id:2,name:'토시살, 200g, 2개',price:26900},
  {...deal,id:3,name:'삼겹살, 500g, 3개',price:16380},
  {...deal,id:4,name:'생수, 500ml, 40병',price:5900},
  {...deal,id:5,name:'키위, 20과',price:19900},
  {...deal,id:6,name:'볶음밥, 6개',price:11700},
  {...deal,id:7,name:'시래기국, 4봉',price:14180},
  {...deal,id:8,name:'김치, 4kg',price:15390}
 ];
 const selected=selectTopDeals({...feed,products},now);
 assert.deepEqual(selected.slice(0,6).map(p=>p.id),[4,5,6,7,3,8]);
 assert.equal(selected.length,products.length);
 assert.deepEqual(new Set(selected.map(p=>p.id)),new Set(products.map(p=>p.id)));
});

test('고정 히어로와 겹치는 상품은 홈에서만 제외한다',()=>{
 const hero={...deal,id:2702896485,name:'삼립 단팥호빵, 개별포장, 12입, 1박스'};
 const selectedFeed={...feed,winterCampaignVersion,products:[hero,{...deal,id:2,name:'생수, 500ml, 40병'}]};
 assert.equal(selectTopDeals(selectedFeed,now).some(p=>p.id===hero.id),true);
 assert.equal(selectTopDeals(selectedFeed,now,{isHome:true}).some(p=>p.id===hero.id),false);
});

test('중복·품절은 제외하고 원본 상품명·가격·링크·묶음 수량을 보존한다',()=>{
 const water={...deal,id:2,name:'스파클 생수 무라벨, 500ml, 40병',option:'스파클 생수 무라벨, 500ml, 40병'};
 const original=structuredClone(water);
 const products=[water,water,{...deal,id:3,isSoldOut:true}];
 const selected=selectTopDeals({...feed,products},now);
 assert.equal(selected.length,1);
 assert.strictEqual(selected[0],water);
 assert.deepEqual(water,original);
 assert.equal(topDealOption(water),'500ml, 40병');
});
test('stale feeds and feeds from before the scheduled maintenance remain hidden',()=>{
 assert.equal(selectTopDeals({...feed,checkedAt:new Date(now-6*3600000).toISOString()},now).length,0);
 assert.equal(selectTopDeals({...feed,checkedAt:'2026-10-29T14:00:00Z'},now).length,0);
});
