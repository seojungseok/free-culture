import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import ExperienceDirectory from '@/components/ExperienceDirectory';
import {experienceTopics,type ExperienceKind} from '@/lib/experienceData';
import type {DiscoveryQuery} from '@/lib/publicDiscovery';
export const revalidate=3600;
type Props={params:Promise<{kind:string}>;searchParams:Promise<DiscoveryQuery>};
function kindKey(kind:string):ExperienceKind{if(!['family','science','rural'].includes(kind))notFound();return kind as ExperienceKind;}
export async function generateMetadata({params,searchParams}:Props):Promise<Metadata>{const kind=kindKey((await params).kind),topic=experienceTopics[kind];return {title:topic.title,description:topic.description,alternates:{canonical:'/experiences/'+kind},...(Object.values(await searchParams).some(Boolean)?{robots:{index:false,follow:true}}:{})};}
export default async function ExperiencePage({params,searchParams}:Props){return <ExperienceDirectory kind={kindKey((await params).kind)} query={await searchParams}/>;}
