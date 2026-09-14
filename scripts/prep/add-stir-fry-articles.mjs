import fs from 'node:fs';
import crypto from 'node:crypto';
import { publicationErrors, validateShape } from './content.mjs';

const dataPath = 'data/weekend-prep.json';
const store = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const research = JSON.parse(fs.readFileSync('data/weekend-prep-stir-fry-research.json', 'utf8'));
const protectedSlugs = new Set(store.articles.map(article => article.slug));
const beforeHash = crypto.createHash('sha256').update(JSON.stringify(store.articles)).digest('hex');
const publishedAt = '2026-09-14T13:20:00.000Z';
const evidence = '2026-09-14 쿠팡 API가 반환한 상품번호·선택 제휴 URL과 원본 상품 사진을 대조했습니다. 가격·할인·배송·개인 사용 후기는 확인하거나 인용하지 않았습니다.';

const productDetails = {
  '7265684367': { specification: '국내산 돼지 후지(뒷다리살), 제육용 슬라이스. 원산지·용도 표기는 판매처 제목 기준', options: '300g × 7개' },
  '7404695153': { specification: '볶음요리에 쓰는 직화만능 소스. 요리별 사용량은 실제 포장 안내를 우선 확인', options: '2kg × 1개' },
  '8987385839': { specification: '한돈 고추장 제육볶음. 보관·해동·조리법은 받은 상품의 포장 안내를 확인', options: '700g · 2개 표기' },
  '8960028100': { specification: '냉장 찰순대. HACCP 표기는 판매처 제목 기준', options: '1kg × 4개' },
  '6854193615': { specification: '볶음요리용으로 활용할 수 있는 만능양념장 소스', options: '370g × 1개' },
  '6645728981': { specification: '순대볶음 밀키트. 구성 재료와 정확한 중량은 판매 페이지와 받은 상품에서 확인', options: '2~3인분 · 1개 연결' },
  '344228023': { specification: '국내산 닭을 사용한 양념 닭갈비. 보관·해동·조리법은 실제 포장 안내를 확인', options: '500g × 3개' },
  '9169365991': { specification: '급냉 손질 오징어. 손질 상태와 해동법은 받은 상품의 포장 안내를 확인', options: '2미(300~350g) × 1세트' },
  '9262718994': { specification: '오징어·낙지 볶음용 양념. 개별 요리 사용량은 실제 포장 안내를 확인', options: '2kg × 1개' },
  '8042525293': { specification: '순한맛 냉동 오징어볶음. 해동·조리법은 실제 포장 안내를 확인', options: '400g × 1개' },
  '7032698357': { specification: '볶음김치 대용량 제품. 개봉 후 보관법은 실제 포장 안내를 확인', options: '5kg × 1개' },
  '68121544': { specification: '닭가슴살 김치볶음밥 냉동 간편식. 조리법은 실제 포장 안내를 확인', options: '200g × 3개' },
  '9587833030': { specification: '40cm 티타늄코팅 캠핑 그리들. 실제 사용 가능 열원은 판매 페이지 안내를 확인', options: '40cm × 1개' },
};

const candidates = research.records.map(record => record.candidate).filter(Boolean);
for (const [id, details] of Object.entries(productDetails)) {
  if (store.products.some(product => product.id === id)) continue;
  const candidate = candidates.find(product => product.id === id);
  if (!candidate) throw new Error(`연구 상품 누락: ${id}`);
  store.products.push({ ...candidate, verified: true, ...details, evidence });
}

const product = id => {
  const found = store.products.find(item => item.id === id);
  if (!found) throw new Error(`상품 누락: ${id}`);
  return found;
};
const refs = ids => ids.map(productId => ({ productId, imageUrl: product(productId).image }));
const usageNotice = 'AI 연출 이미지입니다. 사진 속 +는 이 요리에 어울리는 실제 상품이며 정확한 외형과 옵션은 판매 페이지에서 확인하세요.';
const photo = ({ url, alt, prompt, ids, tags }) => ({
  url,
  alt,
  width: 1200,
  height: 800,
  generated: true,
  reviewed: true,
  prompt,
  usageNotice,
  referenceProducts: refs(ids),
  productMatchReviewed: true,
  tags,
});

const jeyukIds = ['7265684367', '7404695153', '8987385839', '9587833030'];
const sundaeIds = ['8960028100', '6854193615', '6645728981', '9587833030'];
const dakgalbiIds = ['344228023', '7404695153', '9587833030'];
const squidIds = ['9169365991', '9262718994', '8042525293', '9587833030'];
const kimchiRiceIds = ['7032698357', '8243714135', '68121544', '9587833030'];

const newArticles = [
  {
    slug: 'camp-jeyuk-bokkeum',
    title: '캠핑 제육볶음 맛있게 만드는 법｜물기 없이 볶아 불맛 살리기',
    description: '돼지고기 600g 기준 양념 비율부터 채소 크기, 예열, 고기를 펼쳐 굽는 순서, 물이 생기거나 양념이 탈 때 되살리는 방법까지 캠핑장에서 그대로 따라 할 수 있게 정리했습니다.',
    category: '캠핑 요리', contentStyle: 'shoppable-scene-v2', salesFormat: 'food-recipe', coverLabel: '불맛 나는 제육볶음',
    quietProductIds: ['9587833030'], shortcutProductId: '8987385839', status: 'published', publishAt: publishedAt, updatedAt: publishedAt, reviewed: true,
    productIds: jeyukIds,
    cover: photo({
      url: '/prep-images/camp-jeyuk-bokkeum-cover.webp',
      alt: '완성된 제육볶음과 돼지고기, 볶음소스, 간편 제육볶음, 캠핑 그리들을 함께 차린 식탁',
      prompt: '실제 상품 사진을 참고한 캠핑 제육볶음 완성 장면을 만들고, 감성 한글 제목 불맛 나는 제육볶음을 넣은 대표 썸네일.', ids: jeyukIds,
      tags: [{ productId: '7265684367', x: 18, y: 27 }, { productId: '7404695153', x: 82, y: 26 }, { productId: '8987385839', x: 83, y: 74 }, { productId: '9587833030', x: 51, y: 62 }],
    }),
    sections: [
      {
        heading: '먼저 준비할 것｜3~4인분, 돼지고기 600g 기준',
        text: '돼지고기 제육용 600g, 양파 1개, 대파 1대, 식용유 1큰술을 준비합니다. 직접 양념한다면 고추장 3큰술, 고춧가루 2큰술, 간장 2큰술, 설탕 1과 1/2큰술, 다진 마늘 1큰술, 맛술 또는 물 2큰술을 섞으세요. 시판 볶음소스를 쓸 때는 이 양념을 더하지 말고 포장에 적힌 고기 대비 사용량부터 따릅니다. 소스는 처음부터 전부 붓지 않고 3분의 2만 덜어 둡니다. 남은 양은 마지막 색과 간을 보고 넣어야 짜거나 타는 일을 줄일 수 있습니다. 돼지고기 제품은 300g 단위라면 두 팩이 한 번 조리하기 편한 양입니다.',
        productIds: ['7265684367', '7404695153'],
        image: photo({
          url: '/prep-images/camp-jeyuk-bokkeum-prep.webp',
          alt: '빈 그리들 주위에 제육용 돼지고기, 볶음소스, 간편 제육볶음과 채소를 나눠 둔 준비 장면',
          prompt: '캠핑 테이블 중앙의 빈 그리들과 제육용 돼지고기, 볶음소스, 간편 제육볶음, 손질 채소를 펼친 조리 전 준비 장면.', ids: jeyukIds,
          tags: [{ productId: '7265684367', x: 21, y: 24 }, { productId: '7404695153', x: 77, y: 18 }, { productId: '8987385839', x: 81, y: 65 }, { productId: '9587833030', x: 50, y: 52 }],
        }),
      },
      {
        heading: '캠핑장 가기 전｜고기와 양념은 따로, 채소는 같은 크기로',
        text: '양파는 1cm 폭, 대파는 4~5cm 길이로 잘라 밀폐용기에 담습니다. 돼지고기는 서로 붙은 부분을 떼어 한 입 크기로 정리하되 양념과 미리 섞어 오래 두기보다 고기와 소스를 따로 차갑게 운반하면 그리들에 올렸을 때 물이 덜 생깁니다. 냉장 재료는 아이스박스 안쪽에 두고, 조리 직전에 꺼냅니다. 현장에서는 고기용 집게와 완성 음식용 집게를 구분하세요. 그리들은 넓을수록 고기를 겹치지 않게 펼칠 수 있습니다. 600g이 한 겹으로 놓이지 않으면 두 번에 나눠 볶는 편이 한꺼번에 쌓아 익히는 것보다 결과가 안정적입니다.',
        productIds: [],
      },
      {
        heading: '1단계｜중강불로 예열하고 고기부터 한 겹으로 굽기',
        text: '그리들을 중강불에 2분 정도 올린 뒤 식용유를 얇게 두릅니다. 고기 한 점을 먼저 올렸을 때 바로 지글거리면 준비된 상태입니다. 돼지고기를 겹치지 않게 펼치고 40~60초는 건드리지 마세요. 아래 면 가장자리가 하얗게 변하고 바닥에 갈색 자국이 생기기 시작하면 뒤집습니다. 처음부터 계속 휘저으면 온도가 떨어져 고기에서 물이 빠집니다. 뒤집은 뒤 큰 붉은 면이 거의 보이지 않을 때까지 볶되, 아직 완전히 익히려 애쓰지 않습니다. 양파와 소스를 넣은 뒤에도 익는 시간이 남아 있습니다.',
        productIds: ['7265684367'],
        image: photo({
          url: '/prep-images/camp-jeyuk-bokkeum-cooking.webp',
          alt: '그리들에서 돼지고기 표면을 먼저 익힌 뒤 붉은 볶음소스를 나눠 붓는 장면',
          prompt: '캠핑 그리들에서 돼지고기를 먼저 갈색 내고 볶음소스를 나눠 붓는 제육볶음 핵심 조리 장면.', ids: jeyukIds,
          tags: [{ productId: '7265684367', x: 45, y: 53 }, { productId: '7404695153', x: 70, y: 23 }, { productId: '8987385839', x: 84, y: 68 }, { productId: '9587833030', x: 51, y: 70 }],
        }),
      },
      {
        heading: '2단계｜양파를 먼저 볶고 소스는 두 번에 나눠 넣기',
        text: '고기를 그리들 바깥쪽으로 밀고 가운데에 양파를 넣어 1분 볶습니다. 양파 겉면이 투명해지기 시작하면 고기와 섞고 준비한 소스의 3분의 2를 둘러 넣습니다. 중불로 낮춰 2~3분 볶다가 가장 두꺼운 고기 한 점을 잘라 중심에 붉은 기가 남지 않았는지 확인합니다. 고기가 익고 소스가 바닥에 얇게 달라붙을 때 대파를 넣고 30초 더 볶으세요. 색이 옅거나 싱거울 때만 남은 소스를 한 숟갈씩 보충합니다. 마지막에 참기름 1큰술과 통깨를 넣고 불을 끄면 향이 날아가지 않습니다.',
        productIds: ['7404695153'],
      },
      {
        heading: '물이 생기거나 양념이 탈 때｜불부터 조절하면 되살릴 수 있어요',
        text: '물이 고였다면 재료를 얇게 펼치고 중강불로 올려 국물이 아니라 바닥이 보일 때까지 잠깐 날립니다. 계속 뒤적이면 수증기가 빠지지 않으니 넓게 편 뒤 20~30초씩 기다리세요. 반대로 양념 냄새가 쓰고 가장자리가 검어지면 즉시 불에서 그리들을 잠깐 내리고 뜨거운 물 1~2큰술을 넣어 바닥을 긁은 뒤 중불로 돌아옵니다. 짤 때 설탕을 더 넣으면 단맛만 세집니다. 양파나 양배추를 한 줌 더 넣고 익혀 간을 분산하는 편이 낫습니다. 고기가 덜 익었다면 물 한 숟갈을 넣고 뚜껑을 1분 덮은 뒤 다시 펼쳐 마무리합니다.',
        productIds: [],
      },
      {
        heading: '손질도 양념도 귀찮은 날｜간편 제육볶음으로 마무리',
        text: '돼지고기를 썰고 양념을 맞추는 과정까지 줄이고 싶다면 양념된 한돈 고추장 제육볶음을 선택할 수 있습니다. 제품마다 고기 두께와 양념 농도가 다르므로 받은 상품의 보관·해동·조리 안내를 먼저 확인하세요. 그리들을 예열한 뒤 한꺼번에 두껍게 쌓지 말고 넓게 펴서 조리하고, 가장 두꺼운 고기를 잘라 속까지 익었는지 확인합니다. 집에서 양파 반 개와 대파만 썰어 가면 간편식도 물기 없이 볶기 쉽고 마지막 향을 살릴 수 있습니다.',
        productIds: ['8987385839'],
      },
    ],
    internalLinks: [{ href: '/camping', label: '취사 가능한 캠핑장 찾아보기' }],
  },
  {
    slug: 'camp-sundae-bokkeum',
    title: '캠핑 순대볶음 만드는 법｜순대 안 터지고 양념 안 타는 순서',
    description: '순대 500g과 양배추 300g 기준으로 자르는 두께, 채소를 먼저 익히는 이유, 순대를 넣고 젓는 방법, 들깨와 깻잎을 넣는 순간까지 순서대로 설명합니다.',
    category: '캠핑 요리', contentStyle: 'shoppable-scene-v2', salesFormat: 'food-recipe', coverLabel: '들깨향 순대볶음',
    quietProductIds: ['9587833030'], shortcutProductId: '6645728981', status: 'published', publishAt: publishedAt, updatedAt: publishedAt, reviewed: true,
    productIds: sundaeIds,
    cover: photo({
      url: '/prep-images/camp-sundae-bokkeum-cover.webp',
      alt: '들깨와 깻잎을 올린 순대볶음, 찰순대, 만능양념, 순대볶음 밀키트와 캠핑 그리들',
      prompt: '실제 상품 사진을 참고한 캠핑 순대볶음 완성 장면에 감성 한글 제목 들깨향 순대볶음을 넣은 대표 썸네일.', ids: sundaeIds,
      tags: [{ productId: '8960028100', x: 15, y: 23 }, { productId: '6854193615', x: 79, y: 22 }, { productId: '6645728981', x: 84, y: 70 }, { productId: '9587833030', x: 51, y: 62 }],
    }),
    sections: [
      {
        heading: '먼저 준비할 것｜3인분, 순대 500g 기준',
        text: '찰순대 500g, 양배추 300g, 양파 1/2개, 당근 1/3개, 대파 1대, 깻잎 10장을 준비합니다. 양념은 고추장 2큰술, 고춧가루 2큰술, 간장 2큰술, 설탕 1작은술, 올리고당 1큰술, 다진 마늘 1큰술을 섞고 물 120ml를 따로 챙깁니다. 시판 만능양념장을 쓰면 직접 만든 양념과 겹쳐 넣지 말고 포장 사용량을 기준으로 시작하세요. 마지막에 넣을 들깻가루 1~2큰술은 별도 통에 담습니다. 순대 1kg 제품은 이 레시피 한 번에 전부 쓰는 양이 아니므로 절반만 계량합니다.',
        productIds: ['8960028100', '6854193615'],
        image: photo({
          url: '/prep-images/camp-sundae-bokkeum-prep.webp',
          alt: '빈 그리들 주위에 찰순대와 썬 순대, 양념장, 순대볶음 밀키트, 양배추와 깻잎을 펼친 준비 장면',
          prompt: '빈 캠핑 그리들 주변에 찰순대, 양념장, 순대볶음 밀키트와 손질 채소를 펼친 조리 전 장면. 표시나 글자는 없음.', ids: sundaeIds,
          tags: [{ productId: '8960028100', x: 17, y: 52 }, { productId: '6854193615', x: 82, y: 46 }, { productId: '6645728981', x: 84, y: 75 }, { productId: '9587833030', x: 50, y: 52 }],
        }),
      },
      {
        heading: '캠핑장 가기 전｜순대는 1.5~2cm, 채소는 익는 순서대로 담기',
        text: '차가운 순대는 너무 얇게 자르면 볶을 때 속이 빠지기 쉽습니다. 칼에 물을 살짝 묻혀 1.5~2cm 두께로 자르고, 자른 단면을 서로 붙이지 않게 용기에 담습니다. 양배추는 4cm 네모, 양파는 1cm 폭, 당근은 3mm 두께, 대파는 4cm 길이로 썹니다. 깻잎은 꼭지를 떼고 1cm 폭으로 잘라 별도 봉투에 둡니다. 양배추·양파·당근은 한 통, 순대와 깻잎은 각각 따로 담아야 현장에서 넣는 순서가 섞이지 않습니다. 모든 냉장 재료는 아이스박스에서 보관하다 조리 직전에 꺼냅니다. 순대가 차갑고 단단하더라도 억지로 얇게 썰지 말고 굵기를 유지하세요. 그리들에 올린 뒤 양념의 수분과 증기로 중심까지 데우는 편이 모양을 지키기 쉽습니다.',
        productIds: [],
      },
      {
        heading: '1단계｜중불에서 단단한 채소부터 3~4분 볶기',
        text: '그리들을 중불로 2분 예열하고 식용유 1큰술을 두릅니다. 당근과 양파를 먼저 넣어 1분, 양배추와 대파 흰 부분을 넣어 2~3분 더 볶습니다. 양배추 숨이 절반쯤 죽고 가장자리가 투명해지기 시작하면 양념과 물 100ml를 넣어 고르게 풉니다. 센 불로 시작하면 고추장과 설탕이 바닥에서 먼저 탈 수 있으므로 양념이 들어간 뒤에는 계속 중불을 유지합니다. 바닥을 주걱으로 밀었을 때 붉은 양념이 천천히 다시 모이는 정도면 순대를 넣기 좋은 농도입니다.',
        productIds: ['6854193615'],
      },
      {
        heading: '2단계｜순대는 마지막에 넣고 주걱 두 개로 들어 올리기',
        text: '순대를 양념 위에 넓게 올리고 뒤집개 두 개로 아래에서 들어 올리듯 채소와 섞습니다. 한 손으로 세게 누르거나 원을 그리며 저으면 껍질이 찢어집니다. 중불에서 3~4분, 순대 단면까지 김이 오르고 중심이 따뜻해질 때까지만 익히세요. 양념이 너무 되직하면 남겨 둔 물을 1큰술씩 가장자리에 넣습니다. 불을 끄기 30초 전에 깻잎과 들깻가루를 넣어 두 번만 크게 섞습니다. 깻잎은 숨이 살짝 죽되 초록색이 남아 있을 때 멈춰야 향이 또렷합니다. 접시에 덜기 전 순대 한 조각의 가운데를 확인해 차갑지 않은지 보고, 차갑다면 누르지 말고 뚜껑을 1분 덮어 약불로 더 데웁니다.',
        productIds: ['8960028100'],
        image: photo({
          url: '/prep-images/camp-sundae-bokkeum-cooking.webp',
          alt: '양배추가 익은 그리들에 순대를 넣고 주걱으로 들어 올리듯 섞는 조리 장면',
          prompt: '캠핑 그리들에서 채소를 먼저 익힌 뒤 굵은 순대를 넣어 부드럽게 섞는 순대볶음 조리 장면.', ids: sundaeIds,
          tags: [{ productId: '8960028100', x: 50, y: 51 }, { productId: '6854193615', x: 84, y: 20 }, { productId: '6645728981', x: 85, y: 75 }, { productId: '9587833030', x: 50, y: 70 }],
        }),
      },
      {
        heading: '순대가 터지거나 양념이 탈 때｜젓지 말고 물을 가장자리에',
        text: '순대가 갈라지기 시작하면 더 젓지 말고 불을 약불로 낮춘 뒤 채소를 순대 위로 덮어 1분 데웁니다. 이미 나온 속은 버리지 말고 양념에 섞으면 농도를 잡는 데 도움이 됩니다. 양념이 바닥에 눌어붙으면 불에서 그리들을 잠깐 내리고 물 2큰술을 가장자리로 넣어 나무주걱으로 바닥만 긁습니다. 국물이 너무 많으면 순대를 계속 익혀 졸이지 말고 순대를 먼저 접시에 덜어 둔 뒤 채소와 양념만 중강불에서 1분 줄이고 다시 합치세요. 순대를 오래 가열해 수분을 날리면 껍질이 터지고 속이 퍽퍽해집니다.',
        productIds: [],
      },
      {
        heading: '재료를 하나씩 챙기기 귀찮은 날｜순대볶음 밀키트',
        text: '순대와 채소, 양념을 각각 준비하기 어렵다면 2~3인분 순대볶음 밀키트를 고를 수 있습니다. 구성과 중량, 보관법은 판매 페이지와 실제 포장에서 먼저 확인하고, 포장에 적힌 조리 순서를 우선 따르세요. 밀키트도 양념이 들어간 뒤에는 센 불보다 중불이 안전합니다. 순대는 눌러 젓지 말고 아래에서 들어 올리며 섞고, 집에서 깻잎 몇 장과 들깻가루 한 봉지만 더 챙겨 마지막 30초에 넣으면 향을 살리기 좋습니다.',
        productIds: ['6645728981'],
      },
    ],
    internalLinks: [{ href: '/camping', label: '취사 가능한 캠핑장 찾아보기' }],
  },
  {
    slug: 'camp-dakgalbi',
    title: '캠핑 닭갈비 만드는 법｜닭은 익고 양배추는 타지 않는 순서',
    description: '양념 닭 500g에 양배추와 고구마를 더해 닭은 속까지 익히고 채소는 타지 않게 볶는 순서를 정리했습니다. 국물이 많거나 바닥이 탈 때 고치는 방법도 담았습니다.',
    category: '캠핑 요리', contentStyle: 'shoppable-scene-v2', salesFormat: 'food-recipe', coverLabel: '자작하게 캠핑 닭갈비',
    quietProductIds: ['9587833030'], shortcutProductId: '344228023', status: 'published', publishAt: publishedAt, updatedAt: publishedAt, reviewed: true,
    productIds: dakgalbiIds,
    cover: photo({
      url: '/prep-images/camp-dakgalbi-cover.webp',
      alt: '양배추와 고구마를 넣어 완성한 닭갈비, 양념 닭갈비, 볶음소스와 캠핑 그리들',
      prompt: '실제 상품 사진을 참고한 캠핑 닭갈비 완성 장면에 감성 한글 제목 자작하게 캠핑 닭갈비를 넣은 대표 썸네일.', ids: dakgalbiIds,
      tags: [{ productId: '344228023', x: 17, y: 29 }, { productId: '7404695153', x: 83, y: 27 }, { productId: '9587833030', x: 52, y: 65 }],
    }),
    sections: [
      {
        heading: '먼저 준비할 것｜2~3인분, 양념 닭 500g 기준',
        text: '양념 닭갈비 500g, 양배추 250g, 고구마 150g, 양파 1/2개, 대파 1대, 깻잎 8장, 떡 150g을 준비합니다. 양념이 부족할 때 보충할 볶음소스는 포장 사용량에 맞춰 따로 덜고 물 100~120ml를 챙기세요. 이미 양념된 닭에 시판 소스를 처음부터 많이 더하면 짜고 쉽게 탈 수 있습니다. 먼저 제품 양념만으로 익힌 뒤 마지막에 맛을 보고 한 숟갈씩 보충합니다. 떡은 딱딱하다면 조리 전 깨끗한 물에 10분 담갔다 물기를 빼고, 포장에 별도 조리 안내가 있으면 그 지시를 우선합니다.',
        productIds: ['344228023', '7404695153'],
        image: photo({
          url: '/prep-images/camp-dakgalbi-prep.webp',
          alt: '빈 그리들 주위에 양념 닭갈비, 볶음소스, 양배추, 고구마, 떡과 깻잎을 순서대로 둔 장면',
          prompt: '빈 캠핑 그리들 주변에 양념 닭갈비와 볶음소스, 크기를 맞춘 채소와 떡을 펼친 조리 전 준비 장면.', ids: dakgalbiIds,
          tags: [{ productId: '344228023', x: 16, y: 25 }, { productId: '7404695153', x: 79, y: 18 }, { productId: '9587833030', x: 50, y: 50 }],
        }),
      },
      {
        heading: '캠핑장 가기 전｜고구마 5mm, 양배추 4cm로 맞추기',
        text: '고구마는 껍질을 깨끗이 씻어 5mm 두께 반달 모양으로 썹니다. 두꺼우면 닭이 다 익은 뒤에도 속이 단단하게 남습니다. 양배추는 4cm 네모, 양파는 1cm 폭, 대파는 4cm 길이로 자릅니다. 깻잎은 1cm 폭으로 잘라 별도 봉투에 담습니다. 양념 닭과 손질 채소는 서로 다른 밀폐용기에 넣고 아이스박스 안쪽에서 차갑게 보관합니다. 닭을 만진 집게와 도마는 익은 음식에 다시 쓰지 않습니다. 현장에서 뚜껑이나 호일을 바로 덮을 수 있게 그리들 옆에 준비해 두면 첫 증기 조리 단계가 끊기지 않습니다.',
        productIds: [],
      },
      {
        heading: '1단계｜양배추를 바닥에 깔고 닭을 가운데 올려 3~4분',
        text: '그리들을 중강불로 2분 예열한 뒤 식용유를 아주 얇게 두릅니다. 양배추와 양파를 바닥에 넓게 깔고 고구마를 가장자리에 놓은 다음 양념 닭을 가운데 올립니다. 물 100ml를 가장자리로 붓고 뚜껑을 덮어 중강불에서 끓어오를 때까지 3~4분 둡니다. 채소가 닭 밑에서 완충 역할을 해 달고 매운 양념이 바닥에 바로 붙는 것을 줄입니다. 김이 충분히 차고 가장자리 국물이 보글거리면 뚜껑을 열고 중불로 낮춥니다. 닭 조각이 서로 붙어 있으면 이때 집게로 하나씩 떼어 줍니다.',
        productIds: ['344228023'],
      },
      {
        heading: '2단계｜중불에서 13~15분, 큰 닭 조각을 잘라 확인하기',
        text: '중불에서 13~15분 볶되 2~3분마다 바닥에서 위로 크게 뒤집습니다. 처음부터 계속 젓지 않아도 됩니다. 7분쯤 지났을 때 떡과 대파를 넣고, 국물이 한쪽에만 고이지 않도록 재료를 고르게 펼칩니다. 10분쯤에는 고구마 한 조각을 집어 중심이 단단한지 먼저 확인하면 남은 시간을 판단하기 쉽습니다. 완성 기준은 고구마에 젓가락이 힘주지 않고 들어가고, 가장 큰 닭 조각을 잘랐을 때 중심에 붉거나 반투명한 살이 남지 않는 상태입니다. 닭이 덜 익었으면 물 2큰술을 보충해 뚜껑을 2분 덮습니다. 다 익은 뒤 깻잎을 넣어 30초만 섞고 불을 끕니다.',
        productIds: ['344228023'],
        image: photo({
          url: '/prep-images/camp-dakgalbi-cooking.webp',
          alt: '양배추와 고구마 위에서 양념 닭갈비를 자작하게 볶는 캠핑 조리 장면',
          prompt: '캠핑 그리들에서 양배추와 고구마, 떡을 양념 닭갈비와 중불로 자작하게 볶는 핵심 조리 장면.', ids: dakgalbiIds,
          tags: [{ productId: '344228023', x: 49, y: 52 }, { productId: '7404695153', x: 85, y: 19 }, { productId: '9587833030', x: 50, y: 71 }],
        }),
      },
      {
        heading: '국물이 많거나 바닥이 탈 때｜닭을 더 익히기 전에 분리하기',
        text: '닭과 고구마가 다 익었는데 국물이 많다면 닭을 가장자리로 밀고 가운데를 비운 뒤 뚜껑을 연 채 중강불에서 1~2분 줄입니다. 닭을 계속 세게 볶으며 졸이면 살이 마를 수 있습니다. 바닥에서 탄 냄새가 나면 즉시 불을 약하게 하고 그리들을 잠깐 옮긴 뒤 물 2큰술을 가장자리로 넣습니다. 검게 탄 부분은 억지로 섞지 말고 깨끗한 쪽 재료만 옮겨 담는 편이 낫습니다. 싱거울 때는 볶음소스를 한 숟갈만 넣고 30초 끓여 확인합니다. 짜면 양배추를 더 넣고 뚜껑을 덮어 숨을 죽여 간을 나눕니다.',
        productIds: ['7404695153'],
      },
      {
        heading: '닭 손질과 양념을 줄이고 싶은 날｜양념 닭갈비로 바로 시작',
        text: '생닭을 자르고 양념을 계량하는 과정을 줄이고 싶다면 양념된 한입 닭갈비를 선택할 수 있습니다. 받은 상품의 보관·해동·조리법을 먼저 확인하고, 실제 포장 지시를 이 글보다 우선하세요. 양배추와 고구마만 손질해 바닥에 깔면 현장 준비가 짧아집니다. 간편 제품도 닭은 반드시 속까지 익혀야 합니다. 가장 큰 조각을 잘라 중심을 확인하고, 애매하면 물을 조금 넣어 뚜껑을 덮어 더 익힌 뒤 마지막에 뚜껑을 열어 소스 농도를 맞춥니다.',
        productIds: ['344228023'],
      },
    ],
    internalLinks: [{ href: '/camping', label: '취사 가능한 캠핑장 찾아보기' }],
  },
  {
    slug: 'camp-ojingeo-bokkeum',
    title: '캠핑 오징어볶음 만드는 법｜물 안 생기고 질기지 않게 볶기',
    description: '손질 오징어의 물기를 빼는 준비부터 채소를 먼저 볶고 오징어는 마지막 몇 분만 익히는 순서, 국물이 생겼을 때 질겨지지 않게 농도를 잡는 방법을 안내합니다.',
    category: '캠핑 요리', contentStyle: 'shoppable-scene-v2', salesFormat: 'food-recipe', coverLabel: '탱글한 오징어볶음',
    quietProductIds: ['9587833030'], shortcutProductId: '8042525293', status: 'published', publishAt: publishedAt, updatedAt: publishedAt, reviewed: true,
    productIds: squidIds,
    cover: photo({
      url: '/prep-images/camp-ojingeo-bokkeum-cover.webp',
      alt: '완성된 오징어볶음과 손질 오징어, 전용 양념, 냉동 오징어볶음, 캠핑 그리들',
      prompt: '실제 상품 사진을 참고한 캠핑 오징어볶음 완성 장면에 감성 한글 제목 탱글한 오징어볶음을 넣은 대표 썸네일.', ids: squidIds,
      tags: [{ productId: '9169365991', x: 17, y: 28 }, { productId: '9262718994', x: 80, y: 23 }, { productId: '8042525293', x: 83, y: 72 }, { productId: '9587833030', x: 51, y: 63 }],
    }),
    sections: [
      {
        heading: '먼저 준비할 것｜2~3인분, 손질 오징어 500g 기준',
        text: '손질 오징어 500g, 양파 1개, 당근 1/3개, 대파 1대, 양배추 150g을 준비합니다. 직접 양념한다면 고추장 2큰술, 고춧가루 2큰술, 간장 1과 1/2큰술, 설탕 1큰술, 다진 마늘 1큰술, 맛술 또는 물 1큰술을 섞습니다. 오징어볶음 전용 소스를 쓰면 직접 양념을 함께 넣지 말고 포장 안내량보다 적게 시작해 마지막에 보충합니다. 국물을 걸쭉하게 잡을 전분물은 감자전분 1작은술과 물 1큰술을 섞어 별도 통에 담습니다. 손질 오징어 2미 세트는 실제 중량을 확인해 500g 안팎만 사용합니다.',
        productIds: ['9169365991', '9262718994'],
        image: photo({
          url: '/prep-images/camp-ojingeo-bokkeum-prep.webp',
          alt: '빈 그리들 주위에 손질 오징어, 오징어볶음 양념, 냉동 간편식과 썬 채소를 둔 준비 장면',
          prompt: '빈 캠핑 그리들 주변에 손질 오징어, 전용 볶음양념, 냉동 오징어볶음과 손질 채소를 펼친 조리 전 장면.', ids: squidIds,
          tags: [{ productId: '9169365991', x: 18, y: 25 }, { productId: '9262718994', x: 79, y: 19 }, { productId: '8042525293', x: 83, y: 70 }, { productId: '9587833030', x: 50, y: 51 }],
        }),
      },
      {
        heading: '캠핑장 가기 전｜해동한 오징어 물기를 닦고 1cm로 자르기',
        text: '냉동 오징어는 포장 안내에 맞춰 냉장 해동하고 체에 밭쳐 물기를 뺀 뒤 키친타월로 겉물을 눌러 닦습니다. 몸통은 1cm 폭의 링이나 1×5cm 크기 띠로, 다리는 긴 부분만 5cm 길이로 자릅니다. 너무 가늘게 썰면 채소가 익기 전에 질겨집니다. 양파와 양배추는 1cm 폭, 당근은 3mm 두께, 대파는 4cm 길이로 썹니다. 오징어와 채소, 양념을 각각 다른 용기에 담아 차갑게 운반하세요. 현장에서 불을 켠 뒤 손질하면 그리들이 달아오른 상태로 오래 기다리게 되므로 모든 재료를 넣는 순서대로 미리 펼칩니다.',
        productIds: [],
      },
      {
        heading: '1단계｜중강불에서 채소를 먼저 4~5분 볶기',
        text: '그리들을 중강불로 2분 충분히 예열하고 식용유 1큰술을 두릅니다. 당근과 양파를 먼저 2분 볶고 양배추와 대파 흰 부분을 넣어 2~3분 더 볶습니다. 양파 가장자리가 투명하고 양배추가 살짝 휘어지지만 중심은 아삭한 상태에서 멈춥니다. 채소가 완전히 익을 때까지 기다리면 오징어를 넣은 뒤 너무 물러집니다. 채소를 그리들 바깥쪽으로 밀어 가운데 빈 공간을 만들고 불을 강하게 올려 20~30초 다시 달굽니다. 이 뜨거운 자리에 물기 뺀 오징어를 올립니다.',
        productIds: [],
      },
      {
        heading: '2단계｜오징어와 양념은 마지막 2~3분만',
        text: '오징어를 가운데에 펼쳐 30초 두었다가 크게 뒤집습니다. 표면이 반투명에서 불투명한 흰색으로 바뀌고 다리가 말리기 시작하면 양념을 넣습니다. 채소와 함께 중강불에서 1~2분만 빠르게 섞으세요. 몸통 전체가 불투명해지고 가장 두꺼운 부분까지 익으면 바로 불을 줄입니다. 국물이 묽으면 준비한 전분물을 다시 저어 절반만 둘러 넣고 20~30초 끓입니다. 농도를 본 뒤 부족할 때만 나머지를 넣습니다. 전분물을 넣고 오래 끓이면 소스가 떡처럼 굳으므로 바닥에 윤기 있게 붙는 순간 불을 끕니다. 대파 초록 부분과 통깨는 불을 끈 뒤 섞어 남은 열로 숨만 죽이면 색과 향을 지키기 좋습니다.',
        productIds: ['9169365991', '9262718994'],
        image: photo({
          url: '/prep-images/camp-ojingeo-bokkeum-cooking.webp',
          alt: '채소가 익은 그리들에 오징어와 붉은 양념을 넣어 짧게 볶는 장면',
          prompt: '채소를 먼저 볶은 뜨거운 캠핑 그리들에 손질 오징어와 양념을 넣어 빠르게 익히는 핵심 장면.', ids: squidIds,
          tags: [{ productId: '9169365991', x: 47, y: 48 }, { productId: '9262718994', x: 83, y: 18 }, { productId: '8042525293', x: 85, y: 72 }, { productId: '9587833030', x: 50, y: 70 }],
        }),
      },
      {
        heading: '물이 생겼을 때｜오징어를 먼저 덜어야 질겨지지 않아요',
        text: '오징어에서 물이 많이 나왔다면 계속 졸이지 말고 익은 오징어만 먼저 접시에 덜어 둡니다. 채소와 국물은 그리들에 넓게 펴 중강불로 1분 줄인 뒤 전분물을 조금 넣어 농도를 잡고 오징어를 다시 넣어 20초만 섞습니다. 이렇게 해야 오징어를 오래 가열해 질겨지는 일을 줄일 수 있습니다. 너무 맵거나 짜면 물을 한꺼번에 붓지 말고 양파나 양배추를 추가해 1~2분 익힙니다. 양념이 타기 시작하면 불에서 내리고 뜨거운 물 1큰술로 바닥을 풀어 약불에서 마무리합니다.',
        productIds: [],
      },
      {
        heading: '손질과 짧은 타이밍이 부담스러운 날｜냉동 오징어볶음',
        text: '오징어 해동과 손질, 양념 계량을 줄이고 싶다면 순한맛 냉동 오징어볶음을 선택할 수 있습니다. 정확한 해동 여부와 조리 시간은 받은 상품의 포장 안내를 우선하세요. 그리들은 충분히 예열하되 제품을 한곳에 산처럼 쌓지 말고 넓게 펼칩니다. 내용물이 익은 뒤 국물이 많으면 오징어 건더기를 먼저 한쪽으로 옮기고 소스만 잠깐 줄이는 원칙은 같습니다. 대파나 양파를 더할 때는 채소를 먼저 볶은 다음 제품을 넣어 오징어 가열 시간을 늘리지 않습니다.',
        productIds: ['8042525293'],
      },
    ],
    internalLinks: [{ href: '/camping', label: '취사 가능한 캠핑장 찾아보기' }],
  },
  {
    slug: 'camp-kimchi-fried-rice',
    title: '캠핑 김치볶음밥 맛있게 만드는 법｜질지 않고 고슬하게 볶기',
    description: '찬밥 420g에 볶음김치와 햄을 넣어 만드는 2~3인분 김치볶음밥입니다. 밥알을 먼저 풀고 김치 수분을 날린 뒤 눌려 볶는 순서와 질거나 마를 때 고치는 법을 담았습니다.',
    category: '캠핑 요리', contentStyle: 'shoppable-scene-v2', salesFormat: 'food-recipe', coverLabel: '눌려 볶는 김치볶음밥',
    quietProductIds: ['9587833030'], shortcutProductId: '68121544', status: 'published', publishAt: publishedAt, updatedAt: publishedAt, reviewed: true,
    productIds: kimchiRiceIds,
    cover: photo({
      url: '/prep-images/camp-kimchi-fried-rice-cover.webp',
      alt: '고슬하게 완성한 김치볶음밥과 볶음김치, 슬라이스햄, 냉동 김치볶음밥, 캠핑 그리들',
      prompt: '실제 상품 사진을 참고한 캠핑 김치볶음밥 완성 장면에 감성 한글 제목 눌려 볶는 김치볶음밥을 넣은 대표 썸네일.', ids: kimchiRiceIds,
      tags: [{ productId: '7032698357', x: 15, y: 27 }, { productId: '8243714135', x: 80, y: 27 }, { productId: '68121544', x: 82, y: 73 }, { productId: '9587833030', x: 51, y: 62 }],
    }),
    sections: [
      {
        heading: '먼저 준비할 것｜2~3인분, 찬밥 420g 기준',
        text: '차갑게 식힌 밥 420g(공기밥 약 2그릇), 볶음김치 250g, 슬라이스햄 120g, 대파 1/2대, 식용유 1큰술을 준비합니다. 김치 국물 3큰술은 따로 담고, 고추장은 김치 맛이 약할 때만 1/2~1큰술 준비합니다. 마무리용 참기름 1작은술과 김가루·통깨도 별도 용기에 둡니다. 볶음김치 5kg 대용량 제품과 햄 1kg 제품은 전부 쓰는 양이 아니므로 집에서 정확히 덜어 가야 현장에서 간이 흔들리지 않습니다. 밥은 따뜻한 채 밀폐하지 말고 충분히 식힌 뒤 냉장 보관해 가져옵니다.',
        productIds: ['7032698357', '8243714135'],
        image: photo({
          url: '/prep-images/camp-kimchi-fried-rice-prep.webp',
          alt: '빈 그리들 주위에 볶음김치, 슬라이스햄, 냉동 김치볶음밥, 찬밥과 대파를 펼친 준비 장면',
          prompt: '빈 캠핑 그리들 주변에 볶음김치, 슬라이스햄, 냉동 김치볶음밥, 찬밥과 대파를 펼친 조리 전 준비 장면. 표시나 글자는 없음.', ids: kimchiRiceIds,
          tags: [{ productId: '7032698357', x: 14, y: 45 }, { productId: '8243714135', x: 83, y: 34 }, { productId: '68121544', x: 82, y: 75 }, { productId: '9587833030', x: 50, y: 47 }],
        }),
      },
      {
        heading: '캠핑장 가기 전｜밥알은 풀고 김치 국물은 분리하기',
        text: '찬밥은 용기에 담기 전에 젓가락이나 주걱으로 큰 덩어리를 미리 풀어 둡니다. 현장에서 단단한 밥덩이를 억지로 누르면 일부는 떡지고 일부는 차갑게 남습니다. 햄은 1cm 네모, 볶음김치는 긴 조각이 있으면 1~2cm 길이로 자르고 대파는 송송 썹니다. 김치 건더기와 국물을 분리해 담아야 밥 상태를 보며 수분을 조절할 수 있습니다. 밥과 햄, 볶음김치는 조리 직전까지 아이스박스에서 차갑게 보관합니다. 볶음밥은 재료를 빠르게 이어 넣어야 하므로 식용유, 참기름, 김가루까지 손 닿는 순서대로 둡니다.',
        productIds: [],
      },
      {
        heading: '1단계｜햄 1분, 김치 2분 순서로 수분부터 날리기',
        text: '그리들을 중강불로 2분 예열한 뒤 식용유 1큰술과 대파를 넣어 20초 볶습니다. 파 향이 올라오면 햄을 넣어 1분, 가장자리에 옅은 갈색이 생길 때까지 볶습니다. 햄을 바깥으로 밀고 가운데에 볶음김치를 넣어 2분 볶으세요. 김치 국물이 넓게 번지지 않고 주걱으로 밀었을 때 바닥이 잠깐 보이면 수분이 알맞게 줄어든 상태입니다. 이때 김치 맛을 보고 약하면 고추장을 1/2큰술만 넣어 20초 볶습니다. 짠맛이 충분하면 고추장은 생략합니다.',
        productIds: ['7032698357', '8243714135'],
      },
      {
        heading: '2단계｜찬밥을 얇게 펴고 30~40초씩 기다리기',
        text: '풀어 둔 찬밥을 넣고 주걱 옆면으로 큰 덩어리만 자르듯 나눕니다. 김치와 햄이 고루 섞이면 밥을 그리들 전체에 1cm 안팎 두께로 얇게 펴고 중강불에서 30~40초 건드리지 않습니다. 바닥에서 지글거리는 소리가 나면 크게 뒤집고 다시 펼치는 과정을 3~4번 반복해 총 4~5분 볶습니다. 밥알이 서로 떨어지고 표면에 윤기가 돌며, 바닥에 닿은 일부 밥알이 노릇해지면 완성입니다. 주걱으로 한쪽을 밀었을 때 밥이 덩어리째 따라오지 않고 알알이 흩어지는지도 확인하세요. 불을 끈 뒤 참기름 1작은술과 김가루, 통깨를 섞습니다. 참기름을 센 불에서 오래 볶지 않아야 향이 남습니다.',
        productIds: [],
        image: photo({
          url: '/prep-images/camp-kimchi-fried-rice-cooking.webp',
          alt: '김치와 햄을 볶은 그리들에 찬밥을 얇게 눌러 펴는 김치볶음밥 조리 장면',
          prompt: '볶음김치와 햄 위에 찬밥을 넣고 캠핑 그리들에 얇게 눌러 고슬하게 볶는 핵심 조리 장면.', ids: kimchiRiceIds,
          tags: [{ productId: '7032698357', x: 19, y: 24 }, { productId: '8243714135', x: 84, y: 24 }, { productId: '68121544', x: 83, y: 72 }, { productId: '9587833030', x: 51, y: 68 }],
        }),
      },
      {
        heading: '밥이 질거나 마를 때｜김치 국물은 한 숟갈씩',
        text: '밥이 질게 뭉치면 물이나 양념을 더 넣지 말고 최대한 얇게 펴 중강불에서 40초 기다린 뒤 뒤집습니다. 그리들 가운데에 수분이 고이면 재료를 가장자리로 넓혀 증기가 빠질 길을 만듭니다. 반대로 밥이 마르고 양념이 고루 묻지 않으면 따로 둔 김치 국물을 가장자리로 1큰술만 넣어 빠르게 섞습니다. 한꺼번에 3큰술을 붓지 말고 밥알 상태를 보며 반복하세요. 너무 짜면 설탕이나 물보다 찬밥을 반 공기 더 넣어 간을 나눕니다. 바닥이 타기 시작하면 탄 부분을 긁어 섞지 말고 깨끗한 쪽 밥만 옮겨 담습니다.',
        productIds: [],
      },
      {
        heading: '밥과 김치를 따로 챙기기 귀찮은 날｜냉동 김치볶음밥',
        text: '밥을 식혀 가져오고 김치 양을 맞추는 과정까지 줄이고 싶다면 200g 단위 냉동 김치볶음밥을 선택할 수 있습니다. 2명이 먹는 양은 식사량과 곁들임에 따라 달라지므로 필요한 봉지 수를 판매 페이지에서 확인하세요. 해동 여부와 조리법은 실제 포장 안내를 우선합니다. 그리들에 넣었을 때도 한곳에 쌓지 말고 얇게 펼쳐 30~40초씩 기다렸다 뒤집으면 수분을 날리기 쉽습니다. 대파와 햄을 먼저 볶아 둔 뒤 냉동 볶음밥을 넣으면 별도 양념 없이도 식감과 건더기를 보완할 수 있습니다.',
        productIds: ['68121544'],
      },
    ],
    internalLinks: [{ href: '/camping', label: '취사 가능한 캠핑장 찾아보기' }],
  },
];

for (const article of newArticles) {
  if (protectedSlugs.has(article.slug)) throw new Error(`기존 글과 URL 충돌: ${article.slug}`);
  store.articles.push(article);
}
store.version += 1;
validateShape(store);
for (const article of newArticles) {
  const errors = publicationErrors(article, store);
  if (errors.length) throw new Error(`${article.slug}: ${errors.join(', ')}`);
}
const afterProtectedHash = crypto.createHash('sha256').update(JSON.stringify(store.articles.slice(0, protectedSlugs.size))).digest('hex');
if (beforeHash !== afterProtectedHash) throw new Error('기존 글이 변경되었습니다.');
fs.writeFileSync(dataPath, `${JSON.stringify(store, null, 2)}\n`);
console.log(JSON.stringify({ preservedExistingArticles: protectedSlugs.size, addedArticles: newArticles.map(article => article.slug), addedProducts: Object.keys(productDetails).filter(id => store.products.some(product => product.id === id)), version: store.version }, null, 2));
