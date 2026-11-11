// The browser and receiver share the same event contract. Do not add identity data.
export const affiliateEvents = ['affiliate_click', 'affiliate_impression', 'affiliate_save'];
export const affiliateProviders = ['toss', 'waug', 'stay', 'coupang'];
export const affiliatePlacements = [
  'top', 'article', 'popup', 'home_plan', 'article_plan',
  'home_winter_hero', 'food_deal_rail',
  'home_camp', 'home_daily', 'home_travel', 'home_stay',
  'home_rail', 'rail',
  'prep_checklist', 'prep_image', 'prep_product_list',
];

export function normalizeAffiliateEvent(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (!affiliateEvents.includes(value.event) || !affiliateProviders.includes(value.provider) || !affiliatePlacements.includes(value.placement)) return null;
  if (typeof value.page !== 'string' || value.page.length > 250 || !/^\/[a-zA-Z0-9/_-]*$/.test(value.page)) return null;
  if (value.productId != null && (!Number.isSafeInteger(value.productId) || value.productId <= 0)) return null;
  return {
    event: value.event, provider: value.provider, placement: value.placement, page: value.page,
    ...(value.productId != null ? { productId: value.productId } : {}),
  };
}
