import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {selectSeasonalProducts} from '../../lib/seasonal-shopping.mjs';
const require=createRequire(import.meta.url),React=require('react'),ts=require('typescript');
const {renderToStaticMarkup}=require('react-dom/server'),{load}=require('cheerio');
const catalogue=require('../../data/seasonal-shopping.json');
function component(file,mocks={}){
 const source=fs.readFileSync(new URL('../../components/'+file,import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const exports={};vm.runInNewContext(compiled,{exports,require:name=>{
  if(name in mocks)return mocks[name];
  if(name==='next/link')return {__esModule:true,default:({children,prefetch,...props})=>React.createElement('a',props,children)};
  if(name==='@/data/seasonal-shopping.json')return catalogue;
  if(name==='@/lib/seasonal-shopping.mjs')return {selectSeasonalProducts};
  if(name==='@/lib/affiliate-track')return {affiliateTrack:()=>{}};
  if(name.endsWith('.module.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};
  return require(name);
 }});return exports.default;
}
test('verified shopping cards exist in the first HTML while the shared client refresh is still loading',()=>{
 const now=Date.now(),collection=catalogue.collections.find(c=>c.slug==='winter-drinks');
 const initialFeed={version:1,seasonalCampaignVersion:2,checkedAt:new Date(now).toISOString(),products:catalogue.reviewedProducts};
 const Component=component('SeasonalShopping.tsx',{'./TossFeedProvider':{useTossFeed:()=>({feed:{version:1,checkedAt:'',products:[]},now:0,loading:true})}});
 const $=load(renderToStaticMarkup(React.createElement(Component,{collection,initialFeed,initialTime:now})));
 assert.equal($('article').length,4);
 assert.doesNotMatch($('.count').text(),/불러오고/);
 for(const id of collection.productIds)assert.equal($('article#product-'+id+' a').attr('href'),catalogue.reviewedProducts.find(p=>p.id===id).links.home);
});
test('a newer authoritative empty feed removes old server cards during client refresh',()=>{
 const now=Date.now(),collection=catalogue.collections.find(c=>c.slug==='winter-drinks');
 const initialFeed={version:1,seasonalCampaignVersion:2,checkedAt:new Date(now).toISOString(),products:catalogue.reviewedProducts};
 const Component=component('SeasonalShopping.tsx',{'./TossFeedProvider':{useTossFeed:()=>({feed:{...initialFeed,checkedAt:new Date(now+60000).toISOString(),products:[]},now:now+60000,loading:false})}});
 const $=load(renderToStaticMarkup(React.createElement(Component,{collection,initialFeed,initialTime:now})));
 assert.equal($('article').length,0);
});
test('client refresh recovers when the server initially had no readable feed',()=>{
 const now=Date.now(),collection=catalogue.collections.find(c=>c.slug==='winter-drinks');
 const feed={version:1,seasonalCampaignVersion:2,checkedAt:new Date(now).toISOString(),products:catalogue.reviewedProducts};
 const Component=component('SeasonalShopping.tsx',{'./TossFeedProvider':{useTossFeed:()=>({feed,now,loading:false})}});
 const $=load(renderToStaticMarkup(React.createElement(Component,{collection,initialFeed:{version:1,checkedAt:'',products:[]},initialTime:now})));
 assert.equal($('article').length,4);
});
test('menu prefetch waits for mouse or keyboard intent and does not run for touch hover',()=>{
 const requested=[],Component=component('IntentLink.tsx',{'next/navigation':{useRouter:()=>({prefetch:url=>requested.push(url)})}});
 const element=Component({href:'/winter-travel',children:'겨울여행'});
 assert.equal(element.props.prefetch,false);assert.equal(requested.length,0);
 element.props.onPointerEnter({pointerType:'touch'});assert.equal(requested.length,0);
 element.props.onPointerEnter({pointerType:'mouse'});element.props.onFocus({});
 assert.deepEqual(requested,['/winter-travel','/winter-travel']);
});
test('a slow font stylesheet stays nonblocking until its load event',()=>{
 const element={sheet:null,media:'print'};
 const Component=component('DeferredFonts.tsx',{react:{...React,useRef:()=>({current:element}),useEffect:fn=>fn()}});
 const tree=Component();assert.equal(element.media,'print');
 tree.props.children[0].props.onLoad({currentTarget:element});assert.equal(element.media,'all');
 element.sheet={};element.media='print';Component();assert.equal(element.media,'all');
});
