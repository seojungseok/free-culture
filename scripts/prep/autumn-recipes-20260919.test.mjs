import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {recipeConfigs} from './autumn-recipes-config.mjs';
import {publicationErrors} from './content.mjs';
const store=JSON.parse(fs.readFileSync('data/weekend-prep.json','utf8'));
const recipes=recipeConfigs();
test('ten distinct recipe checklists preserve the previous published catalog',()=>{
 const old=JSON.parse(execFileSync('git',['show','bd8a50d:data/weekend-prep.json'],{encoding:'utf8',maxBuffer:10000000}));
 for(const a of old.articles)assert.deepEqual(store.articles.find(x=>x.slug===a.slug),a);
 for(const p of old.products)assert.deepEqual(store.products.find(x=>x.id===p.id),p);
 assert.equal(recipes.length,10);
 for(const r of recipes){
  const a=store.articles.find(x=>x.slug===`autumn-camping-${r.key}-ingredient-checklist`);
  assert(a);assert(!old.articles.some(x=>x.slug===a.slug));assert.equal(a.status,'published');
  assert(a.title.startsWith(r.dish+' 재료 체크리스트'));assert(a.description.includes(r.dish));
  assert(a.sections[0].text.includes('기본 재료는'));assert(a.sections[0].heading.includes(r.dish+' 재료'));
  assert.deepEqual(publicationErrors(a,store),[]);
  assert.equal([a.cover,...a.sections.map(s=>s.image).filter(Boolean)].length,3);
  assert(a.checklist.length>=10);assert(a.internalLinks.length>=2);
 }
 assert(!store.products.some(p=>p.id==='35160'),'Sold-out corn option must not enter the public catalog');
});
