import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesReviewedProduct} from './reviewed-product.mjs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {winterCampaignVersion as publicRevision} from '../../data/toss-winter-reviewed.mjs';
const choice={id:123,expectedName:'검토한 팥 호빵, 12입',imageUrl:'https://shopping.toss.im/reviewed.jpg'};
const product={tacaItemId:123,displayName:choice.expectedName,thumbnailUrl:choice.imageUrl,mainImageUrls:['https://shopping.toss.im/another-main.jpg'],isSoldOut:false};
test('a reviewed merchant thumbnail is valid even when the first main image differs',()=>assert.equal(matchesReviewedProduct(choice,product),true));
test('a reviewed main image is valid even when the thumbnail differs',()=>assert.equal(matchesReviewedProduct(choice,{...product,thumbnailUrl:'https://shopping.toss.im/another-thumb.jpg',mainImageUrls:[choice.imageUrl]}),true));
test('product identity, reviewed image and availability must all match',()=>{
 for(const patch of [{tacaItemId:124},{displayName:'다른 구성'},{isSoldOut:true},{thumbnailUrl:'https://shopping.toss.im/unreviewed.jpg',mainImageUrls:[]}])assert.equal(matchesReviewedProduct(choice,{...product,...patch}),false);
 assert.equal(matchesReviewedProduct(choice,undefined),false);
});
test('the NAS worker can load its editorial modules with only the sharelink folder mounted',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mwohaji-worker-test-'));
 try{
  await fs.cp(new URL('./',import.meta.url),path.join(dir,'work'),{recursive:true});
  const editorial=await import(pathToFileURL(path.join(dir,'work/editorial.mjs')).href);
  const winter=await import(pathToFileURL(path.join(dir,'work/winter-editorial.mjs')).href);
  assert.equal(winter.winterCampaignVersion,publicRevision);
  assert.equal(winter.winterSelections.length,6);
  assert.ok(winter.winterSelections.every(choice=>editorial.selections.some(p=>p.id===choice.id)));
 }finally{
  if(!path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep))throw new Error('Unsafe test cleanup');
  await fs.rm(dir,{recursive:true,force:true});
 }
});
