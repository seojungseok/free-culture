#!/usr/bin/env node
// Read-only rendered-page audit. Never follows affiliate destinations or calls product APIs.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {load} from 'cheerio';

const base = new URL(process.argv[2] || 'http://localhost:3186');
assert(['localhost', '127.0.0.1', 'mwohaji.kr', 'www.mwohaji.kr'].includes(base.hostname));
const store = JSON.parse(fs.readFileSync('data/weekend-prep.json', 'utf8'));
let pages = 0, destinations = 0, imageChecks = 0;
for (const article of store.articles.filter(a => a.status === 'published')) {
  const route = '/weekend-prep/' + article.slug;
  const response = await fetch(new URL(route, base));
  assert.equal(response.status, 200, 'Guide must render: ' + article.slug);
  const html = await response.text(), $ = load(html);
  assert.equal($('h1').length, 1, 'Exactly one main heading');
  assert.equal($('h1').text(), article.title, 'Heading preserves original title');
  assert.equal($('meta[name=description]').attr('content'), article.description);
  const canonical = 'https://mwohaji.kr' + route;
  assert.equal($('link[rel=canonical]').attr('href'), canonical);
  const schemas = $('script[type="application/ld+json"]').toArray().flatMap(node => JSON.parse($(node).text()));
  const schema = schemas.find(value => value['@type'] === 'Article');
  const breadcrumb = schemas.find(value => value['@type'] === 'BreadcrumbList');
  assert(schema && breadcrumb, 'Article and breadcrumb must be present');
  assert.equal(schema.headline, article.title);
  assert.equal(schema.mainEntityOfPage['@id'], canonical);
  assert(Number.isFinite(Date.parse(schema.datePublished)) && Number.isFinite(Date.parse(schema.dateModified)));
  assert.equal(breadcrumb.itemListElement.at(-1).item, canonical);
  assert.equal(breadcrumb.itemListElement.at(-1).name, article.title);
  assert.equal($('meta[name="google-adsense-account"],script[src*="adsbygoogle"]').length, 0);
  const links = $('a[data-affiliate-provider=coupang]').toArray();
  for (const item of article.checklist || []) {
    if (!item.affiliate?.reviewed) continue;
    const matching = links.filter(node => $(node).attr('href') === item.affiliate.url);
    assert(matching.length > 0, 'Reviewed original destination must render without rewriting');
    assert(matching.every(node => /sponsored/.test($(node).attr('rel')) && $(node).attr('target') === '_blank'));
    destinations++;
  }
  if (article.checklist?.length) {
    assert($('.prep-tag').length > 0, 'Preparation buttons must exist');
    assert($('a[href="#prep-checklist"]').length > 0, 'Ingredient shortcut must exist');
    assert(html.indexOf('id="prep-checklist"') < html.indexOf('id="prep-cooking"'), 'Ingredients precede cooking');
  }
  if (article.slug === 'autumn-flower-crab-soup-ingredient-checklist') {
    assert($('.prep-tag').first().text().includes('꽃게'), 'Crab is first photo preparation button');
    assert($('.prep-essential .prep-quantity').text().includes('300~400g'));
    assert($('.prep-essential a[data-affiliate-placement=prep_checklist]').length === 1, 'Crab has a reviewed purchase route');
  }
  pages++;
}
for (const file of fs.readdirSync('public/prep-products').filter(name => name.endsWith('.webp'))) {
  const response = await fetch(new URL('/prep-products/' + file, base));
  assert.equal(response.status, 200);
  assert(response.headers.get('content-type')?.includes('image/webp'));
  imageChecks++;
}
const ads = await fetch(new URL('/ads.txt', base));
assert.equal(ads.status, 200);
assert(!/google\.com,|pub-\d/.test(await ads.text()));
const sitemap = await fetch(new URL('/sitemap.xml', base));
assert.equal(sitemap.status, 200);
const sitemapBody = await sitemap.text();
assert(/weekend-prep/.test(sitemapBody), 'Preparation sitemap must remain discoverable');
console.log(JSON.stringify({passed: true, pages, reviewedDestinations: destinations, productImages: imageChecks, articleAndBreadcrumb: true, adsenseRemoved: true, affiliateDestinationsFollowed: 0}));
