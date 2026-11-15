import { withSearchMetadata } from '@/lib/searchMetadata';
import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {SIDO_LIST,SIDO_SLUG} from '@/lib/classify';
import {currentExperiences,experienceRegionHref} from '@/lib/experienceData';
import type {DiscoveryQuery} from '@/lib/publicDiscovery';
import ExperienceDirectory from '@/components/ExperienceDirectory';
import {experienceDirectoryEditorial} from '@/lib/programmeEditorial.mjs';
export const revalidate=60;
type Props={params:Promise<{area:string}>;searchParams:Promise<DiscoveryQuery>};
function regionName(slug:string){const area=SIDO_LIST.find(area=>(SIDO_SLUG as Record<string,string>)[area]===slug);if(!area)notFound();return area;}
export function generateStaticParams(){return SIDO_LIST.map(area=>({area:(SIDO_SLUG as Record<string,string>)[area]}));}
export async function generateMetadata({params,searchParams}:Props):Promise<Metadata>{const area=regionName((await params).area),records=currentExperiences().filter(item=>item.area===area&&item.kind!=='rural'),{title,description}=experienceDirectoryEditorial({region:area,records});return withSearchMetadata({title,description,alternates:{canonical:experienceRegionHref(area)},...(!records.length||Object.values(await searchParams).some(Boolean)?{robots:{index:false,follow:true}}:{})});}
export default async function RegionExperiences({params,searchParams}:Props){return <ExperienceDirectory region={regionName((await params).area)} query={await searchParams}/>;}
