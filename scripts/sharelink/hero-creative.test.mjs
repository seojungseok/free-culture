import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {homeProductAds,selectHomeProductAds} from '../../lib/home-product-ads.mjs';
import {normalizeAffiliateEvent} from '../../lib/affiliate-events.mjs';
import {freshnessMs} from '../../lib/sharelink-policy.mjs';
const require=createRequire(import.meta.url),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server'),{load}=require('cheerio');
const now=Date.parse('2026-11-19T12:00:00Z');
const products=homeProductAds.map(p=>({id:p.id,name:p.name,price:12900,image:'https://example.com/photo.jpg',links:{home:'https://toss.shopping/example-'+p.id}}));
const feed={checkedAt:new Date(now).toISOString(),products};
const source=fs.readFileSync(new URL('../../components/TossWinterHero.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
function render(index=0,clock=now){
 let hook=0;const exports={};
 vm.runInNewContext(compiled,{exports,require:specifier=>{
  if(specifier==='react')return {...React,useState:initial=>React.useState(hook++===0?index:initial)};
  if(specifier==='next/navigation')return {usePathname:()=>'/'};
  if(specifier==='next/link')return {__esModule:true,default:({children,prefetch,...props})=>React.createElement('a',props,children)};
  if(specifier==='./TossFeedProvider')return {useTossFeed:()=>({feed,now:clock,loading:false})};
  if(specifier==='@/lib/home-product-ads.mjs')return {selectHomeProductAds};
  if(specifier==='@/lib/sharelink-policy.mjs')return {freshnessMs};
  if(specifier==='@/lib/affiliate-track')return {affiliateTrack:()=>{throw Error('SSR must not emit impressions');}};
  if(specifier.endsWith('.module.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};
  return require(specifier);
 }});
 return load(renderToStaticMarkup(React.createElement(exports.default,{collections:[{slug:'winter-drinks',title:'따뜻한 한 잔'}]})));
}
test('five current products have original sponsored links, live prices, real headings and mobile photography',()=>{
 assert.equal(new Set(homeProductAds.map(p=>p.id)).size,5);
 for(const [index,ad] of homeProductAds.entries()){
  const $=render(index);
  assert.equal($('a.bannerLink').attr('href'),products[index].links.home);
  assert.match($('a.bannerLink').attr('rel'),/sponsored/);
  assert.equal($('a.bannerLink').attr('target'),undefined);assert.match($('.cta').text(),/토스에서 보기/);
  assert.equal($('h2').text(),ad.title);assert.ok($('.product').text().includes(ad.option));assert.match($('.offer').text(),/12,900원/);
  for(const src of [$('.scene').attr('src'),$('picture source').attr('srcset')])assert.ok(fs.existsSync(new URL('../../public'+src,import.meta.url)));
  assert.equal($('button[aria-label="다음 상품"]').length,1);assert.match($('.disclosure').text(),/수수료/);
  assert.ok(normalizeAffiliateEvent({event:'affiliate_click',placement:'home_product_hero',page:'/',provider:'toss',productId:ad.id}));
 }
});
test('ended, stale, sold-out or renamed products and replaced destinations never become payable ads',()=>{
 assert.equal(render(0,now+freshnessMs)('a.bannerLink').length,0);
 for(const patch of [{price:0},{isSoldOut:true},{name:'구성 변경'},{links:{home:'https://example.com/wrong'}},{endAt:new Date(now).toISOString()}])
  assert.equal(selectHomeProductAds({...feed,products:[{...products[0],...patch}]},now).length,0);
});
