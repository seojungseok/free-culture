import test from 'node:test';
import assert from 'node:assert/strict';
import { winterCourseImage } from '../lib/winterCourseImage.mjs';

test('reviewed attributed tourism photographs are allowed, other sources are not', () => {
  const image = {src:'https://tong.visitkorea.or.kr/cms/resource/70/3053670_image2_1.jpg', alt:'미술관 외관', caption:'자료 사진 · 촬영 시기 미상', credit:'한국관광공사', kind:'tour-api', reviewed:true, width:940, height:626};
  assert.equal(winterCourseImage({image}), image);
  assert.equal(winterCourseImage({image:{...image, reviewed:false}}), null);
  assert.equal(winterCourseImage({image:{...image, src:'https://unknown.example/photo.jpg'}}), null);
  assert.equal(winterCourseImage({image:{...image, credit:''}}), null);
});

test('AI image is allowed only as a reviewed local asset with dimensions', () => {
  const image = {src:'/winter-images/example.webp', alt:'겨울 여행 이미지', caption:'연출 이미지', credit:'AI', kind:'ai', reviewed:true, width:1200, height:800};
  assert.equal(winterCourseImage({image}), image);
  assert.equal(winterCourseImage({image:{...image, src:'https://example.com/image.webp'}}), null);
  assert.equal(winterCourseImage({image:{...image, height:0}}), null);
});
