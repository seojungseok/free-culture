import test from 'node:test';
import assert from 'node:assert/strict';
import {selectWinterTossHero,winterTossCampaign} from '../../lib/toss-winter-hero.mjs';

const now=Date.parse('2026-11-05T03:00:00Z');
const p=(id,name,overrides={})=>({id,name,image:'https://shopping.toss.im/example.jpg',price:12000,discountRate:25,links:{home:'https://toss.shopping/example'},...overrides});
const feed=(products,checkedAt=new Date(now).toISOString())=>({version:1,checkedAt,products});

const fishcake=p(174755365,'부산포차 꼬치어묵, 400g, 3봉');
test('고정 메인은 매일 특가가 바뀌어도 다른 상품으로 교체하지 않는다',()=>{
 const products=[fishcake,p(2584893075,'농심 육개장사발면 86g 18개 + 김치사발면 86g 6개, 1세트'),p(288570013,'신선하랑 냉동 삼겹살, 1kg, 2개'),p(773646201,'맛팜 옛고을 찰순대, 400g, 1개 + 푸짐한 내장 모둠, 500g, 1개'),p(2317495197,'G7 커피 퓨어블랙 라이트, 0.9g, 110개입, 3개'),p(6,'김치만두',{endAt:new Date(now+1000).toISOString()})];
 const selected=selectWinterTossHero(feed(products),now);
 assert.deepEqual(selected.map(x=>x.id),[174755365,2584893075,288570013,773646201,2317495197]);
 assert.ok(selected.every(x=>x.image==='https://shopping.toss.im/example.jpg'));
 assert.equal(winterTossCampaign(selected[0]).label,'어묵');
});
test('만료·품절·오래된 피드와 토스 외 링크를 배너에서 제외한다',()=>{
 const products=[{...fishcake,endAt:new Date(now).toISOString()},{...fishcake,isSoldOut:true},{...fishcake,links:{home:'https://example.com/test'}}];
 assert.equal(selectWinterTossHero(feed(products),now).length,0);
 assert.equal(selectWinterTossHero(feed([fishcake],new Date(now-6*3600000).toISOString()),now).length,0);
});
test('소수 상품이면 검증되지 않은 상품으로 개수를 채우지 않는다',()=>{
 assert.deepEqual(selectWinterTossHero(feed([fishcake,p(2,'김치 냉장고')]),now).map(x=>x.id),[174755365]);
});
