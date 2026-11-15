import { withSearchMetadata } from '@/lib/searchMetadata';
import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import ExperienceDirectory from '@/components/ExperienceDirectory';
import {currentExperiences,type ExperienceKind} from '@/lib/experienceData';
import type {DiscoveryQuery} from '@/lib/publicDiscovery';
import {experienceDirectoryEditorial} from '@/lib/programmeEditorial.mjs';
export const revalidate=60;
type Props={params:Promise<{kind:string}>;searchParams:Promise<DiscoveryQuery>};
function kindKey(kind:string):ExperienceKind{if(!['family','science','rural'].includes(kind))notFound();return kind as ExperienceKind;}
export async function generateMetadata({params,searchParams}:Props):Promise<Metadata>{const kind=kindKey((await params).kind),{title,description}=experienceDirectoryEditorial({kind,records:currentExperiences().filter(item=>item.kind===kind)});return withSearchMetadata({title,description,alternates:{canonical:'/experiences/'+kind},...(Object.values(await searchParams).some(Boolean)?{robots:{index:false,follow:true}}:{})});}
export default async function ExperiencePage({params,searchParams}:Props){return <ExperienceDirectory kind={kindKey((await params).kind)} query={await searchParams}/>;}
