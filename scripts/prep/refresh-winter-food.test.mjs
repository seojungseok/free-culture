import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {collectWinterFood,storeProductImages,publicFeed} from './refresh-winter-food.mjs';

test('확인 전에는 조회하지 않는다', async () => {
  let calls=0;
  await assert.rejects(collectWinterFood({fetchProduct:async()=>{calls++;}}));
  assert.equal(calls,0);
});
test('API 결과 중 조건에 맞는 원본 링크만 저장하고 실패 시 중단한다', async () => {
  let calls=0;
  const names=['어묵탕 밀키트','부대찌개 밀키트','떡만둣국 밀키트','해물탕 밀키트'];
  const fetchProduct=async (input,options)=>{
    const i=Math.floor(calls++/2);
    if(options?.method==='POST'){
      assert.equal(options.body.coupangUrls.length,1);assert.equal(options.body.subId,'mwohaji');
      const original=options.body.coupangUrls[0], source=new URL(original);const landing=new URL('https://link.coupang.com/re/AFFSDP');landing.searchParams.set('pageKey',String(i+1));landing.searchParams.set('itemId',source.searchParams.get('itemId'));landing.searchParams.set('lptag','AF123');landing.searchParams.set('subid','mwohaji');
      return Response.json({rCode:'0',data:[{originalUrl:original,landingUrl:landing.href,shortenUrl:`https://link.coupang.com/a/test${i}`}]});
    }
    assert.equal(new URL(input).searchParams.get('limit'),'1');
    return Response.json({rCode:'0',data:{productData:[{productId:i+1,productName:names[i],productImage:'https://images.example/product.jpg',productUrl:`https://link.coupang.com/re/AFFSDP?pageKey=${i+1}&itemId=${100+i}&lptag=AF123`} ]}});
  };
  const feed=await collectWinterFood({fetchProduct, enabled:true, clock:()=>new Date('2026-10-30T00:00:00Z')});
  assert.equal(calls,8); assert.equal(feed.products.length,4); assert.equal(feed.products[0].name,names[0]);
  assert.equal(publicFeed(feed).products[0].image,'/api/affiliate/coupang-image/1');
  assert.ok(!JSON.stringify(publicFeed(feed)).includes('images.example/product.jpg'));
  await assert.rejects(collectWinterFood({enabled:true,fetchProduct:async()=>new Response('',{status:429})}));
});

test('잘못된 옵션이나 채널로 발급된 링크는 노출하지 않는다', async () => {
  const fetchProduct=async (input,options)=>{
    if(options?.method==='POST'){
      const original=options.body.coupangUrls[0],landing=new URL('https://link.coupang.com/re/AFFSDP');
      landing.searchParams.set('pageKey','1');landing.searchParams.set('itemId','999');landing.searchParams.set('lptag','AF123');landing.searchParams.set('subid','mwohaji');
      return Response.json({rCode:'0',data:[{originalUrl:original,landingUrl:landing.href,shortenUrl:'https://link.coupang.com/a/test'}]});
    }
    return Response.json({rCode:'0',data:{productData:[{productId:1,productName:'어묵탕 밀키트',productImage:'https://images.example/test.jpg',productUrl:'https://link.coupang.com/re/AFFSDP?pageKey=1&itemId=100&lptag=AF123'}]}});
  };
  await assert.rejects(collectWinterFood({enabled:true,fetchProduct}),/불일치/);
});

test('상품 사진만 압축 저장하고 쇼핑 홈페이지로의 리디렉션은 차단한다',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'coupang-food-test-'));
 try{
  const input=await sharp({create:{width:64,height:64,channels:3,background:'#a84511'}}).png().toBuffer();
  const product={id:'123',image:'https://ads-partners.coupang.com/image/example'};
  await storeProductImages([product],root,async()=>new Response(input,{headers:{'Content-Type':'image/png'}}));
  assert.equal((await sharp(fs.readFileSync(path.join(root,'123.webp'))).metadata()).format,'webp');
  let calls=0;
  await assert.rejects(storeProductImages([product],root,async()=>{calls++;return new Response(null,{status:302,headers:{location:'https://www.coupang.com/vp/products/123'}});}),/허용되지 않은/);
  assert.equal(calls,1);
 } finally {const relative=path.relative(os.tmpdir(),root);if(relative.startsWith('coupang-food-test-')&&!relative.includes(path.sep))fs.rmSync(root,{recursive:true,force:true});}
});
