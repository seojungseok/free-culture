import { withSearchMetadata } from '@/lib/searchMetadata';
import type {Metadata} from 'next';
import {notFound,permanentRedirect} from 'next/navigation';
import {allClasses,getPublicClass,getClassEditorial,publicClassHref,learningUpdatedAt,todayIso,indexablePublicClass} from '@/lib/publicDiscovery';
import {LEARNING_SOURCE} from '@/lib/learning.mjs';
import PublicProgramDetail from '@/components/PublicProgramDetail';
import {programmeCover} from '@/lib/programmeMedia';
import {programmeAvailability,availabilityLabels} from '@/lib/programmeAvailability.mjs';
export const revalidate=60;
type Props={params:Promise<{id:string}>};
export function generateStaticParams(){return allClasses().filter(course=>course.end>=todayIso()).slice(0,4).map(course=>({id:course.id}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{const course=getPublicClass((await params).id);if(!course)return {title:'강좌를 찾을 수 없습니다',robots:{index:false,follow:true}};const {title,description}=getClassEditorial(course);return withSearchMetadata({title,description,alternates:{canonical:publicClassHref(course)},robots:{index:indexablePublicClass(course),follow:true},openGraph:{title,description,url:publicClassHref(course),type:'website'}});}
export default async function ClassDetail({params}:Props){const requested=(await params).id,course=getPublicClass(requested);if(!course)notFound();if(course.id!==requested)permanentRedirect(publicClassHref(course));const state=programmeAvailability(course),sessions=course.sessions||[course],editorial=getClassEditorial(course),tuition=course.tuition===0?'수강료 0원':course.tuition===null?'공개자료에 미기재':course.tuition.toLocaleString()+'원',registration=[course.registrationStart,course.registrationEnd].filter(Boolean).join(' ~ ');return <PublicProgramDetail title={editorial.title} description={editorial.lead} path={publicClassHref(course)} category="문화·취미 강좌" categoryHref="/classes" area={course.area} status={availabilityLabels[state]} cover={programmeCover(course)} sessions={sessions} canApply={state==='open'} notice={state==='open'?undefined:state==='upcoming'?'아직 접수 시작 전입니다. 등록된 접수기간과 모집 안내를 확인해 주세요.':'현재 접수 가능한 강좌가 아닙니다. 접수 마감·교육 종료·모집 상태 미상 자료는 현재 목록과 추천에서 제외합니다.'} sections={[
 {title:'강좌 내용',paragraphs:[editorial.introduction,course.description,...editorial.paragraphs]},
 {title:'교육 일정과 대상',facts:[['공식 강좌명',course.title],['교육기간',`${course.start} ~ ${course.end}`],['운영요일',course.weekdays],['교육시간',[course.startTime,course.endTime].filter(Boolean).join(' ~ ')],['교육대상',course.audience],['교육방식',course.method],['수강료',tuition]]},
 {title:'접수 방법과 준비',facts:[['접수기간',registration],['접수방법',course.registrationMethod],['선정방법',course.selection],['정원',course.capacity?course.capacity+'명 (잔여석 수가 아닙니다)':'']],paragraphs:['수강료 외 재료비·교재비, 거주지·연령 제한과 준비물은 운영기관의 모집 안내를 확인해 주세요.']},
 {title:'장소와 문의처',facts:[['장소',course.venue],['주소',course.address],['운영기관',course.institution],['문의전화',course.phone],['원자료 기준일',course.referenceDate]]}
 ]} bookingFacts={[["수강료",tuition],["접수기간",registration],["교육기간",`${course.start} ~ ${course.end}`],["교육대상",course.audience]]} officialUrl={course.homepage} phone={course.phone} source={LEARNING_SOURCE} sourceLabel="지방자치단체·교육청 / 전국평생학습강좌표준데이터 API" checkedAt={learningUpdatedAt} schema={{'@type':'Course',name:course.title,description:course.description,provider:{'@type':'Organization',name:course.institution},hasCourseInstance:{'@type':'CourseInstance',startDate:course.start,endDate:course.end,courseMode:course.method,location:{'@type':'Place',name:course.venue,address:course.address}}}}/>;}
