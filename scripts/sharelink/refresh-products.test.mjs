import test from 'node:test';
import assert from 'node:assert/strict';
import {refreshProducts} from './refresh-products.mjs';
import {selections,channels} from './editorial.mjs';
import {SharelinkError} from './client.mjs';

test('a rejected daily deal never discards newly verified editorial products',async()=>{
 const choice=selections.find(p=>p.reviewedHomeLink);
 const detail={tacaItemId:choice.id,displayName:choice.expectedName,thumbnailUrl:choice.imageUrl,displayPrice:12000,isSoldOut:false};
 const stages=[],published=[];
 const result=await refreshProducts({publisherId:'fixture',previous:{products:[]},
  request:async path=>{
   if(path.startsWith('/products/detail?'))return {items:path.split('=')[1].split(',').includes(String(choice.id))?[detail]:[]};
   if(path==='/sub-tags/create')return {results:channels.map(()=>({status:'ALREADY_EXISTS'}))};
   if(path==='/links')return {shortUrl:'https://toss.shopping/test-channel'};
   throw new SharelinkError(200,'REQUEST_FAILED');
  },
  onVerified:s=>published.push(s),onIssue:stage=>stages.push(stage)
 });
 assert.deepEqual(stages,['daily deal list']);
 for(const snapshot of [...published,result]){
  assert.equal(snapshot.products.length,1);
  assert.equal(snapshot.products[0].links.home,choice.reviewedHomeLink);
  assert.equal(snapshot.products[0].price,detail.displayPrice);
 }
 assert.equal(result.partial,true);
});

test('a failed detail lookup never stamps old prices with a new verification time',async()=>{
 await assert.rejects(refreshProducts({previous:{products:[{id:1,price:1}]},
  request:async()=>{throw new Error('detail unavailable');},
  onVerified:()=>assert.fail('unexpected publish'),onIssue:()=>assert.fail('unexpected recovery')
 }),/detail unavailable/);
});
