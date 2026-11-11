import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateShape, publicationErrors} from './content.mjs';

const store = JSON.parse(fs.readFileSync('data/weekend-prep.json', 'utf8'));

test('published preparation guides retain their current content format', () => {
  validateShape(store);
  for (const article of store.articles) {
    assert(!('productIds' in article));
    assert(!('salesFormat' in article));
    assert(!('shortcutProductId' in article));
    assert(!('tags' in article.cover));
    for (const section of article.sections) assert(!('productIds' in section));
  }
  assert(!('products' in store));
});

test('ingredient affiliate links have reviewed original Coupang URLs and product details', () => {
  let count = 0;
  for (const article of store.articles) for (const item of [...(article.checklist||[]),...(article.shoppingItems||[])]) {
    if (!item.affiliate) continue;
    const product = item.affiliate;
    const url = new URL(product.url);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.hostname, 'link.coupang.com');
    assert(['coupang-api','registered-product'].includes(product.source));
    if(product.source==='registered-product'){
      const source=new URL(product.sourceUrl);assert.equal(source.hostname,'www.coupang.com');assert.match(source.pathname,/^\/vp\/products\/\d+$/);assert(Number.isFinite(Date.parse(product.reviewedAt)));
      if(url.searchParams.has('pageKey'))assert.equal(url.searchParams.get('pageKey'),source.pathname.split('/').at(-1));
    }
    assert.equal(product.reviewed, true);
    assert(product.productName.trim());
    assert(Number.isFinite(Date.parse(product.checkedAt)));
    count++;
  }
  assert(count > 0, 'Expected at least one reviewed ingredient link');
});

test('a guide missing visit information or images cannot publish', () => {
  const draft = structuredClone(store.articles.find(article => article.sections.length >= 2));
  draft.reviewed = false;
  draft.sections = draft.sections.map(section => ({heading: section.heading, text: ''}));
  assert(publicationErrors(draft, store).includes('미완성 본문'));
  assert(publicationErrors(draft, store).includes('본문 편집 검토 필요'));
});
