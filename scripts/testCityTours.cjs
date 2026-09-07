const assert=require('node:assert/strict');
const fs=require('node:fs');
const db=require('../data/city-tour-articles.json');
const places=new Map(require('../data/places.json').spots.map(p=>[p.id,p]));
const foods=new Map(require('../data/restaurants.json').restaurants.map(p=>[p.id,p]));
assert(db.articles.length>0);
assert.equal(new Set(db.articles.map(a=>a.id)).size,db.articles.length);
for(const a of db.articles){
 assert(a.reviewed&&a.model==='gpt-5.6-luna');
 assert(/^[a-f0-9]{14}$/.test(a.id));
 assert(a.title.length<=90&&a.description.length<=180);
 assert(a.sections.length>=4&&a.sections.every(s=>s.paragraphs.every(p=>typeof p==='string')));
 assert(!/[<>]/.test(JSON.stringify([a.title,a.description,a.intro,a.sections])));
 assert(a.raw['데이터기준일자']&&Number.isFinite(Date.parse(a.publishedAt)));
 for(const [links,pool,prefix] of [[a.related,places,'/places/spot/'],[a.foodLinks,foods,'/food/spot/']])for(const l of links){
  assert(pool.has(l.id));assert.equal(l.href,prefix+l.id);assert.equal(l.title,pool.get(l.id).title);assert.equal(l.image,pool.get(l.id).image);
 }
 if(a.image)assert(a.related.some(p=>p.image===a.image&&p.title===a.imageTitle));
}
const days=new Map();for(const a of db.articles)days.set(a.publishedDay,(days.get(a.publishedDay)||0)+1);
for(const [day,count] of days)assert(count<=(day===db.articles[0].publishedDay?20:10));
assert(fs.readFileSync('scripts/generateCityTours.mjs','utf8').includes("const model='gpt-5.6-luna'"));
console.log('PASS: '+db.articles.length+' city articles, unique URLs, model, review, internal links, matched images, daily caps');
