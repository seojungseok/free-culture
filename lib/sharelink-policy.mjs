export const freshnessMs=6*3600000;
export function currentProducts(feed,now=Date.now()) {
 const checked=Date.parse(feed?.checkedAt);
 if(!Number.isFinite(checked)||checked>now||now-checked>=freshnessMs||!Array.isArray(feed?.products))return [];
 return feed.products.filter(p=>!p.endAt||Number.isFinite(Date.parse(p.endAt))&&Date.parse(p.endAt)>now);
}
