import fs from 'node:fs';
import sharp from 'sharp';
import {readStore, saveStore} from './store.mjs';

const store = readStore();
const now = new Date().toISOString();
const productIds = ['9587833030', '9707359364', '8443644467', '8655440206'];
const productById = new Map(store.products.map(product => [product.id, product]));
for (const id of productIds) if (!productById.get(id)?.verified) throw Error(`검증 상품 누락: ${id}`);

const refs = ids => ids.map(productId => ({productId, imageUrl: productById.get(productId).image}));
const tags = [[18, 36], [76, 36], [18, 76], [76, 76]];
const image = (slug, slot, title, palette) => ({
  url: `/prep-images/${slug}-${slot}-v1.webp`, width: 1200, height: 800,
  alt: `${title}에 필요한 그리들, 집게, 애호박, 새송이버섯을 원본 상품 사진으로 나눠 놓은 안내 이미지`,
  generated: true, reviewed: true,
  prompt: `원본 상품 사진 4개를 변경 없이 배치한 ${title} 안내 이미지. 색상 ${palette}. AI 연출 음식 사진이 아닌 원본 상품 사진 편집 레이아웃.`,
  usageNotice: '원본 상품 사진을 배치한 안내 이미지입니다. 조리 결과·화기 사용 가능 여부·식품 구성은 각 상품 및 캠핑장 안내를 확인하세요.',
  referenceProducts: refs(productIds), productMatchReviewed: true,
  tags: productIds.map((productId, index) => ({productId, x: tags[index][0], y: tags[index][1]})),
});

const articles = [
  {
    slug: 'camp-griddle-barbecue-party', title: '캠핑 삼겹살 파티 준비: 그리들·집게·채소를 나누는 순서',
    description: '삼겹살 같은 구이 메뉴를 정한 뒤 그리들, 집게, 곁들임 채소를 조리 자리와 식사 자리로 나누어 준비하는 캠핑 바비큐 가이드입니다.',
    category: '캠핑 요리', contentStyle: 'shoppable-scene-v2', salesFormat: 'camping-gear', coverLabel: '캠핑 삼겹살 바비큐 준비', status: 'published', publishAt: now, updatedAt: now, reviewed: true,
    productIds, cover: image('camp-griddle-barbecue-party', 'cover', '캠핑 삼겹살 바비큐 준비', '#fff3df'),
    sections: [
      {heading: '먼저 캠핑장의 화기·조리 구역부터 확인하세요', text: '삼겹살처럼 기름이 나오는 구이 메뉴는 고기와 채소를 고르기 전에 캠핑장의 취사 규칙, 화기 사용 가능 구역, 열원 설치 조건을 먼저 확인하는 편이 안전합니다. 텐트 안이나 통행로 가까이에 조리 자리를 만들지 말고, 뜨거운 조리 도구를 둘 자리와 먹을 식기를 둘 자리를 분리하세요. 이 글은 특정 캠핑장에서 화기 사용을 허용한다는 안내가 아니며, 현장 규칙이 다르면 메뉴와 조리 방법을 바꾸는 것이 우선입니다.', productIds: []},
      {heading: '그리들은 열원과 실제 크기를 함께 대조하세요', text: '국내산 티타늄코팅 캠핑 그리들은 판매 상품명에 40cm로 표시된 조리판입니다. 이 글에서는 고기 불판이나 어떤 열원에도 항상 사용할 수 있다고 단정하지 않습니다. 가져가는 버너 또는 조리 장비의 사용 설명서와 그리들 판매 페이지의 호환 안내를 함께 확인하세요. 조리판 위에 고기와 채소를 한꺼번에 올릴 계획이라면, 실제 조리 자리의 크기와 손잡이를 포함한 수납 공간도 출발 전에 확인하면 됩니다.', productIds: ['9587833030'], image: image('camp-griddle-barbecue-party', 'setup', '그리들 조리 자리 점검', '#f0f7ed')},
      {heading: '집게와 곁들임 채소는 서로 다른 역할로 챙기세요', text: '실리콘 주방 집게는 익히는 재료를 옮길 때 참고할 수 있는 도구이며, 내열 온도와 열원 직접 접촉 가능 여부는 제품 안내를 확인해야 합니다. 애호박은 국내산 10개 구성으로 표시된 상품이고, 새송이버섯은 특 2kg 구성으로 안내된 상품입니다. 두 채소의 실제 수량과 사용할 분량은 인원수, 다른 메뉴, 보관 공간에 맞춰 정하세요. 고기용 집게와 먹는 식기를 섞지 않고, 씻은 채소와 생고기를 올려둘 자리를 나누면 현장 정리가 쉬워집니다.', productIds: ['9707359364', '8443644467', '8655440206'], image: image('camp-griddle-barbecue-party', 'packing', '바비큐 재료와 도구 분리', '#eaf3ff')},
      {heading: '마무리는 기름과 젖은 도구를 분리하는 일입니다', text: '식사가 끝난 뒤 남은 음식물과 기름은 캠핑장 지정 처리 방법을 먼저 확인하고, 주변 땅이나 개수대에 임의로 버리지 않습니다. 그리들과 집게는 각 제품의 세척 안내에 따라 식힌 뒤 닦고, 젖은 도구는 다른 짐과 분리해 가져오세요. 사진은 원본 상품 사진을 배치한 안내 이미지이며, 삼겹살·채소의 실제 양이나 조리 결과를 보증하지 않습니다. 집에 있는 호환 도구가 있다면 새로 구매하지 않고 그 물건을 우선 활용해도 됩니다.', productIds: []},
    ], internalLinks: [{href: '/camping', label: '바비큐 조리 환경을 확인할 캠핑장 찾아보기'}],
  },
  {
    slug: 'camp-woodfire-snack-checklist', title: '캠핑 장작·불멍 간식 준비: 화기 허용 확인부터 정리까지',
    description: '군고구마·밤처럼 불에 구워 먹는 간식을 계획할 때, 캠핑장 화기 규칙과 조리 도구·식재료 보관 자리를 먼저 점검하는 준비 가이드입니다.',
    category: '캠핑 요리', contentStyle: 'shoppable-scene-v2', salesFormat: 'camping-gear', coverLabel: '장작 불멍 간식 준비', status: 'published', publishAt: now, updatedAt: now, reviewed: true,
    productIds, cover: image('camp-woodfire-snack-checklist', 'cover', '장작 불멍 간식 준비', '#fff0e6'),
    sections: [
      {heading: '불을 피우기 전에 허용 여부부터 다시 확인하세요', text: '군고구마나 밤처럼 구워 먹는 간식은 캠핑장마다 허용 장소와 계절별 제한이 달라질 수 있습니다. 예약 정보, 현장 안내, 관리자의 지시 중 더 엄격한 조건을 따르고, 화기가 허용되지 않으면 불을 사용하는 메뉴를 고집하지 말고 다른 간식으로 바꾸세요. 나무·숯·장작을 임의로 가져오거나 자연물을 태우는 행동도 현장 규칙에 따라 제한될 수 있습니다. 이 글의 상품 사진과 조리 예시는 특정 장소에서의 화기 사용 승인이 아닙니다.', productIds: []},
      {heading: '조리판과 집게는 식품과 분리해 보관하세요', text: '40cm로 표시된 캠핑 그리들은 조리판의 예시이며, 장작이나 어떤 열원에 바로 사용할 수 있다는 뜻은 아닙니다. 실제 열원 호환 여부는 그리들과 열원 각각의 안내를 확인해야 합니다. 실리콘 주방 집게도 제품별 내열 범위와 직접 접촉 가능 여부가 다를 수 있어, 뜨거운 조리판 위에 오래 두는 도구로 단정하지 않습니다. 간식 식재료는 포장에 적힌 보관법에 맞춰 가져가고, 생식재료·젖은 도구·먹을 식기를 한 가방에 섞지 않는 것이 좋습니다.', productIds: ['9587833030', '9707359364'], image: image('camp-woodfire-snack-checklist', 'tools', '불멍 간식 조리 도구 점검', '#f6f1e7')},
      {heading: '곁들임은 조리 전후 자리를 나눠 준비하세요', text: '애호박과 새송이버섯은 간식과 함께 구울 수 있는 채소의 예시입니다. 애호박 상품은 10개 구성, 새송이버섯 상품은 특 2kg 구성으로 안내되어 있으므로 사진의 양을 기준으로 주문하지 말고 실제 인원과 남은 음식 보관 계획에 맞춰 선택하세요. 고구마나 밤처럼 구울 간식도 껍질 상태, 알레르기, 포장 보관 안내를 개별적으로 확인합니다. 식재료를 손질했다면 물기와 포장 쓰레기를 담을 자리를 따로 마련해 화기 주변을 비워 두세요.', productIds: ['8443644467', '8655440206'], image: image('camp-woodfire-snack-checklist', 'ingredients', '간식과 곁들임 분리 준비', '#edf6ec')},
      {heading: '불이 완전히 꺼진 뒤 정리 순서를 마무리하세요', text: '조리를 마쳤다고 바로 떠나지 말고, 현장 안내에 따라 불씨가 완전히 꺼졌는지 확인하고 사용한 재·쓰레기·음식물을 정해진 방식으로 처리하세요. 뜨거웠던 조리판과 집게는 충분히 식힌 뒤 제품별 세척 안내를 따라 정리합니다. 사진은 원본 상품 사진을 배치한 안내 이미지이며, 실제 화기 사용 조건·조리 시간·음식 완성도를 보증하지 않습니다. 화기 사용이 불확실한 캠핑장에서는 포장 간식이나 현장 규칙에 맞는 메뉴를 선택하세요.', productIds: []},
    ], internalLinks: [{href: '/camping', label: '취사·화기 안내를 확인할 캠핑장 찾아보기'}],
  },
];

async function download(url) {
  const response = await fetch(url, {redirect: 'follow', signal: AbortSignal.timeout(30000)});
  if (!response.ok) throw Error(`상품 사진 다운로드 실패: ${response.status}`);
  const host = new URL(response.url).hostname;
  if (host !== 'ads-partners.coupang.com' && !host.endsWith('.coupangcdn.com')) throw Error('승인되지 않은 상품 사진 리디렉션');
  return Buffer.from(await response.arrayBuffer());
}

function background(title, subtitle, color) {
  return Buffer.from(`<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="800" fill="${color}"/><rect x="42" y="34" width="1116" height="110" rx="24" fill="#ffffff" fill-opacity="0.9"/><text x="78" y="82" font-size="28" font-family="Arial, sans-serif" fill="#8a5a23" font-weight="700">CAMPING COOKING GUIDE</text><text x="78" y="122" font-size="34" font-family="Arial, sans-serif" fill="#24170d" font-weight="700">${title}</text><text x="1120" y="760" text-anchor="end" font-size="18" font-family="Arial, sans-serif" fill="#6b5a4a">원본 상품 사진 안내 이미지</text></svg>`);
}

async function createScene(article, slot, title, color, variant) {
  const output = `public/prep-images/${article.slug}-${slot}-v1.webp`;
  if (fs.existsSync(output)) return;
  const panels = await Promise.all(productIds.map(async id => {
    const photo = await sharp(await download(productById.get(id).image)).rotate().resize({width: 270, height: 250, fit: 'contain', background: '#ffffff'}).png().toBuffer();
    return sharp({create: {width: 330, height: 290, channels: 4, background: '#ffffff'}}).composite([{input: photo, left: 30, top: 20}]).png().toBuffer();
  }));
  const coords = variant === 0 ? [[50, 180], [820, 180], [50, 480], [820, 480]] : variant === 1 ? [[430, 165], [830, 285], [80, 305], [470, 495]] : [[80, 190], [470, 190], [80, 500], [470, 500]];
  await sharp(background(title, article.description, color)).composite(panels.map((input, index) => ({input, left: coords[index][0], top: coords[index][1]}))).webp({quality: 82}).toFile(output);
}

for (const article of articles) {
  if (store.articles.some(item => item.slug === article.slug)) continue;
  await createScene(article, 'cover', article.coverLabel, article.slug.includes('woodfire') ? '#fff0e6' : '#fff3df', 0);
  await createScene(article, article.slug.includes('woodfire') ? 'tools' : 'setup', article.coverLabel, article.slug.includes('woodfire') ? '#f6f1e7' : '#f0f7ed', 1);
  await createScene(article, article.slug.includes('woodfire') ? 'ingredients' : 'packing', article.coverLabel, article.slug.includes('woodfire') ? '#edf6ec' : '#eaf3ff', 2);
  store.articles.push(article);
}

saveStore(store, store.version);
console.log(JSON.stringify({added: articles.map(article => article.slug), articles: store.articles.length}));
