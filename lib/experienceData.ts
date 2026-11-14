import rural from '@/data/rural-experiences.json';
import youth from '@/data/youth-experiences.json';
import science from '@/data/science-experiences.json';
import venueData from '@/data/experience-venues.json';
import mediaData from '@/data/experience-media.json';
import {SIDO_SLUG} from './classify';
import {todayIso,queryValue,type DiscoveryQuery} from './publicDiscovery';
import {ruralThemes,experienceCity,isYouthExperience} from './experiences.mjs';

export type ExperienceKind='family'|'science'|'rural';
export const experienceTopics={
 family:{title:'어린이·청소년 체험 프로그램',short:'가족·청소년 체험',description:'만들기·캠프·탐방·문화 활동을 지역별로 찾아보세요. 프로그램을 누르면 활동 내용, 일정, 참가비와 대상을 이곳에서 확인할 수 있습니다.'},
 science:{title:'과학관 교육·체험 프로그램',short:'과학관 교육·행사',description:'국립중앙과학관과 인천학생과학관의 교육 일정을 모았습니다. 실험·만들기·생태 프로그램의 내용과 대상, 교육일과 접수일을 함께 확인하세요.'},
 rural:{title:'농촌·어촌 체험마을',short:'농촌·어촌 체험',description:'과일 따기와 농산물 수확, 두부·떡 만들기, 공예·생태 체험을 지역별로 찾아보세요. 각 마을의 체험 목록과 시설, 위치와 문의처를 안내합니다.'},
};
type Raw=Record<string,unknown>;
type Venue={title:string;address:string;phone:string;imageSource:string;overview:string;homepage:string;checkedAt:string;latitude:number;longitude:number;source:string};
export type ExperienceMedia={src:string;width:number;height:number;source:string;checkedAt:string};
const venues=venueData.venues as Record<string,Venue>,images=mediaData.images as Record<string,ExperienceMedia|{failedAt:string;src?:never}>;
const str=(value:unknown)=>typeof value==='string'?value:'';
const strings=(value:unknown)=>Array.isArray(value)?value.filter((item):item is string=>typeof item==='string'):[];
export type Experience={id:string;kind:ExperienceKind;title:string;area:string;city:string;summary:string;content:string[];activities:string[];programs:string[];institution:string;address:string;phone:string;audience:string;price:string;free:boolean;period:string;start:string;end:string;registration:string;registrationEnd:string;status:string;facilities:string;officialUrl:string;source:string;checkedAt:string;detailCheckedAt:string;referenceDate:string;image?:ExperienceMedia;imageAlt:string;imageKind?:'poster';imageSourcePage?:string;venueOverview:string;venueCheckedAt:string;venueSource:string;latitude:number;longitude:number;active:boolean};
export const experienceUpdatedAt={rural:rural.refresh.checkedAt,family:youth.refresh.checkedAt,science:science.refresh.checkedAt};
function toExperience(kind:ExperienceKind,row:Raw):Experience{
 const id=str(row.id),venue=venues[kind+'/'+id],programs=strings(row.programs),title=str(row.title);
 const candidates=[str(row.imageSource),venue?.imageSource||''].filter(Boolean),sourceImage=candidates.find(source=>images[source.replace(/^http:/,'https:')]?.src)||candidates[0]||'',image=images[sourceImage.replace(/^http:/,'https:')];
 const content=strings(row.content),activities=strings(row.activities),address=str(row.address)||venue?.address||'',city=experienceCity(address)||str(row.city);
 const fullSummary=kind==='rural'?programs.slice(0,5).join(' · '):content[0]||str(row.summary)||`${str(row.audience)} 대상 · ${str(row.period)}`;
 const summary=fullSummary.length>180?fullSummary.slice(0,177)+'…':fullSummary;
 const poster=sourceImage===str(row.imageSource)&&row.imageKind==='poster';
 return {id,kind,title,area:str(row.area),city,summary,content,activities,programs,institution:str(row.institution),address,phone:str(row.phone)||venue?.phone||'',audience:str(row.audience),price:str(row.price),free:row.free===true,period:str(row.period),start:str(row.start),end:str(row.end),registration:str(row.registration),registrationEnd:str(row.registrationEnd),status:str(row.sourceStatus),facilities:str(row.facilities),officialUrl:str(row.homepage)||str(row.officialUrl)||venue?.homepage||'',source:str(row.source),checkedAt:experienceUpdatedAt[kind],detailCheckedAt:str(row.detailCheckedAt),referenceDate:str(row.referenceDate),image:image?.src?image:undefined,imageAlt:sourceImage===venue?.imageSource?`${venue.title} 전경 (한국관광공사 제공)`:poster?`${title} 공식 안내 이미지 (${str(row.imageCredit)})`:`${title} (공공기관 제공 사진)`,imageKind:poster?'poster':undefined,imageSourcePage:poster?str(row.imageSourcePage):undefined,venueOverview:venue?.overview||'',venueCheckedAt:venue?.checkedAt||'',venueSource:venue?.source||'',latitude:Number(row.latitude)||venue?.latitude||0,longitude:Number(row.longitude)||venue?.longitude||0,active:row.active!==false};
}
const ALL:Experience[]=[...(youth.records as unknown as Raw[]).map(row=>toExperience('family',row)),...(science.records as unknown as Raw[]).map(row=>toExperience('science',row)),...(rural.records as unknown as Raw[]).map(row=>toExperience('rural',row))];
const BY_ID=new Map(ALL.map(item=>[item.kind+'/'+item.id,item]));
export const experienceHref=(item:Pick<Experience,'kind'|'id'>)=>`/experiences/${item.kind}/${item.id}`;
export const experienceRegionHref=(area:string)=>(SIDO_SLUG as Record<string,string>)[area]?'/experiences/region/'+(SIDO_SLUG as Record<string,string>)[area]:'/experiences';
export const isExperienceKind=(kind:string):kind is ExperienceKind=>Object.hasOwn(experienceTopics,kind);
export const getExperience=(kind:string,id:string)=>BY_ID.get(kind+'/'+id);
export function allExperiences(){return ALL;}
export function currentExperiences(today=todayIso()){
 return ALL.filter(item=>item.active&&(!item.end||item.end>=today)).filter(item=>item.kind!=='family'||isYouthExperience(item));
}
export const ruralExperiences=()=>currentExperiences().filter(item=>item.kind==='rural');
export const youthExperiences=()=>currentExperiences().filter(item=>item.kind==='family');
export const scienceExperiences=()=>currentExperiences().filter(item=>item.kind==='science');
export function experienceStatus(item:Experience,today=todayIso()){
 if(!item.active)return '현재 운영 여부 확인';
 if(item.end&&item.end<today)return '활동 종료';
 if(item.registrationEnd&&item.registrationEnd<today)return '접수기간 지남';
 return item.kind==='rural'?'계절별 체험':item.status||'활동 일정 안내';
}
export function filterExperiences(kind:ExperienceKind|undefined,query:DiscoveryQuery={},region='',today=todayIso()){
 const area=region||queryValue(query,'area'),city=queryValue(query,'city'),q=queryValue(query,'q').trim().toLocaleLowerCase().slice(0,100),theme=queryValue(query,'theme'),cost=queryValue(query,'cost');
 const result=currentExperiences(today).filter(item=>!kind||item.kind===kind).filter(item=>!area||item.area===area).filter(item=>!city||item.city===city).filter(item=>cost!=='free'||item.free)
  .filter(item=>!q||[item.title,item.summary,item.institution,item.address,...item.content,...item.activities,...item.programs].join(' ').toLocaleLowerCase().includes(q))
  .filter(item=>!theme||item.kind!=='rural'||!Object.hasOwn(ruralThemes,theme)||ruralThemes[theme as keyof typeof ruralThemes].test.test(item.programs.join(' ')))
  .sort((a,b)=>Number(experienceStatus(a,today)==='접수기간 지남')-Number(experienceStatus(b,today)==='접수기간 지남')||Number(!!a.start&&a.start<today)-Number(!!b.start&&b.start<today)||Number(!!b.image)-Number(!!a.image)||(a.start&&a.start>=today?a.start:a.end||'9999').localeCompare(b.start&&b.start>=today?b.start:b.end||'9999')||a.title.localeCompare(b.title,'ko'));
 if(kind)return result;
 const mixed:Experience[]=[];
 for(const closed of [false,true]){
  const buckets=Object.keys(experienceTopics).map(kind=>result.filter(item=>item.kind===kind&&(experienceStatus(item,today)==='접수기간 지남')===closed));
  for(let n=0;n<Math.max(...buckets.map(bucket=>bucket.length));n++)for(const bucket of buckets)if(bucket[n])mixed.push(bucket[n]);
 }
 return mixed;
}
export function relatedExperiences(item:Experience){return currentExperiences().filter(other=>other.id!==item.id||other.kind!==item.kind).sort((a,b)=>Number(b.area===item.area)-Number(a.area===item.area)||Number(b.kind===item.kind)-Number(a.kind===item.kind)||Number(!!b.image)-Number(!!a.image)).slice(0,4);}
export function indexableExperience(item:Experience){
 if(!item.active||item.end&&item.end<todayIso())return false;
 if(item.kind==='family'&&!isYouthExperience(item))return false;
 if(item.kind==='rural')return !!item.address&&(item.venueOverview.length>=120||item.programs.length>=5&&!!item.phone);
 return item.content.join(' ').length+item.activities.join(' ').length+item.venueOverview.length>=120&&!!(item.period||item.start)&&!!item.audience;
}
export function experienceDescription(item:Experience){return `${item.area} ${item.city} ${item.title}${item.start?' · '+item.start+' ~ '+item.end:''}. ${item.summary} ${item.kind==='rural'?'체험 프로그램·시설·주소·문의처':`${item.price||'비용 안내'}·참여대상·신청 방법`}를 확인하세요.`.replace(/\s+/g,' ').slice(0,160);}
export function experienceSeoTitle(item:Experience){return `${item.title} — ${item.area} ${item.city}${item.start?' · '+item.start:''} ${experienceTopics[item.kind].short}`;}
