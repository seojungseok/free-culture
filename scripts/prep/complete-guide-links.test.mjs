import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {recipeIngredients} from './apply-ingredient-catalog.mjs';
const store=JSON.parse(fs.readFileSync('data/weekend-prep.json','utf8'));
test('every item in every published preparation guide has a reviewed original purchase route',()=>{
 for(const article of store.articles.filter(a=>a.status==='published')){
  const items=[...(article.checklist||[]),...(article.shoppingItems||[])];assert(items.length,'Guide must have an actual item list: '+article.slug);
  for(const item of items){assert.equal(item.affiliate?.reviewed,true,'No missing link: '+article.slug+' / '+item.label);const link=new URL(item.affiliate.url);assert.equal(link.hostname,'link.coupang.com');assert.equal(link.protocol,'https:');if(item.affiliate.image)assert(fs.existsSync('public'+item.affiliate.image));}
 }
});
test('green onion and onion links cover every occurrence rather than one example guide',()=>{
 for(const label of ['대파','양파']){
  const matches=store.articles.flatMap(a=>[...(a.checklist||[]),...(a.shoppingItems||[])]).filter(i=>i.label===label);
  assert(matches.length>=24);assert(matches.every(i=>i.affiliate?.reviewed));
 }
});
test('the original recipe bodies coexist with complete shopping lists, and the age restriction remains',()=>{
 for(const slug of Object.keys(recipeIngredients)){const article=store.articles.find(a=>a.slug===slug);assert(!article.checklist?.length);assert.equal(article.shoppingItems.length,recipeIngredients[slug].length);assert(article.sections.length>=3);}
 const play=store.articles.find(a=>a.slug==='family-park-ring-ball-play');assert.match(play.sections.map(s=>s.text).join(' '),/14세 미만/);assert.match(play.shoppingItems[0].role,/14세 이상/);assert.match(play.shoppingItems[0].affiliate.optionNote,/최소 연령 14세/);
});
