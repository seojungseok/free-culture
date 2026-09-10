import {getAllPlaces} from './tour';
import {getAllEvents} from './data';
import {getAllRestaurants} from './food';
import {getTickets} from './tickets';
import published from '@/data/waug/published.json';
import type {NearItem} from './nearSearch';
import {eventContentsText} from './eventContents';

export function nearbyPool():NearItem[]{
 const publicSlugs=new Set(published.articles.map(a=>a.slug));
 return [
  ...getAllPlaces().filter(p=>!/(?:20\d{2}|축제|페어|박람회|비엔날레|페스티벌|전시회)/.test(p.title)).map(p=>({id:'place:'+p.id,title:p.title,area:p.area,image:p.image,url:`/places/spot/${p.id}`,kind:'place' as const,lat:Number(p.mapy),lng:Number(p.mapx)})),
  ...getAllEvents().map(e=>({id:'event:'+e.id,title:eventContentsText(e.title),area:e.area,image:e.imgUrl||'',url:`/event/${e.id}`,kind:'event' as const,lat:Number(e.gpsY),lng:Number(e.gpsX),endDate:e.endDate})),
  ...getAllRestaurants().map(r=>({id:'food:'+r.id,title:r.title,area:r.area,image:r.image,url:`/food/spot/${r.id}`,kind:'food' as const,lat:Number(r.mapy),lng:Number(r.mapx)})),
  ...getTickets().filter(a=>publicSlugs.has(a.slug)&&Date.parse(a.publishedAt)<=Date.now()).map(a=>({id:'ticket:'+a.slug,title:a.location?.label||a.placeName,area:a.location?.area||a.area,image:a.thumbnail.url,url:`/tickets/${a.slug}`,kind:'ticket' as const,lat:a.location?.status==='verified'?a.location.lat:NaN,lng:a.location?.status==='verified'?a.location.lng:NaN,published:true})),
 ];
}
