import fs from 'node:fs';
import assert from 'node:assert/strict';
const file='data/weekend-prep.json';
const store=JSON.parse(fs.readFileSync(file,'utf8'));
const manifest=JSON.parse(fs.readFileSync('data/prep-cover-captions-20260919.json','utf8'));
for(const item of manifest.items){
 const article=store.articles.find(a=>a.cover.url==='/prep-images/'+item.file);
 assert(article, 'Expected original cover '+item.file);
 assert(fs.existsSync('public/prep-images/'+item.output));
 article.cover.url='/prep-images/'+item.output;
 article.cover.prompt += '\nCaption edit: '+item.prompt;
 // Keep the clickable marker on the visible seaweed bowl, above the caption.
 if(item.file==='camp-noodle-lunch-cover-v3.webp'){
  const tag=article.cover.tags.find(t=>t.productId==='9468295724');
  tag.x=69;tag.y=78;
 }
 // Keep the skewer marker outside the caption band.
 if(item.file==='grilled-vegetable-skewers-cover-v3.webp'){
  const tag=article.cover.tags.find(t=>t.productId==='7614412503');
  tag.x=50;tag.y=77;
 }
 article.updatedAt=new Date().toISOString();
}
store.version++;
fs.writeFileSync(file,JSON.stringify(store,null,2)+'\n');
console.log('Applied six visually reviewed caption edits; products and affiliate links unchanged.');
