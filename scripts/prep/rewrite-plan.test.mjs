import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const plan=JSON.parse(fs.readFileSync('data/weekend-prep-rewrite-plan.json','utf8'));
test('rewrite has 18 new topics, three per category, and 72 distinct product searches',()=>{
 assert.equal(plan.topics.length,18);
 const old=JSON.parse(fs.readFileSync('data/weekend-prep.json','utf8'));
 assert.equal(new Set(plan.topics.map(t=>t.slug)).size,18);
 assert(plan.topics.every(t=>!old.articles.some(a=>a.slug===t.slug)));
 const groups=new Map();for(const t of plan.topics)groups.set(t.category,(groups.get(t.category)||0)+1);
 assert.equal(groups.size,6);assert([...groups.values()].every(n=>n===3));
 assert.equal(new Set(plan.topics.flatMap(t=>t.keywords)).size,72);
 assert(plan.topics.every(t=>t.keywords.length>=3&&t.keywords.length<=4&&t.scene&&t.focus));
 assert.equal(plan.reuseProductIdsAcrossArticles,false);
 assert.equal(plan.imageCountPerArticle,3);
});
test('planning artifact never fabricates affiliate links or verified product IDs',()=>{
 assert.equal(plan.status,'awaiting-shared-limiter-connection');
 assert(!JSON.stringify(plan).includes('https://'));
 assert(plan.topics.every(t=>!t.affiliateUrl&&!t.productIds&&!t.verified));
});
test('visitor hotspots link to the registered affiliate URL with disclosure and keyboard semantics',()=>{
 const component=fs.readFileSync('components/PrepImage.tsx','utf8');
 assert(component.includes('href={p.affiliateUrl}'));
 assert(component.includes('rel="sponsored noopener"'));
 assert(component.includes('쿠팡 상품페이지 보기 (새 창)'));
 assert(component.includes('href={p.affiliateUrl} target="_blank"'));
 assert(component.includes('left:`${tag.x}%`,top:`${tag.y}%`'));
});
