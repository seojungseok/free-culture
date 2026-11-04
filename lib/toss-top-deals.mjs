import {currentProducts} from './sharelink-policy.mjs';
import {homeDealGroup} from '../scripts/sharelink/home-deals.mjs';

function isOriginalTossLink(link) {
 try { const url=new URL(link);return url.protocol==='https:'&&url.hostname==='toss.shopping'; }
 catch { return false; }
}
// Only provider-confirmed, unexpired daily deals belong in the global strip.
export function selectTopDeals(feed, now) {
 return currentProducts(feed, now).filter(p =>
  Number.isFinite(Date.parse(p.endAt)) && Date.parse(p.endAt) > now &&
  Number.isFinite(p.discountRate) && p.discountRate > 0 && p.discountRate <= 100 &&
  homeDealGroup(p.name) && !/보냉백|보냉가방|피크닉매트|돗자리|휴대용수저/.test(p.name) &&
  isOriginalTossLink(p.links?.home) &&
  typeof p.name === 'string' && typeof p.image === 'string' &&
  Number.isFinite(p.price) && p.price >= 0
 );
}
