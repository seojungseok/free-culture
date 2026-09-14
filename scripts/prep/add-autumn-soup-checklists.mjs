import fs from 'node:fs';

const storePath = 'data/weekend-prep.json';
const researchPath = 'data/weekend-prep-soup-checklist-research.json';
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
const research = JSON.parse(fs.readFileSync(researchPath, 'utf8'));

const wantedResearch = new Map([
  ['crab', { specification: '냉동 꽃게. 상품명 기준 국내산 알배기 암꽃게', options: '5kg(15~25미) × 1박스' }],
  ['fishcake', { specification: '탕에 넣기 좋은 모둠 어묵', options: '1.1kg × 1개' }],
  ['sausage', { specification: '햄·소시지가 포함된 부대찌개 구성', options: '600g × 3개' }],
  ['beef', { specification: '소고기 샤브샤브 대용량 밀키트', options: '1.21kg × 1개' }],
  ['mushroom', { specification: '전골용 모둠버섯', options: '중량과 구성은 판매 페이지에서 확인' }],
  ['green-onion', { specification: '흙대파', options: '중량과 수량은 판매 페이지에서 확인' }],
]);

const researchedProducts = research.records
  .filter((record) => wantedResearch.has(record.key))
  .map((record) => ({
    ...record.candidate,
    ...wantedResearch.get(record.key),
    verified: true,
    evidence: '2026-09-14 쿠팡 파트너스 API가 반환한 상품번호·상품명·원본 제휴 URL·대표 사진을 기록하고, 대표 사진과 AI 준비 장면의 품목 외형을 대조했습니다. 가격·할인·배송·후기는 사용하지 않았습니다.',
  }));

const water = {
  id: '7689270513',
  name: '탐사 샘물',
  affiliateUrl: 'https://link.coupang.com/re/AFFSDP?lptag=AF0215515&pageKey=7689270513&itemId=20877904748&vendorItemId=87945140914&traceid=V0-113-6080a97a4592b297&pt=0&slot=72',
  image: 'https://image13.coupangcdn.com/image/vendor_inventory/image_audit/stage/manual/93702155226173-fcebe9fc-46f2-4aa2-955c-3810ef885a5a_1751243766668.jpg',
  source: 'https://www.coupang.com/vp/products/7689270513?itemId=20877904748&vendorItemId=87945140914',
  checkedAt: '2026-09-13T12:07:25.322Z',
  specification: '병당 2L',
  options: '2L × 24개 묶음',
  verified: true,
  evidence: '2026-09-13 원본 제휴 URL의 판매처 도착, 상품번호·itemId·vendorItemId, 선택 옵션 및 대표 사진을 확인했습니다. 가격·배송·후기·효능은 사용하지 않았습니다.',
};

for (const product of [...researchedProducts, water]) {
  const index = store.products.findIndex((item) => item.id === product.id);
  if (index >= 0) store.products[index] = product;
  else store.products.push(product);
}

const byId = new Map(store.products.map((product) => [product.id, product]));
const ref = (productId) => ({ productId, imageUrl: byId.get(productId).image });
const scene = (file, alt, productIds, tags, prompt) => ({
  url: `/prep-images/${file}.webp`,
  alt,
  width: 1200,
  height: 800,
  generated: true,
  reviewed: true,
  prompt,
  referenceProducts: productIds.map(ref),
  productMatchReviewed: true,
  tags: tags.map(([productId, x, y]) => ({ productId, x, y })),
});
const item = (id, label, role, group, productId) => ({ id, label, role, group, productId });

const common = [
  item('water', '생수', '현장에서 육수 양을 맞출 때 쓰는 조리용 물', 'common', '7689270513'),
  item('pot', '20cm 양수냄비', '국물 재료를 한 번에 담는 조리 냄비', 'common', '9487214712'),
  item('ladle', '국자', '완성된 국물과 건더기를 나누어 담는 도구', 'common', '9206620361'),
  item('bowl', '국그릇', '뜨거운 국물요리를 개인별로 나누어 담는 그릇', 'common', '9676631018'),
];

const articles = [
  {
    slug: 'autumn-flower-crab-soup-ingredient-checklist',
    title: '가을 대표 요리 꽃게탕 재료 체크리스트',
    description: '가을 캠핑 전 꽃게탕에 필요한 꽃게·대파·애호박·미나리·양념·육수와 냄비까지 빠짐없이 확인하는 장보기 체크리스트입니다.',
    coverLabel: '가을 꽃게탕 준비물',
    checklist: [
      item('crab', '냉동 꽃게', '국물의 중심이 되는 주재료. 이동 전 냉동 상태와 보냉 공간부터 확인', 'main', '9603803528'),
      item('green-onion', '대파', '국물 향과 채소 건더기를 더하는 기본 채소', 'main', '6528172171'),
      item('zucchini', '애호박', '부드러운 채소 건더기와 단맛을 보태는 재료', 'main', '8443644467'),
      item('minari', '미나리', '마지막에 넣어 향을 살리는 마무리 채소', 'main', '9604422506'),
      item('seasoning', '매운탕 양념', '고춧가루·장류를 따로 챙기지 않을 때 쓰는 기본 양념', 'seasoning', '8574770164'),
      item('broth', '국물육수 다시팩', '맹물보다 국물 바탕을 빠르게 내기 위한 육수 재료', 'seasoning', '57577364'),
      ...common,
    ],
    cover: scene('autumn-crab-soup-checklist-cover', '가을 꽃게탕 재료를 펼쳐 둔 캠핑 준비 장면', ['9603803528','6528172171','8443644467','8574770164'], [['9603803528',22,38],['6528172171',54,34],['8443644467',81,26],['8574770164',73,56]], '가을 캠핑 테이블 위 꽃게·대파·애호박·매운탕 양념을 펼친 대표 썸네일'),
    images: [
      scene('autumn-crab-soup-checklist-support', '꽃게탕 육수와 생수, 미나리를 따로 확인하는 장면', ['57577364','7689270513','9604422506'], [['57577364',18,40],['7689270513',55,36],['9604422506',82,58]], '육수 다시팩·생수·미나리를 분리해 둔 가을 캠핑 준비 장면'),
      scene('autumn-crab-soup-checklist-tools', '꽃게탕 공통 준비물인 냄비와 국자, 국그릇, 생수', ['9487214712','9206620361','9676631018','7689270513'], [['9487214712',29,34],['9206620361',62,49],['9676631018',42,69],['7689270513',82,43]], '냄비·국자·국그릇·생수를 구분한 출발 직전 점검 장면'),
    ],
    section1: '먼저 꽃게 포장 단위가 인원수와 보냉함 크기에 맞는지 확인하세요. 냉동 꽃게는 출발 직전에 보냉 가방으로 옮기고, 대파·애호박·미나리는 씻어서 물기를 뺀 뒤 각각 봉투에 나누면 현장에서 빠뜨린 재료를 찾기 쉽습니다. 매운탕 양념과 육수팩은 이미 장바구니에 있더라도 실제 짐에 들어갔는지 체크해야 합니다. 꽃게 포장이 크면 출발 전에 냄비에도 들어가는지 확인하세요.',
    section2: '체크하지 않은 항목만 오른쪽 주문하기 버튼이 남습니다. 집에 흔히 있는 생수·냄비·국자·국그릇은 아래쪽 공통 준비물에서 마지막에 확인하세요. 냄비는 꽃게와 채소가 눌리지 않게 들어갈 크기인지, 생수는 마실 물과 조리용을 합쳐 충분한지 확인한 뒤 체크하면 됩니다. 체크 상태는 이 브라우저에 저장됩니다.',
  },
  {
    slug: 'camping-fishcake-soup-ingredient-checklist',
    title: '캠핑 어묵탕 재료 체크리스트',
    description: '캠핑 어묵탕에 필요한 모둠 어묵·대파·육수 재료와 생수·냄비·국자·국그릇을 출발 전에 확인하는 준비물 체크리스트입니다.',
    coverLabel: '캠핑 어묵탕 준비물',
    checklist: [
      item('fishcake', '모둠 어묵', '어묵탕의 주재료. 포장 중량과 보관 방법을 먼저 확인', 'main', '8682238562'),
      item('green-onion', '대파', '국물 향과 고명을 더하는 채소', 'main', '6528172171'),
      item('broth', '국물육수 다시팩', '어묵 국물의 기본 바탕을 내는 재료', 'seasoning', '57577364'),
      item('powder', '잔치국수 분말', '현장에서 간을 보완할 때 조금씩 쓰는 분말 조미료', 'seasoning', '6168487275'),
      ...common,
    ],
    cover: scene('camp-fishcake-soup-checklist-cover', '캠핑 어묵탕 재료를 펼쳐 둔 가을 준비 장면', ['8682238562','6528172171','57577364'], [['8682238562',23,45],['6528172171',55,36],['57577364',82,39]], '모둠 어묵·대파·육수팩을 펼친 캠핑 어묵탕 대표 썸네일'),
    images: [
      scene('camp-fishcake-soup-checklist-support', '어묵탕 육수 재료와 생수, 국그릇 준비 장면', ['57577364','6168487275','7689270513','9676631018'], [['57577364',20,45],['6168487275',43,58],['7689270513',65,39],['9676631018',85,64]], '육수팩·분말·생수·국그릇을 나눠 둔 캠핑 준비 장면'),
      scene('camp-fishcake-soup-checklist-tools', '어묵탕 공통 준비물 냄비와 국자, 국그릇, 생수', ['9487214712','9206620361','9676631018','7689270513'], [['9487214712',47,46],['9206620361',79,66],['9676631018',20,67],['7689270513',81,39]], '초록 수납함 옆 냄비·국자·국그릇·생수 점검 장면'),
    ],
    section1: '모둠 어묵은 포장 중량과 보관 방법을 먼저 보고 인원수에 맞춰 준비하세요. 대파는 씻어 썰어 두면 현장에서 도마 사용을 줄일 수 있습니다. 육수팩과 분말 조미료는 둘 다 무조건 넣는 목록이 아니라, 평소 쓰는 국물 방식에 맞춰 필요한 것을 체크하는 보완 재료입니다. 작은 지퍼백에 모아 두면 찾기 쉽습니다. 냉장 보관 표시가 있으면 보냉 가방 자리도 먼저 확보하세요.',
    section2: '식재료 확인이 끝난 뒤 아래 공통 준비물을 보세요. 냄비는 어묵이 불었을 때도 넘치지 않을 여유가 있는지, 생수는 조리용 분량을 따로 잡았는지 확인합니다. 국자와 국그릇은 빼먹기 쉬워 출발 직전 한 번 더 체크하는 항목입니다. 체크하지 않은 준비물만 주문하기 버튼이 보이고 완료 상태는 브라우저에 남습니다.',
  },
  {
    slug: 'camping-budae-jjigae-ingredient-checklist',
    title: '캠핑 부대찌개 재료 체크리스트',
    description: '캠핑 부대찌개용 햄·소시지 구성과 추가 햄·치즈·대파·육수, 생수와 냄비까지 순서대로 확인하는 준비물 체크리스트입니다.',
    coverLabel: '캠핑 부대찌개 준비물',
    checklist: [
      item('budae', '부대찌개 구성', '햄·소시지가 포함된 중심 재료. 포장 구성과 중량을 먼저 확인', 'main', '7380618503'),
      item('ham', '슬라이스 햄', '인원수에 맞춰 건더기를 추가할 때 쓰는 햄', 'main', '8243714135'),
      item('cheese', '체다 슬라이스 치즈', '원할 때 한 장씩 더하는 선택 재료', 'main', '6959448489'),
      item('green-onion', '대파', '국물 향과 채소 건더기를 더하는 재료', 'main', '6528172171'),
      item('zucchini', '애호박', '햄 사이에 넣을 채소 건더기를 보태는 재료', 'main', '8443644467'),
      item('broth', '국물육수 다시팩', '별도 육수 바탕이 필요할 때 쓰는 재료', 'seasoning', '57577364'),
      ...common,
    ],
    cover: scene('camp-budae-soup-checklist-cover', '캠핑 부대찌개 햄과 치즈, 대파를 펼쳐 둔 준비 장면', ['7380618503','8243714135','6959448489','6528172171'], [['7380618503',21,35],['8243714135',61,34],['6959448489',54,65],['6528172171',86,37]], '부대찌개 장면 옆 추가 햄·치즈·대파를 펼친 대표 썸네일'),
    images: [
      scene('camp-budae-soup-checklist-support', '부대찌개 육수와 애호박, 생수, 국그릇을 확인하는 장면', ['57577364','8443644467','7689270513','9676631018'], [['57577364',22,39],['8443644467',38,72],['7689270513',67,37],['9676631018',84,66]], '육수팩·애호박·생수·국그릇을 펼친 가을 캠핑 준비 장면'),
      scene('camp-budae-soup-checklist-tools', '부대찌개 공통 준비물 냄비와 국자, 국그릇, 생수', ['9487214712','9206620361','9676631018','7689270513'], [['9487214712',47,45],['9206620361',61,70],['9676631018',19,68],['7689270513',84,44]], '붉은 체크 천 위 냄비·국자·국그릇·생수 점검 장면'),
    ],
    section1: '먼저 부대찌개 구성품 안에 햄과 소시지가 얼마나 들어 있는지 판매 페이지에서 확인하고, 부족할 때만 추가 햄을 체크하세요. 치즈는 취향에 따라 빼도 되는 선택 재료이며 대파와 애호박은 씻어 썰어 가면 편합니다. 냉장 또는 냉동 식품은 출발 직전에 보냉 가방으로 옮기고 서로 섞이지 않게 봉투를 나눕니다. 구성품과 추가 재료가 겹치지 않는지도 한 번 확인하세요.',
    section2: '육수팩은 구입한 부대찌개 구성에 육수가 포함됐는지 확인한 뒤 필요한 경우만 준비하세요. 생수·냄비·국자·국그릇은 음식 재료보다 아래에 배치해 마지막 짐 점검에 쓰도록 했습니다. 체크하면 글자가 회색 취소선으로 바뀌고 주문 버튼이 사라집니다. 남은 항목만 보면서 현장에 가져갈 실제 짐을 다시 확인하세요. 보냉 가방에 넣은 재료도 마지막에 체크해야 합니다.',
  },
  {
    slug: 'camping-beef-mushroom-hotpot-ingredient-checklist',
    title: '캠핑 소고기 버섯전골 재료 체크리스트',
    description: '캠핑 소고기 버섯전골에 필요한 소고기 구성·모둠버섯·대파·애호박·육수와 공통 조리도구를 확인하는 준비물 체크리스트입니다.',
    coverLabel: '소고기 버섯전골 준비물',
    checklist: [
      item('beef', '소고기 샤브샤브 구성', '전골의 중심이 되는 고기 재료. 중량과 포함 채소를 먼저 확인', 'main', '7679993842'),
      item('mushroom', '전골용 모둠버섯', '종류가 다른 버섯 건더기를 한 번에 준비하는 재료', 'main', '6211502021'),
      item('green-onion', '대파', '국물 향을 더하는 기본 채소', 'main', '6528172171'),
      item('zucchini', '애호박', '부드러운 채소 건더기를 보태는 재료', 'main', '8443644467'),
      item('broth', '국물육수 다시팩', '전골 국물의 바탕을 따로 낼 때 쓰는 재료', 'seasoning', '57577364'),
      ...common,
    ],
    cover: scene('camp-beef-mushroom-hotpot-checklist-cover', '소고기 버섯전골 재료를 펼쳐 둔 가을 캠핑 준비 장면', ['7679993842','6211502021','6528172171','8443644467'], [['7679993842',22,39],['6211502021',62,40],['6528172171',87,31],['8443644467',63,66]], '소고기 전골 장면과 버섯·대파·애호박을 펼친 대표 썸네일'),
    images: [
      scene('camp-beef-mushroom-hotpot-checklist-support', '버섯전골 육수와 애호박, 생수, 국그릇을 확인하는 장면', ['57577364','8443644467','7689270513','9676631018'], [['57577364',21,42],['8443644467',37,71],['7689270513',61,38],['9676631018',84,65]], '짙은 초록 천 위 육수팩·애호박·생수·국그릇 준비 장면'),
      scene('camp-beef-mushroom-hotpot-checklist-tools', '버섯전골 공통 준비물 냄비와 국자, 국그릇, 생수', ['9487214712','9206620361','9676631018','7689270513'], [['9487214712',35,40],['9206620361',54,70],['9676631018',72,67],['7689270513',83,37]], '산 캠핑장 테이블 위 냄비·국자·국그릇·생수 점검 장면'),
    ],
    section1: '소고기 구성품에 이미 들어 있는 채소와 육수 범위를 먼저 확인하면 중복 구매를 줄일 수 있습니다. 모둠버섯은 포장 안의 종류와 양을 보고, 대파와 애호박은 필요한 만큼 씻어 소분하세요. 고기와 채소는 보관 조건이 다르므로 각각 밀봉하고 고기는 출발 직전에 보냉 가방 안쪽에 넣는 순서로 점검합니다. 구성 안에 든 재료는 중복 체크하지 않아도 됩니다.',
    section2: '육수팩은 구입한 구성에 별도 육수가 없을 때 확인하는 항목입니다. 공통 준비물은 생수, 냄비, 국자, 국그릇 순으로 아래에 모았습니다. 냄비는 모든 재료를 넣고도 국물이 넘치지 않을 크기인지 확인하고, 생수는 마실 물과 조리용을 구분해 수량을 잡으세요. 체크하지 않은 항목에는 오른쪽 주문하기 버튼이 계속 표시됩니다. 실제 짐에 넣은 뒤 체크하는 방식으로 쓰세요.',
  },
  {
    slug: 'camping-seafood-hotpot-ingredient-checklist',
    title: '캠핑 해물탕 재료 체크리스트',
    description: '캠핑 해물탕용 모둠해물·오만둥이·미나리·애호박·매운탕 양념·육수와 냄비까지 확인하는 가을 준비물 체크리스트입니다.',
    coverLabel: '캠핑 해물탕 준비물',
    checklist: [
      item('seafood', '모둠해물탕', '해물탕의 중심 재료. 냉동 상태와 포장 중량을 먼저 확인', 'main', '7853820445'),
      item('omandungi', '손질 오만둥이', '해물 건더기를 추가할 때 쓰는 선택 재료', 'main', '8630066299'),
      item('minari', '미나리', '마지막에 향을 더하는 채소', 'main', '9604422506'),
      item('zucchini', '애호박', '부드러운 채소 건더기를 보태는 재료', 'main', '8443644467'),
      item('seasoning', '매운탕 양념', '해물탕의 기본 간을 준비하는 양념', 'seasoning', '8574770164'),
      item('broth', '국물육수 다시팩', '국물 바탕을 별도로 낼 때 쓰는 재료', 'seasoning', '57577364'),
      ...common,
    ],
    cover: scene('camp-seafood-hotpot-checklist-cover', '캠핑 해물탕 재료를 펼쳐 둔 가을 준비 장면', ['7853820445','8630066299','8574770164','9604422506'], [['7853820445',18,28],['8630066299',26,58],['8574770164',52,37],['9604422506',82,52]], '모둠해물탕·오만둥이·매운탕 양념·미나리를 펼친 대표 썸네일'),
    images: [
      scene('camp-seafood-hotpot-checklist-support', '해물탕 육수와 애호박, 생수, 국그릇을 확인하는 장면', ['57577364','8443644467','7689270513','9676631018'], [['57577364',18,44],['8443644467',38,67],['7689270513',64,38],['9676631018',84,63]], '바닷가 캠핑 테이블에 육수팩·애호박·생수·국그릇을 둔 장면'),
      scene('camp-seafood-hotpot-checklist-tools', '해물탕 공통 준비물 냄비와 국자, 국그릇, 생수', ['9487214712','9206620361','9676631018','7689270513'], [['9487214712',37,43],['9206620361',58,70],['9676631018',20,66],['7689270513',79,38]], '해안 캠핑장 테이블 위 냄비·국자·국그릇·생수 점검 장면'),
    ],
    section1: '모둠해물탕 포장의 중량과 포함된 해물 종류를 먼저 확인하고, 오만둥이는 건더기를 더하고 싶을 때만 체크하세요. 냉동 해물은 녹으면서 물이 샐 수 있으므로 밀폐 봉투에 한 번 더 넣어 보냉 가방 안쪽에 둡니다. 미나리와 애호박은 씻어 물기를 뺀 뒤 따로 포장하면 현장에서 목록과 실제 재료를 대조하기 쉽습니다.',
    section2: '매운탕 양념은 포장 구성에 양념이 포함됐는지 확인한 뒤 준비하고, 육수팩은 별도 국물 바탕이 필요할 때 선택합니다. 생수·냄비·국자·국그릇은 아래 공통 준비물에서 마지막에 점검하세요. 냄비 크기는 해물과 채소를 모두 넣을 여유가 있는지 확인합니다. 체크하지 않은 항목만 주문하기 버튼이 남아 출발 전 빠진 짐을 바로 구분할 수 있습니다.',
  },
];

const publishedAt = '2026-09-14T15:00:00.000Z';
for (const draft of articles) {
  const article = {
    slug: draft.slug,
    title: draft.title,
    description: draft.description,
    category: '요리 준비물',
    contentStyle: 'shoppable-scene-v2',
    salesFormat: 'food-checklist',
    coverLabel: draft.coverLabel,
    status: 'published',
    publishAt: publishedAt,
    updatedAt: publishedAt,
    reviewed: true,
    cover: draft.cover,
    checklist: draft.checklist,
    sections: [
      { heading: '장보기 전 확인', text: draft.section1, productIds: draft.checklist.filter((x) => x.group !== 'common').map((x) => x.productId), image: draft.images[0] },
      { heading: '출발 직전 공통 준비물', text: draft.section2, productIds: common.map((x) => x.productId), image: draft.images[1] },
    ],
    productIds: [...new Set(draft.checklist.map((x) => x.productId))],
    internalLinks: [{ href: '/camping', label: '가을 캠핑장 찾아보기' }],
  };
  for (const productId of article.productIds) {
    if (!byId.has(productId)) throw new Error(`${article.slug}: 상품 ${productId} 없음`);
  }
  const index = store.articles.findIndex((item) => item.slug === article.slug);
  if (index >= 0) store.articles[index] = article;
  else store.articles.unshift(article);
}

const checklistOrder = new Map(articles.map((article, index) => [article.slug, index]));
store.articles.sort((a, b) => {
  const aOrder = checklistOrder.get(a.slug);
  const bOrder = checklistOrder.get(b.slug);
  if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
  if (aOrder !== undefined) return -1;
  if (bOrder !== undefined) return 1;
  return 0;
});

store.version += 1;
fs.writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`);
console.log(JSON.stringify({ version: store.version, addedProducts: researchedProducts.length + 1, articleSlugs: articles.map((x) => x.slug) }, null, 2));
