import test from 'node:test';
import assert from 'node:assert/strict';
import {selectArticleProducts,isShoppingArticle} from '../../lib/article-products.mjs';
import {freshnessMs} from '../../lib/sharelink-policy.mjs';

const now=Date.parse('2026-11-25T13:30:00Z'),checkedAt=new Date(now).toISOString();
const product=(id,name,price,extra={})=>({id,name,price,image:'https://shopping.toss.im/food.jpg',links:{home:'https://toss.shopping/_m/abc'+id},...extra});
test('article products match the subject, prioritize affordable offers and drop expired deals',()=>{
 const products=[product(1,'생수',3480),product(2,'돼지 삼겹살',21900),product(3,'두유',5900,{endAt:new Date(now+5000).toISOString(),discountRate:20}),product(4,'순대',30000),product(5,'호빵',1200,{isSoldOut:true}),product(6,'호떡',500,{links:{home:'https://example.com/wrong'}})];
 const feed={checkedAt,products},select=(t)=>selectArticleProducts(feed,t,'/weekend-prep/example','캠핑 삼겹살');
 assert.deepEqual(select(now).map(p=>p.id),[2,3,1]);
 assert.deepEqual(select(now+5000).map(p=>p.id),[2,1]);
 for(const row of select(now+freshnessMs)){assert.equal(row.price,null);assert.match(row.href,/^https:\/\/toss\.shopping\/_m\//);}
 assert.deepEqual(selectArticleProducts({checkedAt,products:[]},now,'/event/example'),[]);
});
test('only editorial detail URLs receive the article format',()=>{
 for(const path of ['/experiences/family/1','/playgrounds/a','/classes/detail/2','/food/spot/9','/camping/8','/weekend-prep/a','/event/12','/festivals/a','/camping/collections/a','/winter-travel/a','/accessible-travel/a'])assert.ok(isShoppingArticle(path),path);
 for(const path of ['/','/admin/articles','/experiences/region/seoul','/classes/music','/camping/region/seoul'])assert.equal(isShoppingArticle(path),false);
});
