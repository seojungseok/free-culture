import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server'),{load}=require('cheerio');
const catalogue=require('../../data/seasonal-shopping.json');
const source=fs.readFileSync(new URL('../../components/TossWinterHero.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
function render(index=0){
 let hook=0;
 const exports={};
 vm.runInNewContext(compiled,{exports,require:specifier=>{
  if(specifier==='react')return {...React,useState:initial=>React.useState(hook++===0?index:initial)};
  if(specifier==='next/navigation')return {usePathname:()=>'/'};
  if(specifier==='next/link')return {__esModule:true,default:({children,prefetch,...props})=>React.createElement('a',props,children)};
  if(specifier==='@/data/seasonal-shopping.json')return catalogue;
  if(specifier==='@/lib/affiliate-track')return {affiliateTrack:()=>{throw Error('SSR must not emit impressions');}};
  if(specifier.endsWith('.module.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};
  return require(specifier);
 }});
 return load(renderToStaticMarkup(React.createElement(exports.default,{campaigns:catalogue.campaigns,collections:catalogue.collections.map(({slug,title})=>({slug,title}))})));
}
test('five photographic campaigns lead to their internal published collections, including winter drinks',()=>{
 assert.equal(catalogue.campaigns.length,5);
 assert.equal(catalogue.campaigns[0].collection,'winter-warmers');
 assert.ok(catalogue.campaigns.some(c=>c.collection==='winter-drinks'));
 for(const [index,campaign] of catalogue.campaigns.entries()){
  const $=render(index);
  assert.equal($('a.bannerLink').attr('href'),campaign.href);
  assert.ok(catalogue.collections.some(c=>campaign.href.split('#')[0]==='/shopping/'+c.slug));
  assert.equal($('a.bannerLink').attr('target'),undefined);
  assert.equal($('.scene').attr('src'),campaign.art);
  assert.equal($('picture source').attr('srcset'),campaign.artMobile);
  assert.equal(Number($('.scene').attr('width'))/Number($('.scene').attr('height')),5.5);
  assert.ok(fs.existsSync(new URL('../../public'+campaign.art,import.meta.url)));
  assert.ok(fs.existsSync(new URL('../../public'+campaign.artMobile,import.meta.url)));
  assert.equal($('h2').text(),campaign.title);
  assert.equal($('.copy,.offer,.cta').length,0);
 }
});
test('navigation and clear advertising disclosure remain available without a side description panel',()=>{
 const $=render();
 assert.match($('.position').text(),/1\s*\/\s*5/);
 assert.equal($('button[aria-label="이전 기획전"]').length,1);
 assert.equal($('button[aria-label="다음 기획전"]').length,1);
 assert.equal($('.collectionLinks a').length,4);
 assert.match($('.disclosure').text(),/AI 연출/);
 assert.match($('.disclosure').text(),/수수료/);
});
