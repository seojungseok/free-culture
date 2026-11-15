import { withSearchMetadata } from '@/lib/searchMetadata';
import type {Metadata} from 'next';
import ExperienceDirectory from '@/components/ExperienceDirectory';
import type {DiscoveryQuery} from '@/lib/publicDiscovery';
import {currentExperiences} from '@/lib/experienceData';
import {experienceDirectoryEditorial} from '@/lib/programmeEditorial.mjs';
export const revalidate=60;
export async function generateMetadata({searchParams}:{searchParams:Promise<DiscoveryQuery>}):Promise<Metadata>{const query=await searchParams,{title,description}=experienceDirectoryEditorial({availability:typeof query.availability==='string'?query.availability:'',records:currentExperiences().filter(item=>item.kind!=='rural')});return withSearchMetadata({title,description,alternates:{canonical:'/experiences'},...(Object.values(query).some(Boolean)?{robots:{index:false,follow:true}}:{})});}
export default async function ExperienceHub({searchParams}:{searchParams:Promise<DiscoveryQuery>}){return <ExperienceDirectory query={await searchParams}/>;}
