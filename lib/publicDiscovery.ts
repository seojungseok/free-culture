import learning from '@/data/learning-classes.json';
import accessible from '@/data/accessible-travel.json';
import {normalizeLearningClass,isFamilyClass,isWeekendClass,registrationState} from './learning.mjs';
import {normalizeAccessible} from './accessible.mjs';
export type LearningClass=NonNullable<ReturnType<typeof normalizeLearningClass>>;
export type AccessiblePlace=NonNullable<ReturnType<typeof normalizeAccessible>>;
export type DiscoveryQuery=Record<string,string|string[]|undefined>;
export const queryValue=(query:DiscoveryQuery,key:string)=>typeof query[key]==='string'?query[key] as string:'';
export const todayIso=()=>new Date(Date.now()+9*3600000).toISOString().slice(0,10);
export const sourceDate=(value:string)=>new Date(value).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'});
export const classCollections={
 all:{title:'우리 동네 문화·취미 강좌',description:'공공기관에서 여는 문화·취미 강좌를 찾아보세요. 접수기간, 수강료, 운영요일과 교육대상을 함께 비교할 수 있습니다.',href:'/classes'},
 free:{title:'수강료 0원 문화·취미 강좌',description:'수강료가 0원으로 등록된 공공 문화·취미 강좌입니다. 준비물·재료비·교재비는 별도일 수 있으니 운영기관 안내를 확인해 주세요.',href:'/classes/free'},
 weekend:{title:'주말에 배우는 문화·취미 강좌',description:'토요일이나 일요일 운영이 명시된 강좌를 모았습니다. 하루 체험과 여러 주에 걸친 강좌가 함께 있으니 전체 교육기간을 확인해 주세요.',href:'/classes/weekend'},
 family:{title:'아이·가족 문화·체험 강좌',description:'대상 또는 강좌명에 어린이·청소년·가족이 명시된 프로그램입니다. 학년·연령과 보호자 동반 여부는 각 기관의 안내를 확인해 주세요.',href:'/classes/family'},
};
export type ClassCollection=keyof typeof classCollections;
export function currentClasses(collection:ClassCollection='all',query:DiscoveryQuery={},today=todayIso()){
 const area=queryValue(query,'area'),q=queryValue(query,'q').trim().slice(0,100),cost=queryValue(query,'cost'),day=queryValue(query,'day'),audience=queryValue(query,'audience'),status=queryValue(query,'status');
 return (learning.courses as LearningClass[]).filter(course=>course.end>=today)
 .filter(course=>status==='all'||['접수기간 내','접수예정'].includes(registrationState(course,today)))
 .filter(course=>collection!=='free'||course.tuition===0).filter(course=>collection!=='weekend'||isWeekendClass(course)).filter(course=>collection!=='family'||isFamilyClass(course))
 .filter(course=>!area||course.area===area).filter(course=>cost!=='free'||course.tuition===0).filter(course=>day!=='weekend'||isWeekendClass(course)).filter(course=>audience!=='family'||isFamilyClass(course))
 .filter(course=>!q||[course.title,course.description,course.venue,course.institution,course.address].join(' ').includes(q))
 .sort((a,b)=>Number(registrationState(a,today)==='접수예정')-Number(registrationState(b,today)==='접수예정')||(a.registrationEnd||'9999').localeCompare(b.registrationEnd||'9999')||b.referenceDate.localeCompare(a.referenceDate));
}
export const learningUpdatedAt=learning.refresh.checkedAt;
export const accessibleUpdatedAt=accessible.refresh.checkedAt;
export function accessiblePlaces(){return Object.values(accessible.places) as AccessiblePlace[];}
export function discoveryPageHref(path:string,query:DiscoveryQuery,page:number){const params=new URLSearchParams();for(const [key,value]of Object.entries(query))if(typeof value==='string'&&key!=='page'&&value)params.set(key,value);params.set('page',String(page));return path+'?'+params;}
