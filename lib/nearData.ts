import {getAllPlaces} from './tour';
import {getAllEvents} from './data';
import {getAllRestaurants} from './food';
import {getAllCamps} from './camping';
import {getAllFestivals,festivalHref,festivalStatus,fmtMd} from './festivals';
import {getPetTravelPlaces} from './petTravel';
import {getPlaygroundCandidates,getPlaygroundGuides,getGuideTour,getGuideState} from './playgroundData';
import {currentExperiences,experienceHref} from './experienceData';
import {accessiblePlaces,currentClasses,publicClassHref} from './publicDiscovery';
import {dateCourseGeo} from './dateCourses';
import {eventContentsText} from './eventContents';
import {addressArea} from './learning.mjs';
import {validPlacePoint,type NearItem,type NearPoint} from './nearSearch';
import {SIDO_LIST} from './classify';

const point=(latitude:unknown,longitude:unknown):NearPoint=>({lat:Number(latitude),lng:Number(longitude)});
const areaOf=(area:string|undefined,address?:string)=>SIDO_LIST.includes(area||'')?area!:addressArea(address||area);
const keyForAddress=(address:string)=>address.trim().replace(/\s+/g,' ');
let staticItems:NearItem[]|undefined;
const addressPoints=new Map<string,NearPoint|null>();
function indexAddress(address:string,p:NearPoint){
  const key=keyForAddress(address);
  if(!key||!validPlacePoint(p)||!/[로길동리읍면]\s+[\d-]+/.test(key))return;
  if(!addressPoints.has(key)){addressPoints.set(key,p);return;}
  const old=addressPoints.get(key);
  if(old&&(old.lat!==p.lat||old.lng!==p.lng))addressPoints.set(key,null);
}
function fixedItems():NearItem[]{
  const places=getAllPlaces(),foods=getAllRestaurants(),camps=getAllCamps();
  const tourPoints=new Map(places.map(p=>[p.id,point(p.mapy,p.mapx)]));
  for(const p of [...places,...foods,...camps])indexAddress(p.addr,point(p.mapy,p.mapx));
  const facilities=getPlaygroundCandidates(),guideByFacility=new Map<string,ReturnType<typeof getPlaygroundGuides>[number]>();
  for(const guide of getPlaygroundGuides().filter(getGuideState)){
    for(const id of guide.facilityIds)guideByFacility.set(id,guide);
  }
  return [
    // An undated old fair was imported as a tourist place. Permanent venues with
    // "축제", "박람회" or a historic year in their names remain searchable.
    ...places.filter(p=>p.id!=='3432447').map(p=>({id:'place:'+p.id,title:p.title,area:p.area,image:p.image,url:'/places/spot/'+p.id,kind:'place' as const,...point(p.mapy,p.mapx)})),
    ...foods.map(p=>({id:'food:'+p.id,title:p.title,area:p.area,image:p.image,url:'/food/spot/'+p.id,kind:'food' as const,...point(p.mapy,p.mapx)})),
    ...camps.filter(p=>p.listed!==false&&!/휴장|휴업|폐장|폐업|운영중단/.test(p.operationStatus||'')).map(p=>({id:'camp:'+p.id,title:p.name,area:p.area,image:p.image,url:'/camping/'+p.id,kind:'camp' as const,note:p.types.join(' · '),...point(p.mapy,p.mapx)})),
    ...getPetTravelPlaces().map(p=>({id:'pet:'+p.id,title:p.title,area:areaOf(p.area,p.address),image:p.image||'',url:'/pet-travel/'+p.id,kind:'pet' as const,...point(p.mapy,p.mapx)})),
    ...accessiblePlaces().map(p=>({id:'access:'+p.id,title:p.title,area:p.area,image:p.image||'',url:'/accessible-travel/'+p.id,kind:'access' as const,...(validPlacePoint(point(p.latitude,p.longitude))?point(p.latitude,p.longitude):tourPoints.get(p.id)||point(null,null))})),
    ...facilities.map(p=>{
      const g=guideByFacility.get(p.id);
      return {id:'playground:'+p.id,title:g?.name||p.name,area:p.area,kind:'playground' as const,
        image:g?getGuideTour(g).photos[0]?.src||'':'',note:g?'시설 이용안내':p.place+' · 운영시간 확인 필요',
        url:g?'/playgrounds/'+g.slug:'/playgrounds?view=registry&facility='+p.id+'#registry',...point(p.latitude,p.longitude)};
    }),
    ...dateCourseGeo().map(p=>({id:'date:'+p.id,title:p.title+' 출발 데이트 코스',area:p.area,image:p.image,url:'/date/c/'+p.id,kind:'date' as const,note:'첫 카페 기준 · '+p.park,lat:p.lat,lng:p.lng})),
  ];
}
export function nearbyPool():NearItem[]{
  staticItems??=fixedItems();
  return [
    ...staticItems,
    ...getAllEvents().map(e=>({id:'event:'+e.id,title:eventContentsText(e.title),area:e.area,image:e.imgUrl||'',url:'/event/'+e.id,kind:e.genreKey==='festival'?'festival' as const:'event' as const,...point(e.gpsY,e.gpsX),endDate:e.endDate,expiresAt:e.expiresAt,note:fmtMd(e.startDate)+' ~ '+fmtMd(e.endDate)})),
    ...getAllFestivals().filter(f=>!f.id.startsWith('event-')&&festivalStatus(f)!=='unknown').map(f=>({id:'festival:'+f.id,title:f.title,area:f.area,image:f.image,url:festivalHref(f),kind:'festival' as const,...point(f.mapy,f.mapx),endDate:f.endDate,note:fmtMd(f.startDate)+' ~ '+fmtMd(f.endDate)})),
    ...currentExperiences().map(p=>({id:p.kind+':'+p.id,title:p.title,area:p.area,image:p.image?.src||'',url:experienceHref(p),
      kind:p.kind==='rural'?'rural' as const:'experience' as const,note:p.kind==='rural'?'예약 문의':p.institution,...(validPlacePoint(point(p.latitude,p.longitude))?point(p.latitude,p.longitude):addressPoints.get(keyForAddress(p.address))||point(null,null))})),
    ...currentClasses().filter(p=>!(/온라인|비대면|우편통신|모바일/.test(p.method)&&!/오프라인|혼합|병행/.test(p.method))).map(p=>({id:'class:'+p.id,title:p.title,area:p.area,image:'',url:publicClassHref(p),kind:'class' as const,note:p.venue,...(addressPoints.get(keyForAddress(p.address))||point(null,null))})),
  ];
}
