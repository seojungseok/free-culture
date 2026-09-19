import fs from 'node:fs';
import assert from 'node:assert/strict';
const file='data/weekend-prep.json';
const store=JSON.parse(fs.readFileSync(file,'utf8'));
const intros=JSON.parse(fs.readFileSync('data/prep-cooking-intros-20260919.json','utf8'));
assert.equal(Object.keys(intros).length,23);
for(const [slug,introduction] of Object.entries(intros)){
 const article=store.articles.find(a=>a.slug===slug);
 assert.equal(article?.salesFormat,'food-checklist');
 article.introduction=introduction;
 article.updatedAt=new Date().toISOString();
}
store.version++;
fs.writeFileSync(file,JSON.stringify(store,null,2)+'\n');
console.log('Added 23 dish-specific introductions; photos, products, links and existing body unchanged.');
