import type {PrepArticle, PrepChecklistItem} from './weekend-prep/types';

export function reviewedPrepAffiliate(item: PrepChecklistItem) {
  const product = item.affiliate;
  if (product?.reviewed !== true || !['coupang-api','registered-product'].includes(product.source) || typeof product.productName !== 'string' || !product.productName.trim() || typeof product.url !== 'string' || typeof product.checkedAt !== 'string' || !Number.isFinite(Date.parse(product.checkedAt))) return undefined;
  try {
    const url = new URL(product.url);
    if (url.protocol !== 'https:' || url.hostname !== 'link.coupang.com' || url.username || url.password || url.port) return undefined;
    if(product.source==='registered-product'){
      const source=new URL(product.sourceUrl||'');
      if(source.protocol!=='https:'||!['www.coupang.com','m.coupang.com'].includes(source.hostname)||source.username||source.password||source.port||!/^\/vp\/products\/\d+$/.test(source.pathname)||!product.reviewedAt||!Number.isFinite(Date.parse(product.reviewedAt)))return undefined;
      if(url.searchParams.get('pageKey')&&url.searchParams.get('pageKey')!==source.pathname.split('/').at(-1))return undefined;
    }
    return product;
  } catch { return undefined; }
}

export function prepProductId(url: string): number | undefined {
  try {
    const value = new URL(url).searchParams.get('pageKey');
    if (!value || !/^\d+$/.test(value)) return undefined;
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : undefined;
  } catch { return undefined; }
}

// These are existing guides to the same dish. Never borrow an unrelated product.
const ingredientGuides: Record<string, string> = {
  'camp-seafood-pot-table': 'camping-seafood-hotpot-ingredient-checklist',
  'camp-jeyuk-bokkeum': 'autumn-20260920-jeyuk-bokkeum-ingredient-checklist',
  'camp-sundae-bokkeum': 'autumn-20260920-sundae-bokkeum-ingredient-checklist',
  'camp-dakgalbi': 'autumn-20260920-dakgalbi-ingredient-checklist',
  'camp-ojingeo-bokkeum': 'camping-squid-stir-fry-ingredients',
  'camp-kimchi-fried-rice': 'camping-kimchi-fried-rice-ingredients',
};

export function prepGuideItems(article: PrepArticle, articles: PrepArticle[]) {
  if (article.checklist?.length) return prepShoppingItems(article, article.checklist);
  if (article.shoppingItems?.length) return prepShoppingItems(article, article.shoppingItems);
  const source = articles.find(value => value.slug === ingredientGuides[article.slug] && value.status === 'published');
  return prepShoppingItems(article, source?.checklist || []);
}

// Retain reviewed product records and their original tracking URLs in the store.
// A cooking shopping list contains food; ordinary household tools are not purchases.
export function prepShoppingItems(article: PrepArticle, items: PrepChecklistItem[]) {
  if (!/요리|재료/.test(article.category)) return items;
  return items.filter(item => item.group !== 'common' && !/냄비|국자|국그릇|접시|식판|조리.?집게|도마|뒤집개|수저|젓가락|생수|조리용 물/.test(item.label));
}

export function prepDishName(title: string) {
  return title.split(/[|｜]/)[0].replace(/^(가을 대표 요리|가을 캠핑|캠핑)\s*/, '').replace(/\s*재료 체크리스트.*$/, '').replace(/\s*(맛있게\s*)?(만드는 법|끓이는 법|굽는 법)$/, '').trim();
}

export function photoGuideItems(items: PrepChecklistItem[], common = false) {
  const matching = items.filter(item => common ? item.group === 'common' : item.group !== 'common');
  return [...matching.filter(item => item.required), ...matching.filter(item => !item.required)].slice(0, 4);
}
