import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {SIDO_LIST,SIDO_SLUG} from '@/lib/classify';
import {currentExperiences,experienceRegionHref} from '@/lib/experienceData';
import type {DiscoveryQuery} from '@/lib/publicDiscovery';
import ExperienceDirectory from '@/components/ExperienceDirectory';
export const revalidate=3600;
type Props={params:Promise<{area:string}>;searchParams:Promise<DiscoveryQuery>};
function regionName(slug:string){const area=SIDO_LIST.find(area=>(SIDO_SLUG as Record<string,string>)[area]===slug);if(!area)notFound();return area;}
export function generateStaticParams(){return SIDO_LIST.map(area=>({area:(SIDO_SLUG as Record<string,string>)[area]}));}
export async function generateMetadata({params,searchParams}:Props):Promise<Metadata>{const area=regionName((await params).area),records=currentExperiences().filter(item=>item.area===area),sample=records.slice(0,3).map(item=>item.title).join(', ');return {title:`${area} 체험 프로그램·농촌 체험 — 가족과 가볼 만한 곳`,description:`${area}에서 찾은 체험·교육 ${records.length}곳. ${sample}. 활동 내용, 일정, 참가대상과 신청 방법을 확인하세요.`.slice(0,160),alternates:{canonical:experienceRegionHref(area)},...(!records.length||Object.values(await searchParams).some(Boolean)?{robots:{index:false,follow:true}}:{})};}
export default async function RegionExperiences({params,searchParams}:Props){return <ExperienceDirectory region={regionName((await params).area)} query={await searchParams}/>;}
