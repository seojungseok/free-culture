import {getIntro,getInfo,getRestaurantIntro} from '@/lib/tourExtra';
import overviews from '@/data/place-overviews.json';
import {eventContentsText} from '@/lib/eventContents';
import type {TripStop} from './planner';
import {getArticle} from './articles';
import extra from '@/data/planner-place-overviews.json';
const brief=(text:unknown,n=130)=>eventContentsText(typeof text==='string'?text:'').replace(/\s+/g,' ').trim().slice(0,n);
export function stopFacts(s:TripStop):TripStop{
 const id=s.id.split(':').slice(1).join(':'),intro=s.kind==='food'?getRestaurantIntro(id):s.kind==='place'?getIntro(id):undefined;
 const access=s.kind==='place'?getInfo(id).filter(v=>/장애인.*편의|무장애|휠체어|출입.*통로/.test(v.name)).map(v=>v.text).join(' / '):'';
 const parking=brief(intro?.parking,160);
 const article=s.kind==='place'?getArticle(id):undefined;
 const excerpt=article?.content.split(/\n\s*\n/).find(p=>p.trim()&&!/^#/.test(p.trim()))?.replace(/\*\*|__|`/g,'');
 return {...s,summary:s.summary||brief(s.kind==='place'?((extra.overviews as Record<string,string>)[id]||(overviews as Record<string,string>)[id]||excerpt):intro?.firstmenu),hoursText:brief(intro?.usetime),restText:brief(intro?.restdate),parkingText:parking,
  parkingAvailable:!!parking&&!/불가|없음|불가능|문의|미확인|미운영/.test(parking)&&/가능|주차장|\d+\s*대|있음/.test(parking),
  accessText:brief(access,240),wheelchairEntry:/휠체어.{0,12}(진입|출입|접근).{0,6}가능/.test(access)&&!/불가|제한|계단/.test(access),
  walk:/공원|산책|둘레길|수목원|정원|생태|숲길/.test(s.title),culture:s.kind==='event'||/박물관|미술관|전시관|과학관|문학관/.test(s.title)};
}
