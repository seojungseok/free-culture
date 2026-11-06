import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import * as heroPolicy from '../../lib/toss-winter-hero.mjs';
import {freshnessMs} from '../../lib/sharelink-policy.mjs';

const require=createRequire(import.meta.url),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server'),{load}=require('cheerio');
const source=fs.readFileSync(new URL('../../components/TossWinterHero.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const now=Date.parse('2026-11-05T03:00:00Z');
const products=[
 [174755365,'부산포차 꼬치어묵, 400g, 3봉'],
 [2584893075,'농심 육개장사발면 86g 18개 + 김치사발면 86g 6개, 1세트'],
 [288570013,'신선하랑 냉동 삼겹살, 1kg, 2개'],
 [773646201,'맛팜 옛고을 찰순대, 400g, 1개 + 푸짐한 내장 모둠, 500g, 1개'],
 [2317495197,'G7 커피 퓨어블랙 라이트, 0.9g, 110개입, 3개']
].map(([id,name])=>({id,name,image:`https://shopping.toss.im/${id}.jpg`,price:12300,discountRate:20,links:{home:`https://toss.shopping/original-${id}`}}));

function render(items=products,checkedAt=new Date(now).toISOString()){
 const exports={};
 vm.runInNewContext(compiled,{exports,require:specifier=>{
  if(specifier==='next/navigation')return {usePathname:()=>'/'};
  if(specifier==='@/lib/affiliate-track')return {affiliateTrack:()=>{throw new Error('SSR must not emit impressions');}};
  if(specifier==='@/lib/sharelink-policy.mjs')return {freshnessMs};
  if(specifier==='@/lib/toss-winter-hero.mjs')return heroPolicy;
  if(specifier==='./TossFeedProvider')return {useTossFeed:()=>({feed:{version:1,checkedAt,products:items},now})};
  if(specifier.endsWith('.module.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};
  return require(specifier);
 }});
 return load(renderToStaticMarkup(React.createElement(exports.default)));
}

test('each fixed product retains its exact option text, original destination and seller image',()=>{
 for(const product of products){
  const $=render([product]);
  assert.equal($('h2').text(),product.name);
  assert.equal($('a.bannerLink').attr('href'),product.links.home);
  assert.equal($('.productImage').attr('src'),product.image);
  assert.equal($('.offer strong').text(),'12,300원');
  assert.equal($('.priceCaption time').text(),'11.5 12:00 기준');
  assert.equal($('.priceCaption time').attr('datetime'),new Date(now).toISOString());
  assert.match($('.cta').text(),/토스에서 가격·구성 확인/);
  assert.match($('a').attr('rel'),/sponsored/);
  assert.match($('a').attr('aria-label'),/새 창/);
 }
});

test('the fixed five remain individually selectable and retain advertising and AI disclosure',()=>{
 const $=render();
 assert.equal($('.categories button').length,5);
 assert.equal($('.categories button[aria-pressed=true]').length,1);
 for(const product of products)assert.ok($('.categories button').toArray().some(node=>$(node).attr('aria-label')===product.name+' 선택'));
 assert.equal($('button[aria-label="이전 먹거리 상품"]').length,1);
 assert.equal($('button[aria-label="다음 먹거리 상품"]').length,1);
 assert.match($('.eyebrow').text(),/광고/);
 assert.match($('.disclosure').text(),/수수료/);
 assert.match($('.disclosure').text(),/AI 음식 연출/);
 assert.match($('.disclosure').text(),/실제 상품 조리 사진이 아닙니다/);
});

test('discount text is shown only for a finite positive rate no greater than 100',()=>{
 for(const discountRate of [undefined,0,-1,101,NaN,Infinity,'20'])assert.equal(render([{...products[0],discountRate}])('.offer>span').length,0);
 assert.equal(render([{...products[0],discountRate:20}])('.offer>span').text(),'20%');
});

test('expired, sold-out, renamed and stale products render no purchase link',()=>{
 for(const patch of [{endAt:new Date(now).toISOString()},{isSoldOut:true},{name:'다른 구성으로 변경'}])assert.equal(render([{...products[0],...patch}])('a').length,0);
 assert.equal(render(products,new Date(now-freshnessMs).toISOString())('a').length,0);
});
