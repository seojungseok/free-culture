import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {accessiblePlaces,getAccessiblePlace} from '@/lib/publicDiscovery';
import {ACCESS_FIELDS,ACCESSIBLE_SOURCE,familyFields} from '@/lib/accessible.mjs';
import PublicProgramDetail from '@/components/PublicProgramDetail';
import mediaData from '@/data/experience-media.json';
export const revalidate=3600;
type Props={params:Promise<{id:string}>};
export function generateStaticParams(){return accessiblePlaces().slice(0,4).map(place=>({id:place.id}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{const place=getAccessiblePlace((await params).id);if(!place)return {title:'장소를 찾을 수 없습니다',robots:{index:false,follow:true}};const title=`${place.title} 이동·영유아 편의정보 — ${place.area}`,description=`${place.title} · ${place.address}. ${Object.values(place.facts).join(' ')}`.slice(0,160);return {title,description,alternates:{canonical:'/accessible-travel/'+place.id},openGraph:{title,description,url:'/accessible-travel/'+place.id,type:'website'}};}
export default async function AccessibleDetail({params}:Props){const place=getAccessiblePlace((await params).id);if(!place)notFound();const groups=[{title:'출입구·이동 동선·시설',keys:['exit','route','publictransport','parking','elevator','restroom','auditorium','room','handicapetc','wheelchair']},{title:'영유아·가족 편의',keys:familyFields},{title:'시각·청각 안내',keys:Object.keys(ACCESS_FIELDS).filter(key=>!['exit','route','publictransport','parking','elevator','restroom','auditorium','room','handicapetc','wheelchair',...familyFields].includes(key))}];const image=(mediaData.images as unknown as Record<string,{src:string;width:number;height:number}>)[place.image];return <PublicProgramDetail title={place.title} description={place.address+' · 출입구, 이동 동선과 편의시설의 제공기관 안내를 확인하세요.'} path={'/accessible-travel/'+place.id} category="이동·영유아 편의정보" categoryHref="/accessible-travel" area={place.area} status="제공기관 편의 안내" sections={[
 ...groups.map(group=>({title:group.title,facts:group.keys.filter(key=>place.facts[key]).map(key=>[ACCESS_FIELDS[key as keyof typeof ACCESS_FIELDS],place.facts[key]] as [string,string])})).filter(group=>group.facts.length),
 {title:'방문 전 확인',paragraphs:['제공기관의 설명을 그대로 안내합니다. ‘대여 가능’은 출입구나 모든 이동 동선의 이용 가능 여부를 뜻하지 않습니다. 계단·경사·모래길 등 제한 설명을 함께 확인하세요.','출발 전 엘리베이터 가동 여부, 화장실 위치, 대여 시간과 이용 조건을 운영처에 확인해 주세요.']},
 {title:'위치',facts:[['주소',place.address]]}
 ]} bookingFacts={[["지역",place.area],["주소",place.address]]} officialUrl={place.officialUrl} source={ACCESSIBLE_SOURCE} sourceLabel="한국관광공사 무장애 여행 API" checkedAt={place.checkedAt} image={image?.src?image:undefined} schema={{'@type':'Place',name:place.title,address:place.address}}/>;}
