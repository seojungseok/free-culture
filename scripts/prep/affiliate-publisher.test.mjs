import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {execFileSync} from 'node:child_process';
import {normalizeAffiliateEvent} from '../../lib/affiliate-events.mjs';
import {reviewIngredients} from './review-ingredient-products.mjs';

const source=fs.readFileSync('lib/prep-affiliate.ts','utf8');
const sandbox={exports:{},URL,Date};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,sandbox);
const {reviewedPrepAffiliate,prepProductId,photoGuideItems,prepGuideItems}=sandbox.exports;
const store=JSON.parse(fs.readFileSync('data/weekend-prep.json','utf8'));
const original=JSON.parse(execFileSync('git',['show','7961f6cf0fc89afaba8c6c9f00a3f8531fa9619b:data/weekend-prep.json'],{encoding:'utf8'}));
const sample={id:'test',label:'확인용 재료',role:'테스트',group:'main',affiliate:{reviewed:true,source:'coupang-api',productName:'확인용 상품',checkedAt:'2026-11-07T00:00:00Z',url:'https://link.coupang.com/re/AFFSDP?pageKey=123&itemId=99&lptag=AF123&token=synthetic'}};

test('all original article URLs, publication states, text and affiliate destinations are preserved',()=>{
 assert.equal(store.articles.length,original.articles.length);
 for(const before of original.articles){
  const after=store.articles.find(a=>a.slug===before.slug);
  const expected=structuredClone(before);
  const copyLog=['data/prep-copy-edits-20261111.json','data/prep-copy-edits-20261114.json'].flatMap(file=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[]);
  for(const edit of copyLog.filter(edit=>edit.slug===before.slug)){
   assert(/^(description|cover\.alt|sections\.\d+\.(text|image|image\.alt)|checklist\.\d+\.label)$/.test(edit.path),'Only explicitly reviewed copy or same-article preparation images may change');
   const parts=edit.path.split('.');let target=expected;for(const key of parts.slice(0,-1))target=target[key];
   assert(target[parts.at(-1)]===edit.before,'Copy review must match the original text');target[parts.at(-1)]=edit.after;
  }
  assert(after,'Existing URL must remain');
  for(const field of ['title','description','status','publishAt','sections','internalLinks','cover'])assert(JSON.stringify(after[field])===JSON.stringify(expected[field]),'Existing article content and approved copy edits must remain: '+field);
  for(const item of before.checklist||[])if(item.affiliate){const next=after.checklist.find(v=>v.id===item.id);assert(next?.affiliate?.url===item.affiliate.url,'Original affiliate destination must remain byte-for-byte');}
 }
});

test('unreviewed and malformed destinations cannot become purchase buttons',()=>{
 assert(reviewedPrepAffiliate(sample));
 assert.equal(prepProductId(sample.affiliate.url),123);
 for(const patch of [{reviewed:false},{reviewed:'yes'},{source:'guessed'},{checkedAt:'unknown'},{productName:123},{url:'https://link.coupang.com.evil.invalid/x'},{url:'http://link.coupang.com/x'},{url:'https://user:pass@link.coupang.com/x'}])assert.equal(reviewedPrepAffiliate({...sample,affiliate:{...sample.affiliate,...patch}}),undefined);
 for(const url of ['https://link.coupang.com/a/short','https://link.coupang.com/?pageKey=-1','https://link.coupang.com/?pageKey=9007199254740992'])assert.equal(prepProductId(url),undefined);
});

test('crab has a reviewed product and remains the first, required ingredient',()=>{
 const a=store.articles.find(v=>v.slug==='autumn-flower-crab-soup-ingredient-checklist');
 const crab=a.checklist.find(i=>i.id==='crab');
 assert(crab.required);assert.match(crab.quantity,/300~400g/);
 assert.equal(prepProductId(reviewedPrepAffiliate(crab).url),9075185730);
 assert(fs.existsSync('public'+crab.affiliate.image));
 assert.match(crab.affiliate.optionNote,/450g/);
 assert.equal(photoGuideItems(a.checklist)[0].id,'crab');
 assert(photoGuideItems(a.checklist,true).every(i=>i.group==='common'));
 const recipe=store.articles.find(v=>v.slug==='camp-jeyuk-bokkeum');
 assert(prepGuideItems(recipe,store.articles).some(item=>item.label==='제육용 돼지고기'));
});

test('all preparation positions use the existing privacy-minimized receiver contract',()=>{
 for(const placement of ['prep_checklist','prep_image','prep_product_list']){
  const event=normalizeAffiliateEvent({event:'affiliate_click',provider:'coupang',placement,page:'/weekend-prep/test',productId:123,destination:sample.affiliate.url,email:'do-not-store'});
  assert.equal(event.placement,placement);assert.equal(event.productId,123);
  assert(!('destination' in event));assert(!('email' in event));
 }
});

test('ingredient collection is opt-in, single-product, paced, and fail-closed',async()=>{
 let calls=0,pauses=0;
 const fake=async url=>{calls++;assert.equal(new URL(url).searchParams.get('limit'),'1');return Response.json({rCode:'0',data:{productData:[]}});};
 await assert.rejects(reviewIngredients({fetchProduct:fake}));assert.equal(calls,0);
 const result=await reviewIngredients({enabled:true,fetchProduct:fake,sleep:async ms=>{assert(ms>=7100);pauses++;}});
 assert.equal(calls,8);assert.equal(pauses,7);assert.equal(result.candidates.length,0);
 calls=0;await assert.rejects(reviewIngredients({enabled:true,fetchProduct:async()=>{calls++;return new Response(null,{status:429});}}));assert.equal(calls,1);
});
