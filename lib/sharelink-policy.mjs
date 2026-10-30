import {maintenanceStart,maintenanceEnd} from '../scripts/sharelink/maintenance.mjs';
export const freshnessMs=6*3600000;
export function currentProducts(feed,now=Date.now()) {
 const checked=Date.parse(feed?.checkedAt);
 if(!Number.isFinite(checked)||checked>now||now-checked>=freshnessMs||!Array.isArray(feed?.products))return [];
 // The announced outage also disables old links. Afterward require a new successful feed.
 if(now>=maintenanceStart && (now<maintenanceEnd || checked<maintenanceEnd))return [];
 return feed.products.filter(p=>!p.endAt||Number.isFinite(Date.parse(p.endAt))&&Date.parse(p.endAt)>now);
}
export function currentHomeProducts(feed,now=Date.now()) {
 return currentProducts(feed,now).filter(p=>p.homeFeature&&p.links?.home&&!/구강|스프레이|냄비|프라이팬/.test(p.name||''))
  .sort((a,b)=>Number(Boolean(b.endAt))-Number(Boolean(a.endAt)));
}
