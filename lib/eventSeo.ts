import type { CultureEvent } from './types';

// A price range / eligibility discount is not a confirmed standard ticket price.
// Ticket inventory is not supplied by the culture API, so never infer InStock.
export function eventOffer(event: Pick<CultureEvent,'priceType'|'priceMin'|'priceMax'>) {
  const price = event.priceType === 'free' ? 0
    : ['paid','cheap'].includes(event.priceType) && typeof event.priceMin === 'number'
      && Number.isFinite(event.priceMin) && event.priceMin > 0 && event.priceMin === event.priceMax
      ? event.priceMin : undefined;
  return price === undefined ? undefined : {'@type':'Offer',price,priceCurrency:'KRW'};
}
