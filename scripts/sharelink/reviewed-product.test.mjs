import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesReviewedProduct} from './reviewed-product.mjs';
const choice={id:123,expectedName:'검토한 팥 호빵, 12입',imageUrl:'https://shopping.toss.im/reviewed.jpg'};
const product={tacaItemId:123,displayName:choice.expectedName,thumbnailUrl:choice.imageUrl,mainImageUrls:['https://shopping.toss.im/another-main.jpg'],isSoldOut:false};
test('a reviewed merchant thumbnail is valid even when the first main image differs',()=>assert.equal(matchesReviewedProduct(choice,product),true));
test('a reviewed main image is valid even when the thumbnail differs',()=>assert.equal(matchesReviewedProduct(choice,{...product,thumbnailUrl:'https://shopping.toss.im/another-thumb.jpg',mainImageUrls:[choice.imageUrl]}),true));
test('product identity, reviewed image and availability must all match',()=>{
 for(const patch of [{tacaItemId:124},{displayName:'다른 구성'},{isSoldOut:true},{thumbnailUrl:'https://shopping.toss.im/unreviewed.jpg',mainImageUrls:[]}])assert.equal(matchesReviewedProduct(choice,{...product,...patch}),false);
 assert.equal(matchesReviewedProduct(choice,undefined),false);
});
