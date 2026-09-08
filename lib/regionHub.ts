import { getByRegion } from './data';
import { getPlaces, getKidTours, type TourSpot } from './tour';
import { filterCourses } from './courses';
import { getCityTours } from './cityTours';
import { filterCamps } from './camping';
import { filterRestaurants } from './food';
import { getPetTravelPlaces } from './petTravel';
import { todayYmd, weekendRangeYmd } from './dates';
import { fmtRange } from './format';
import type { RegionFilterItem } from '@/components/RegionContentFilter';
export type HubSection = { key: string; label: string; note: string; href?: string; items: RegionFilterItem[] };
export function regionHub(area: string, code: string) {
 const weekend = weekendRangeYmd(todayYmd());
 const events = getByRegion(area).filter(e => e.startDate <= weekend.end && e.endDate >= weekend.start);
 const eventItem = (e: typeof events[number]): RegionFilterItem => ({id:'event-'+e.id,href:'/event/'+e.id,title:e.title,image:e.imgUrl || '',meta:fmtRange(e.startDate,e.endDate),badge:'문화행사'});
 const placeItem = (p: TourSpot): RegionFilterItem => ({id:'place-'+p.id,href:'/places/spot/'+p.id,title:p.title,image:p.image,meta:p.addr,badge:p.isKid?'아이와':'나들이'});
 const sections: HubSection[] = [
 {key:'free',label:'무료로 즐기기',note:'이번 주말 일정에 포함되며 무료로 분류된 행사입니다. 이용 조건은 상세 안내를 확인하세요.',href:`/events?region=${code}&price=free`,items:events.filter(e=>e.priceType==='free').map(eventItem)},
 {key:'kids',label:'아이와 함께',note:'기존 아이 동반 분류의 장소와 행사입니다. 연령·이용 조건을 확인하세요.',items:[...getKidTours(area).map(placeItem),...events.filter(e=>e.audiences?.includes('kids')).map(eventItem)]},
 {key:'places',label:'나들이',note:'주소와 방문정보를 확인하며 골라보세요.',href:`/places/${code}`,items:getPlaces({area}).map(placeItem)},
 {key:'date',label:'데이트',note:'기존 커플 추천 분류에 포함된 이번 주말 행사입니다.',items:events.filter(e=>e.audiences?.includes('couple')).map(eventItem)},
 {key:'course',label:'여행코스',note:'발행된 코스의 경유지와 이동 순서를 확인하세요.',href:`/course/${code}`,items:filterCourses({area}).map(c=>({id:'course-'+c.id,href:'/course/c/'+c.id,title:c.title,image:c.image,meta:c.duration,badge:'여행코스'}))},
 {key:'city',label:'시티투어',note:'자료 기반 코스 안내입니다. 이번 주말 운행 여부는 공식 운영처에서 확인하세요.',items:getCityTours().filter(c=>c.area===area).map(c=>({id:'city-'+c.id,href:'/city-tour/'+c.id,title:c.title,image:c.image,meta:'운행일·예약 조건 확인',badge:'시티투어'}))},
 {key:'events',label:'문화행사',note:'이번 주말 날짜와 겹치는 전시·공연입니다.',href:`/events?region=${code}`,items:events.map(eventItem)},
 {key:'camping',label:'캠핑',note:'시설·예약·현장 이용 조건을 확인하세요.',href:`/camping/region/${code}`,items:filterCamps({area}).map(c=>({id:'camp-'+c.id,href:'/camping/'+c.id,title:c.name,image:c.image,meta:c.sigungu || area,badge:'캠핑'}))},
 {key:'food',label:'맛집탐방',note:'관광정보에 등록된 음식점입니다. 인기 순위가 아닙니다.',href:`/food/${code}`,items:filterRestaurants({area}).map(p=>({id:'food-'+p.id,href:'/food/spot/'+p.id,title:p.title,image:p.image,meta:p.addr,badge:'맛집탐방'}))},
 {key:'pet',label:'반려동물 여행',note:'동반 가능 구역과 제한 조건을 상세에서 확인하세요.',items:getPetTravelPlaces().filter(p=>p.area===area).map(p=>({id:'pet-'+p.id,href:'/pet-travel/'+p.id,title:p.title,image:p.image || '',meta:p.address || p.addr || area,badge:'반려동물'}))},
 ].filter(s=>s.items.length).map(s=>({...s,items:[...s.items].sort((a,b)=>Number(Boolean(b.image))-Number(Boolean(a.image)))}));
 const pools=['events','places','kids','date','course','city'].map(key=>sections.find(s=>s.key===key)?.items || []);
 const recommended:RegionFilterItem[]=[],seen=new Set<string>();
 for(let i=0;i<8&&recommended.length<8;i++)for(const pool of pools){const item=pool[i];if(item&&!seen.has(item.href)&&recommended.length<8){seen.add(item.href);recommended.push(item);}}
 return {sections,recommended,weekend};
}
