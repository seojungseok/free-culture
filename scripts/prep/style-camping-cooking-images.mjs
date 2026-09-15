import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {readStore, saveStore} from './store.mjs';

const generatedRoot = 'C:/Users/tjwjd/.codex/generated_images/01a0a511-125c-7ba2-b765-b42d10b63735';
const productIds = ['9587833030', '9707359364', '8443644467', '8655440206'];
const scenes = [
  ['camp-griddle-barbecue-party', 'cover', 'exec-0d4c9a17-8448-4d1d-8e5d-b74a1ae1a199.png', '캠핑 삼겹살 바비큐 준비'],
  ['camp-griddle-barbecue-party', 'setup', 'exec-b4090d03-b01e-4eda-b654-051d4a84db52.png', '그리들 조리 자리 점검'],
  ['camp-griddle-barbecue-party', 'packing', 'exec-530331ff-a8c3-4814-901a-0af1d699216b.png', '바비큐 재료와 도구 분리'],
  ['camp-woodfire-snack-checklist', 'cover', 'exec-67340285-ad13-48d8-a1ef-f0b2cdad9f5c.png', '장작 불멍 간식 준비'],
  ['camp-woodfire-snack-checklist', 'tools', 'exec-0eaa922e-b8c3-4210-8459-0107319b6c55.png', '불멍 간식 조리 도구 점검'],
  ['camp-woodfire-snack-checklist', 'ingredients', 'exec-1f51f47d-8920-4ae3-bd07-a2820a00695f.png', '간식과 곁들임 분리 준비'],
];

const store = readStore();
const products = new Map(store.products.map(product => [product.id, product]));
for (const id of productIds) if (!products.get(id)?.verified) throw Error(`검증 상품 누락: ${id}`);

async function download(url) {
  const response = await fetch(url, {redirect: 'follow', signal: AbortSignal.timeout(30000)});
  if (!response.ok) throw Error(`상품 사진 다운로드 실패: ${response.status}`);
  const host = new URL(response.url).hostname;
  if (host !== 'ads-partners.coupang.com' && !host.endsWith('.coupangcdn.com')) throw Error('승인되지 않은 상품 사진 리디렉션');
  return Buffer.from(await response.arrayBuffer());
}

function caption(title) {
  return Buffer.from(`<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg"><rect x="34" y="32" width="440" height="64" rx="18" fill="#17130f" fill-opacity="0.76"/><text x="62" y="74" font-size="28" font-family="Arial, sans-serif" font-weight="700" fill="#ffffff">${title}</text></svg>`);
}

async function productCards() {
  const entries = await Promise.all(productIds.map(async (id, index) => {
    const photo = await sharp(await download(products.get(id).image)).rotate().resize({width: 172, height: 105, fit: 'contain', background: '#ffffff'}).png().toBuffer();
    const card = await sharp({create: {width: 200, height: 130, channels: 4, background: '#fffdf9'}})
      .composite([{input: photo, left: 14, top: 10}]).png().toBuffer();
    return {input: card, left: 40 + index * 290, top: 650};
  }));
  return entries;
}

const cards = await productCards();
for (const [slug, slot, source, title] of scenes) {
  const sourcePath = path.join(generatedRoot, source);
  if (!fs.existsSync(sourcePath)) throw Error(`생성 이미지 누락: ${sourcePath}`);
  const output = `public/prep-images/${slug}-${slot}-v2.webp`;
  await sharp(sourcePath).resize(1200, 800, {fit: 'cover', position: 'centre'})
    .composite([{input: caption(title), left: 0, top: 0}, ...cards])
    .webp({quality: 80}).toFile(output);
}

for (const article of store.articles.filter(item => scenes.some(([slug]) => slug === item.slug))) {
  const imageSlots = [article.cover, ...article.sections.map(section => section.image).filter(Boolean)];
  for (const image of imageSlots) {
    const scene = scenes.find(([slug, slot]) => slug === article.slug && image.url.includes(`-${slot}-`));
    if (!scene) throw Error(`이미지 장면 연결 누락: ${article.slug} ${image.url}`);
    const [, slot, source, title] = scene;
    image.url = `/prep-images/${article.slug}-${slot}-v2.webp`;
    image.alt = `${title} 음식 장면과 하단에 배치한 그리들, 집게, 애호박, 새송이버섯 원본 상품 사진`;
    image.prompt = `AI로 연출한 ${title} 음식 장면(${source}) 위에 실제 등록 상품의 원본 사진 4개를 하단 카드로 배치한 이미지.`;
    image.usageNotice = 'AI 연출 음식 장면입니다. 하단의 원본 상품 사진은 실제 판매 이미지이며, 장면 속 음식은 상품 구성·조리 결과·화기 사용 가능 여부를 보증하지 않습니다.';
    image.referenceProducts = productIds.map(productId => ({productId, imageUrl: products.get(productId).image}));
    image.tags = productIds.map((productId, index) => ({productId, x: 12 + index * 24, y: 89}));
    image.productMatchReviewed = true;
    image.generated = true;
    image.reviewed = true;
  }
  article.updatedAt = new Date().toISOString();
}
saveStore(store, store.version);
console.log(JSON.stringify({styled: scenes.length, articles: 2}));
