import type {PrepArticle, PrepChecklistItem} from './weekend-prep/types';

export function reviewedPrepAffiliate(item: PrepChecklistItem) {
  const product = item.affiliate;
  if (product?.reviewed !== true || product.source !== 'coupang-api' || typeof product.productName !== 'string' || !product.productName.trim() || typeof product.url !== 'string' || typeof product.checkedAt !== 'string' || !Number.isFinite(Date.parse(product.checkedAt))) return undefined;
  try {
    const url = new URL(product.url);
    if (url.protocol !== 'https:' || url.hostname !== 'link.coupang.com' || url.username || url.password || url.port) return undefined;
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
  if (article.checklist?.length) return article.checklist;
  const source = articles.find(value => value.slug === ingredientGuides[article.slug] && value.status === 'published');
  return source?.checklist || [];
}

export function photoGuideItems(items: PrepChecklistItem[], common = false) {
  const matching = items.filter(item => common ? item.group === 'common' : item.group !== 'common');
  return [...matching.filter(item => item.required), ...matching.filter(item => !item.required)].slice(0, 4);
}
