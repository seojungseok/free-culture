import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateShape, publicationErrors} from './content.mjs';

const store = JSON.parse(fs.readFileSync('data/weekend-prep.json', 'utf8'));

test('published preparation guides contain no commerce fields', () => {
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

test('a guide missing visit information or images cannot publish', () => {
  const draft = structuredClone(store.articles.find(article => article.sections.length >= 2));
  draft.reviewed = false;
  draft.sections = draft.sections.map(section => ({heading: section.heading, text: ''}));
  assert(publicationErrors(draft, store).includes('미완성 본문'));
  assert(publicationErrors(draft, store).includes('본문 편집 검토 필요'));
});
